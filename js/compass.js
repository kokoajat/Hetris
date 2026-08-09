/**
 * Kopautuskompassi: allekirjoituselementti, joka kertoo mitä peli näki.
 *
 * Kolme tehtävää:
 *  – välähdys sillä reunalla, johon kopautus tulkittiin
 *  – hylkäyksen syy keskellä, jotta pelaaja tietää iskun näkyneen mutta ei
 *    kelvanneen (juuri tämä tekee herkkyyden säätämisestä mahdollista)
 *  – mittarit, jotka näyttävät kopautuksen voiman ja säätimien rajat
 */

import {
    METER_DECAY,
    METER_MAX,
    REJECT_SHOW_MS,
    ROT_DECAY,
    ROT_MAX,
    ZONE_FLASH_MS
} from "./config.js";
import { el } from "./dom.js";
import { compassLabels } from "./settings.js";

export function createCompass(settings) {

    const zoneTimers = {};
    let coreTimer = null;
    let meterPeak = 0;
    let rotPeak = 0;

    /** Matalin voimassa oleva kynnys – mittari korostuu tämän yli. */
    function minSens() {
        const s = settings.sens;
        return settings.sideMode === "twist"
            ? Math.min(s.drop, s.rot)
            : Math.min(s.side, s.drop, s.rot);
    }

    function flashZone(name) {

        const zone = el.zones[name];
        if (!zone) return;

        zone.classList.add("hit");
        clearTimeout(zoneTimers[name]);
        zoneTimers[name] = setTimeout(() => zone.classList.remove("hit"), ZONE_FLASH_MS);

    }

    function showReject(reason) {

        el.tapCore.textContent = reason;
        el.tapCore.classList.add("miss");

        clearTimeout(coreTimer);
        coreTimer = setTimeout(() => {
            el.tapCore.classList.remove("miss");
            el.tapCore.innerHTML = compassLabels(settings).core;
        }, REJECT_SHOW_MS);

    }

    function refreshLabels() {

        const labels = compassLabels(settings);

        el.zones.top.textContent = labels.top;
        el.zones.bottom.textContent = labels.bottom;
        el.zones.left.innerHTML = labels.left;
        el.zones.right.innerHTML = labels.right;

        // hylkäysviesti saa olla rauhassa näkyvissä loppuun asti
        if (!el.tapCore.classList.contains("miss")) el.tapCore.innerHTML = labels.core;

    }

    function refreshTicks() {

        el.ticks.side.style.left = (settings.sens.side / METER_MAX) * 100 + "%";
        el.ticks.drop.style.left = (settings.sens.drop / METER_MAX) * 100 + "%";
        el.ticks.rot.style.left = (settings.sens.rot / METER_MAX) * 100 + "%";
        el.ticks.twist.style.left = (settings.twistRate / ROT_MAX) * 100 + "%";

        el.ticks.side.hidden = settings.sideMode === "twist";
        el.meterRot.hidden = settings.sideMode !== "twist";

    }

    /** Mittarit seuraavat huippua myös tauolla, jotta rajat voi säätää. */
    function noteSample({ sx, sy, wz }) {
        meterPeak = Math.max(meterPeak, Math.abs(sx), Math.abs(sy));
        rotPeak = Math.max(rotPeak, Math.abs(wz));
    }

    /** Huippu näkyy hetken ja valuu sitten pois. */
    function decay(dt) {

        meterPeak = Math.max(0, meterPeak - dt * METER_DECAY);
        el.meterFill.style.width = Math.min(100, (meterPeak / METER_MAX) * 100) + "%";
        el.meterFill.classList.toggle("over", meterPeak >= minSens());

        if (settings.sideMode !== "twist") return;

        rotPeak = Math.max(0, rotPeak - dt * ROT_DECAY);
        el.rotFill.style.width = Math.min(100, (rotPeak / ROT_MAX) * 100) + "%";
        el.rotFill.classList.toggle("over", rotPeak >= settings.twistRate);

    }

    return { flashZone, showReject, refreshLabels, refreshTicks, noteSample, decay };

}
