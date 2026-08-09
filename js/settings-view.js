/**
 * Taukonäytön herkkyyssäätimet.
 *
 * Sama sivuttaissäädin palvelee kumpaakin ohjaustapaa, mutta yksikkö ja
 * asteikko vaihtuvat: kopautustilassa se on kiihtyvyysraja (m/s²),
 * väännöstilassa kulmanopeusraja (rad/s).
 */

import { TAP_RANGE, TWIST_RANGE } from "./config.js";
import { el } from "./dom.js";

/**
 * @param {object}   settings   Asetusolio, jota säätimet muokkaavat.
 * @param {object}   hooks
 * @param {Function} hooks.onChange  Kutsutaan aina, kun asetus muuttui.
 * @param {Function} hooks.canTwist  Onko gyro käytettävissä.
 * @param {Function} hooks.onRefused Väännöstila ei ole käytettävissä.
 */
export function initSettingsView(settings, { onChange, canTwist, onRefused }) {

    function bindSlider(key) {

        const { input, value } = el.sliders[key];

        const apply = () => {
            // sivuttaissäädin ohjaa väännöstilassa eri suuretta kuin kopautustilassa
            if (key === "side" && settings.sideMode === "twist") {
                settings.twistRate = Number(input.value);
                value.textContent = input.value + " rad/s";
            } else {
                settings.sens[key] = Number(input.value);
                value.textContent = input.value;
            }
            onChange();
        };

        input.addEventListener("input", apply);
        apply();

    }

    bindSlider("side");
    bindSlider("drop");
    bindSlider("rot");

    function setSideMode(mode) {

        settings.sideMode = mode;

        el.modeTap.classList.toggle("on", mode === "tap");
        el.modeTwist.classList.toggle("on", mode === "twist");

        const input = el.sliders.side.input;
        const value = el.sliders.side.value;

        if (mode === "twist") {
            el.labSide.textContent = "Väännöksen voimakkuus";
            el.dotSide.style.background = "#06D6A0";
            input.min = TWIST_RANGE.min;
            input.max = TWIST_RANGE.max;
            input.step = TWIST_RANGE.step;
            input.value = settings.twistRate;
            value.textContent = settings.twistRate + " rad/s";
        } else {
            el.labSide.textContent = "Sivuttaissiirto";
            el.dotSide.style.background = "#4CC9F0";
            input.min = TAP_RANGE.min;
            input.max = TAP_RANGE.max;
            input.step = TAP_RANGE.step;
            input.value = settings.sens.side;
            value.textContent = String(settings.sens.side);
        }

        onChange();

    }

    el.modeTap.addEventListener("click", () => setSideMode("tap"));

    el.modeTwist.addEventListener("click", () => {
        if (canTwist() === false) { onRefused("ei gyroa"); return; }
        setSideMode("twist");
    });

    el.invertTap.addEventListener("change", event => {
        settings.inverted = event.target.checked;
        onChange();
    });

}
