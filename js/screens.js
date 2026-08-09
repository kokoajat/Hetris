/**
 * Peittokerrokset, tilastonumerot ja näytön valveillapito.
 */

import { el } from "./dom.js";

export function showStart() {
    el.startScreen.hidden = false;
    el.pauseScreen.hidden = true;
    el.overScreen.hidden = true;
}

export function hideAll() {
    el.startScreen.hidden = true;
    el.pauseScreen.hidden = true;
    el.overScreen.hidden = true;
    el.pauseBtn.textContent = "Tauko";
}

export function showPause(paused) {
    el.pauseScreen.hidden = !paused;
    el.pauseBtn.textContent = paused ? "Jatka" : "Tauko";
}

export function showGameOver(state) {
    el.finalScore.textContent =
        `${state.score} pistettä · ${state.lines} riviä · taso ${state.level}`;
    el.overScreen.hidden = false;
}

export function showSensorError(message) {
    el.sensorErr.textContent = message || "";
    el.sensorErr.hidden = !message;
}

export function updateStats(state) {
    el.score.textContent = state.score;
    el.lines.textContent = state.lines;
    el.level.textContent = state.level;
}

/** Näyttö ei saa sammua kesken pelin. Ei kriittinen, joten virheet nielaistaan. */
export async function keepAwake() {
    try {
        if ("wakeLock" in navigator) await navigator.wakeLock.request("screen");
    } catch {
        /* selain kieltäytyi – peli toimii silti */
    }
}
