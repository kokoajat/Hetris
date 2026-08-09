/**
 * Kopautuksen tunnistus.
 *
 * Yksi sääntö ohjaa kaikkea: pala liikkuu siihen suuntaan, mihin puhelin
 * työntyy. Kopautus yläreunaan työntää puhelinta alas, joten pala putoaa.
 * Kopautus oikeaan reunaan työntää vasemmalle, joten pala siirtyy vasemmalle.
 *
 * Isku näkyy anturissa nousevana reunana ja sitä seuraavana
 * vastaheilahduksena, joka on kädessä pidettävässä puhelimessa usein
 * voimakkaampi kuin isku itse. Siksi kummankin akselin suunta lukitaan sen
 * ENSIMMÄISESTÄ merkittävästä otoksesta, ja voimakkuudeksi lasketaan vain
 * samansuuntaiset otokset. Ilman tätä vastaheilahdus voitti ja pala liikkui
 * vastakkaiseen suuntaan kuin kopautettiin.
 *
 * Lisäksi voittava akseli päätetään herätysjärjestyksestä: aikaisemmin
 * herännyt akseli on se, johon isku kohdistui. Epäselvä isku hylätään –
 * arvaus väärään suuntaan on pelaajalle pahempi kuin tekemätön siirto.
 *
 * Moduuli on puhdas siinä mielessä, että aika ja näytteet annetaan sisään:
 * kokonaisia kopautuksia voi siis simuloida testissä.
 */

import {
    CAPTURE_WINDOW,
    GATE_FACTOR,
    REARM_LEVEL,
    REARM_MAX,
    REFRACTORY,
    REJECT_PAUSE,
    TWIST_SUPPRESS,
    TWIST_WINDOW
} from "./config.js";

/**
 * @param {object} settings  Elävä asetusolio: { sens:{side,drop,rot},
 *                           twistRate, sideMode, inverted }.
 */
export function createTapDetector(settings) {

    let capturing = false, captureStart = 0;
    let leadX = 0, leadY = 0;                   // akselin lukittu suunta (-1 / 0 / 1)
    let strX = 0, strY = 0;                     // voimakkuus lukittuun suuntaan
    let onsetX = Infinity, onsetY = Infinity;   // milloin akseli heräsi
    let peakW = 0;                              // kulmanopeuden huippu, etumerkki mukana
    let cooldownUntil = 0, armed = true;

    /** Matalin voimassa oleva kynnys. Väännöstilassa sivuttaiskynnys ei ole
     *  kiihtyvyysraja lainkaan, joten se jätetään pois. */
    function minSens() {
        const s = settings.sens;
        return settings.sideMode === "twist"
            ? Math.min(s.drop, s.rot)
            : Math.min(s.side, s.drop, s.rot);
    }

    function sample(sx, sy, wz, now) {

        if (Math.abs(wz) > Math.abs(peakW)) peakW = wz;

        const gate = minSens() * GATE_FACTOR;

        // lukitaan akselin suunta JA herätyshetki ensimmäisestä otoksesta,
        // joka ylittää portin
        if (!leadX && Math.abs(sx) >= gate) { leadX = Math.sign(sx); onsetX = now; }
        if (!leadY && Math.abs(sy) >= gate) { leadY = Math.sign(sy); onsetY = now; }

        // vain lukitun suunnan mukaiset otokset kasvattavat voimakkuutta
        if (leadX && Math.sign(sx) === leadX) strX = Math.max(strX, Math.abs(sx));
        if (leadY && Math.sign(sy) === leadY) strY = Math.max(strY, Math.abs(sy));

    }

    function resolveVertical() {

        if (!leadY) return { reject: "epäselvä" };

        const pushedUp = leadY > 0;                     // kopautus alareunaan
        const doRotate = settings.inverted ? !pushedUp : pushedUp;

        if (strY < (doRotate ? settings.sens.rot : settings.sens.drop)) {
            return { reject: "liian kevyt" };
        }

        return {
            action: doRotate ? "rotate" : "drop",
            zone: pushedUp ? "bottom" : "top"
        };

    }

    function resolve() {

        /* VÄÄNNÖSTILA: sivuttaissiirto luetaan gyrosta, pysty kiihtyvyydestä.
           Nämä ovat eri antureita, joten akseleita ei tarvitse erotella
           toisistaan lainkaan – juuri siksi tämä tila on tarkempi. */
        if (settings.sideMode === "twist") {

            if (Math.abs(peakW) >= settings.twistRate) {
                const left = peakW > 0;                 // vastapäivään = kuin rattia vasemmalle
                const goLeft = settings.inverted ? !left : left;
                return { action: goLeft ? "left" : "right", zone: left ? "left" : "right" };
            }

            // Vaimennus: keskeneräisen väännöksen kiihtyvyysjälki ei saa
            // laukaista pudotusta.
            if (Math.abs(peakW) >= settings.twistRate * TWIST_SUPPRESS) {
                return { reject: "vajaa väännös" };
            }

            return resolveVertical();

        }

        /* KOPAUTUSTILA: akseli ratkaistaan herätysjärjestyksestä ja
           voimakkuudesta. Simulaatio: n. 82 % oikein, 4 % väärään suuntaan. */
        const horizontal = (onsetX === onsetY) ? (strX >= strY) : (onsetX < onsetY);

        if (!horizontal) return resolveVertical();

        if (!leadX) return { reject: "epäselvä" };
        if (strX < settings.sens.side) return { reject: "liian kevyt" };

        const pushedRight = leadX > 0;                  // kopautus vasempaan reunaan
        const goRight = settings.inverted ? !pushedRight : pushedRight;

        return { action: goRight ? "right" : "left", zone: pushedRight ? "left" : "right" };

    }

    /**
     * Syötä yksi anturinäyte.
     *
     * @returns {null|{action:string, zone:string}|{reject:string}}
     *          null, kun isku on vielä kesken tai mitään ei tapahtunut.
     */
    function feed({ sx, sy, wz = 0 }, now) {

        if (now < cooldownUntil) return null;

        if (!armed) {
            // Vastaheilahdus estetään odottamalla rauhallista otosta – mutta ei
            // ikuisesti, sillä muuten heti perään tuleva kopautus jäisi syömättä.
            const loud = Math.max(Math.abs(sx), Math.abs(sy)) >= minSens() * REARM_LEVEL;
            if (loud && now - cooldownUntil < REARM_MAX) return null;
            armed = true;
        }

        if (!capturing) {

            // keruu alkaa matalimmasta rajasta – väännöstilassa myös riittävästä
            // kierrosta, koska sen kiihtyvyysjälki voi jäädä kynnyksen alle
            const wake = Math.max(Math.abs(sx), Math.abs(sy)) >= minSens() ||
                (settings.sideMode === "twist" && Math.abs(wz) >= settings.twistRate * 0.5);

            if (!wake) return null;

            capturing = true;
            captureStart = now;
            leadX = leadY = 0;
            strX = strY = 0;
            onsetX = onsetY = Infinity;
            peakW = 0;

            sample(sx, sy, wz, now);
            return null;

        }

        sample(sx, sy, wz, now);

        const windowMs = settings.sideMode === "twist" ? TWIST_WINDOW : CAPTURE_WINDOW;
        if (now - captureStart < windowMs) return null;

        capturing = false;
        armed = false;

        const result = resolve();
        cooldownUntil = now + (result.action ? REFRACTORY : REJECT_PAUSE);

        return result;

    }

    /** Keskeytä kesken oleva keruu, esimerkiksi tilaa vaihdettaessa. */
    function rearm() {
        capturing = false;
        armed = true;
    }

    /** Uusi peli: rauhoitutaan hetki, jottei aloitusnapin painallus laukaise mitään. */
    function reset(now) {
        rearm();
        cooldownUntil = now + REFRACTORY;
    }

    return { feed, rearm, reset };

}
