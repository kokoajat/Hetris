/**
 * Varaohjaus: näppäimistö ja ruudun napautus.
 *
 * Nämä toimivat aina, myös ilman liikeanturia – tietokoneella pelaaminen ja
 * anturiluvan epääminen eivät saa jättää peliä ohjauksettomaksi.
 */

import { el } from "./dom.js";

/**
 * @param {object}   actions
 * @param {Function} actions.move         (-1 | 1)
 * @param {Function} actions.rotate
 * @param {Function} actions.hardDrop
 * @param {Function} actions.setSoftDrop  (boolean)
 * @param {Function} actions.togglePause
 * @param {Function} actions.playable
 * @param {Function} actions.onAction     (action) – kompassin välähdystä varten
 */
export function initControls(actions) {

    document.addEventListener("keydown", event => {

        if (event.key === "p" || event.key === "P") { actions.togglePause(); return; }
        if (!actions.playable()) return;

        switch (event.key) {
            case "ArrowLeft": actions.move(-1); break;
            case "ArrowRight": actions.move(1); break;
            case "ArrowUp": actions.rotate(); break;
            case "ArrowDown": actions.setSoftDrop(true); break;
            case " ": event.preventDefault(); actions.hardDrop(); break;
            default: return;
        }

    });

    document.addEventListener("keyup", event => {
        if (event.key === "ArrowDown") actions.setSoftDrop(false);
    });

    /* Ruudulla napautus toimii suoraan: vasen laita = vasemmalle,
       oikea laita = oikealle, ylös = pudota, alas = käännä. */
    el.board.addEventListener("pointerdown", event => {

        if (!actions.playable()) return;

        const rect = el.board.getBoundingClientRect();
        const fx = (event.clientX - rect.left) / rect.width;
        const fy = (event.clientY - rect.top) / rect.height;

        if (fx < 0.3) { actions.move(-1); actions.onAction("left"); }
        else if (fx > 0.7) { actions.move(1); actions.onAction("right"); }
        else if (fy < 0.5) { actions.hardDrop(); actions.onAction("drop"); }
        else { actions.rotate(); actions.onAction("rotate"); }

    });

}
