/**
 * Ohjausasetukset ja niistä johdetut tekstit. Puhdasta logiikkaa: sama
 * asetusolio ohjaa tunnistusta (`tap.js`) ja kompassin selitteitä
 * (`compass.js`), joten ne eivät voi olla eri mieltä siitä, mitä mikäkin
 * reuna tekee.
 */

import { DEFAULT_SENS, DEFAULT_TWIST_RATE } from "./config.js";

export function createSettings() {
    return {
        sens: { ...DEFAULT_SENS },
        twistRate: DEFAULT_TWIST_RATE,
        sideMode: "tap",     // "tap" = kopautus (kiihtyvyys) | "twist" = ranneväännös (gyro)
        inverted: false
    };
}

/**
 * Ruutunapautus välähtää sillä reunalla, joka tekisi saman kopautuksena.
 *
 * @param {string} action "left" | "right" | "drop" | "rotate"
 * @returns {string} kompassin lohko: "left" | "right" | "top" | "bottom"
 */
export function zoneFor(settings, action) {

    if (settings.sideMode === "twist" && (action === "left" || action === "right")) {
        return action;
    }

    switch (action) {
        case "left": return settings.inverted ? "left" : "right";
        case "right": return settings.inverted ? "right" : "left";
        case "drop": return settings.inverted ? "bottom" : "top";
        default: return settings.inverted ? "top" : "bottom";
    }

}

/**
 * Kompassin selitteet voimassa olevalle logiikalle. Väännöstilassa reunat
 * eivät kuvaa kopautuspaikkaa vaan lopputulosta, koska väännöksellä ei ole
 * kopautuspaikkaa.
 */
export function compassLabels(settings) {

    const top = settings.inverted ? "Käännä" : "Pudota";
    const bottom = settings.inverted ? "Pudota" : "Käännä";

    if (settings.sideMode === "twist") {
        return {
            top,
            bottom,
            left: "↺ Vasemmalle",
            right: "Oikealle ↻",
            core: "Väännä<br>ranteella"
        };
    }

    return {
        top,
        bottom,
        left: settings.inverted ? "← Vasemmalle" : "Oikealle →",
        right: settings.inverted ? "Oikealle →" : "← Vasemmalle",
        core: "Kopauta<br>reunaa"
    };

}
