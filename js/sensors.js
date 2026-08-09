/**
 * Liikeanturin käyttöönotto.
 *
 * iOS vaatii luvan, ja lupa on kysyttävä käyttäjän eleestä – siksi tämä
 * kutsutaan vasta aloitusnapista. Epäonnistuminen ei ole pelin loppu:
 * näppäimistö ja ruudun napautus toimivat joka tapauksessa.
 */

import { createMotionReader } from "./motion.js";

/**
 * @param {object}   hooks
 * @param {Function} hooks.onSample  Normalisoitu näyte { sx, sy, wz }.
 * @param {Function} hooks.onError   Virheteksti näytettäväksi.
 */
export function createSensors({ onSample, onError }) {

    const reader = createMotionReader();
    let listening = false;

    function handle(event) {
        const sample = reader.read(event);
        if (sample) onSample(sample, performance.now());
    }

    async function enable() {

        if (listening) return true;

        try {

            if (typeof DeviceMotionEvent !== "undefined" &&
                typeof DeviceMotionEvent.requestPermission === "function") {

                const response = await DeviceMotionEvent.requestPermission();
                if (response !== "granted") throw new Error("Liikeanturin lupa evättiin.");

            }

            window.addEventListener("devicemotion", handle);
            listening = true;
            onError(null);
            return true;

        } catch (ex) {
            onError(ex.message + " Voit pelata näppäimistöllä tai ruutua napauttamalla.");
            return false;
        }

    }

    return { enable, hasGyro: reader.hasGyro };

}
