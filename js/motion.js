/**
 * Liikeanturin lukeminen: DeviceMotionEvent sisään, ruudun akseleille
 * käännetty näyte ulos.
 *
 * Kaksi selainkohtaista mutkaa hoidetaan tässä, jotta tunnistuslogiikan ei
 * tarvitse tietää niistä:
 *
 *  1. `acceleration` (painovoima poistettuna) puuttuu osasta selaimia. Silloin
 *     painovoima suodatetaan itse `accelerationIncludingGravity`-kentästä
 *     liukuvalla keskiarvolla: hidas komponentti on painovoima, nopea on isku.
 *  2. Puhelin voi olla vaakatasossa. Anturin akselit käännetään ruudun
 *     akseleiksi, jotta "oikealle" tarkoittaa aina ruudulla oikealle.
 */

import { DEG, GRAVITY_SMOOTHING } from "./config.js";

function defaultScreenAngle() {
    if (screen.orientation && typeof screen.orientation.angle === "number") {
        return screen.orientation.angle;
    }
    return window.orientation || 0;
}

/**
 * @param {object} [options]
 * @param {() => number} [options.screenAngle] Ruudun kiertokulma asteina.
 */
export function createMotionReader({ screenAngle = defaultScreenAngle } = {}) {

    let useLinear = null;   // onko acceleration-kenttä käytettävissä
    let gX = 0, gY = 0;     // painovoiman liukuva arvio varareitille
    let gyroReady = null;   // onko rotationRate käytettävissä

    /**
     * @returns {{sx:number, sy:number, wz:number}|null}
     *          sx > 0 = puhelin työntyy ruudulla oikealle,
     *          sy > 0 = puhelin työntyy ylös,
     *          wz     = kulmanopeus ruudun tason ympäri (rad/s).
     */
    function read(event) {

        let ax, ay;

        const acc = event.acceleration;
        const gravity = event.accelerationIncludingGravity;

        const hasLinear = !!(acc && typeof acc.y === "number");
        const hasGravity = !!(gravity && typeof gravity.y === "number");

        // Tyhjä otos ei kerro anturista mitään. Selaimet lähettävät sellaisen
        // heti kuuntelijan lisäämisen jälkeen, kun mittausta ei vielä ole –
        // jos se saisi päättää lukutavan, koko peli jäisi väärälle reitille.
        if (!hasLinear && !hasGravity) return null;

        if (useLinear === null) useLinear = hasLinear;

        // Varareitille pudotaan tapahtumakohtaisesti: osa selaimista lähettää
        // acceleration-kentän vain ajoittain, eikä yksi tyhjä otos saa kaataa peliä.
        if (useLinear && hasLinear) {

            ax = acc.x || 0;
            ay = acc.y || 0;

        } else if (hasGravity) {

            // ylipäästösuodatin: hidas painovoimakomponentti pois, nopea isku jää
            gX = gX * GRAVITY_SMOOTHING + (gravity.x || 0) * (1 - GRAVITY_SMOOTHING);
            gY = gY * GRAVITY_SMOOTHING + (gravity.y || 0) * (1 - GRAVITY_SMOOTHING);

            ax = (gravity.x || 0) - gX;
            ay = (gravity.y || 0) - gY;

        } else {

            // lukutavaksi valikoitui lineaarinen, mutta juuri tästä otoksesta
            // se puuttuu – yksi väliin jäänyt näyte ei haittaa
            return null;

        }

        const rad = (((screenAngle() % 360) + 360) % 360) * DEG;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const rr = event.rotationRate;
        let wz = 0;

        if (rr && typeof rr.alpha === "number") {
            wz = rr.alpha * DEG;
            gyroReady = true;
        } else if (gyroReady === null) {
            gyroReady = false;
        }

        return {
            sx: ax * cos + ay * sin,
            sy: ay * cos - ax * sin,
            wz
        };

    }

    return {
        read,
        /** true / false / null (ei vielä tiedossa) */
        hasGyro: () => gyroReady
    };

}
