/**
 * Käynnistys ja kytkennät.
 *
 * Tässä tiedostossa ei ole pelisääntöjä eikä tunnistuslogiikkaa – se lukee
 * syötteet, yhdistää moduulit toisiinsa ja pyörittää kuvaruutusilmukkaa.
 */

import { createCompass } from "./compass.js";
import { VIBRATE } from "./config.js";
import { initControls } from "./controls.js";
import { el } from "./dom.js";
import { createGame } from "./game.js";
import { createRenderer } from "./render.js";
import { createSensors } from "./sensors.js";
import {
    hideAll,
    keepAwake,
    showGameOver,
    showPause,
    showSensorError,
    showStart,
    updateStats
} from "./screens.js";
import { createSettings, zoneFor } from "./settings.js";
import { initSettingsView } from "./settings-view.js";
import { createTapDetector } from "./tap.js";
import { createRandom } from "./utils.js";

/* ------------------------------------------------------------------
   Osat
   ------------------------------------------------------------------ */

/** `?seed=` tekee palojen järjestyksestä toistettavan (testit, bugiraportit). */
const seed = new URLSearchParams(location.search).get("seed");

const settings = createSettings();
const renderer = createRenderer(el.board, el.next);
const compass = createCompass(settings);
const detector = createTapDetector(settings);

const game = createGame({
    random: seed === null ? Math.random : createRandom(seed),
    onSpawn: () => renderer.drawNext(game.state.nextType),
    onChange: () => renderer.draw(game.state),
    onGameOver: () => showGameOver(game.state)
});

const sensors = createSensors({
    onSample: handleSample,
    onError: showSensorError
});

/* ------------------------------------------------------------------
   Anturinäytteet
   ------------------------------------------------------------------ */

function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}

/** Kompassin lohko kertoo aina, mihin reunaan isku tulkittiin osuneen –
 *  myös silloin, kun siirto ei mahtunut tai peli on tauolla. */
function applyTap(result) {

    compass.flashZone(result.zone);

    switch (result.action) {
        case "left": game.move(-1); vibrate(VIBRATE.move); break;
        case "right": game.move(1); vibrate(VIBRATE.move); break;
        case "rotate": game.rotate(); vibrate(VIBRATE.rotate); break;
        case "drop": game.hardDrop(); vibrate(VIBRATE.drop); break;
    }

}

function handleSample(sample, now) {

    compass.noteSample(sample);

    const result = detector.feed(sample, now);
    if (!result) return;

    if (result.reject) compass.showReject(result.reject);
    else applyTap(result);

}

/* ------------------------------------------------------------------
   Ohjaimet
   ------------------------------------------------------------------ */

initControls({
    move: dir => game.move(dir),
    rotate: () => game.rotate(),
    hardDrop: () => game.hardDrop(),
    setSoftDrop: on => game.setSoftDrop(on),
    togglePause: togglePause,
    playable: () => game.playable(),
    onAction: action => compass.flashZone(zoneFor(settings, action))
});

initSettingsView(settings, {
    onChange: () => {
        compass.refreshTicks();
        compass.refreshLabels();
        detector.rearm();
    },
    canTwist: sensors.hasGyro,
    onRefused: reason => compass.showReject(reason)
});

/* ------------------------------------------------------------------
   Pelin hallinta
   ------------------------------------------------------------------ */

function startGame() {
    detector.reset(performance.now());
    game.start();
    updateStats(game.state);
    hideAll();
    keepAwake();
}

function togglePause() {
    if (!game.state.running || game.state.gameOver) return;
    showPause(game.togglePause());
}

el.startBtn.addEventListener("click", async () => {
    await sensors.enable();
    startGame();
});
el.againBtn.addEventListener("click", startGame);
el.restartBtn.addEventListener("click", startGame);
el.resumeBtn.addEventListener("click", togglePause);
el.pauseBtn.addEventListener("click", togglePause);
el.settingsBtn.addEventListener("click", () => { if (!game.state.paused) togglePause(); });

/** Selaimen taustalle jäänyt peli ei saa jatkua näkymättömissä. */
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        if (game.state.running && !game.state.paused) togglePause();
    } else {
        keepAwake();
    }
});

/* ------------------------------------------------------------------
   Kuvaruutusilmukka
   ------------------------------------------------------------------ */

let lastFrame = 0;

function loop(now) {

    requestAnimationFrame(loop);

    const dt = Math.min(100, now - lastFrame);
    lastFrame = now;

    compass.decay(dt);

    if (!game.playable()) return;

    game.update(dt);
    updateStats(game.state);
    renderer.draw(game.state);

}

/* ------------------------------------------------------------------
   Käynnistys
   ------------------------------------------------------------------ */

function resize() {
    renderer.resize();
    renderer.draw(game.state);
}

window.addEventListener("resize", resize);

if (screen.orientation && screen.orientation.addEventListener) {
    // kierto asettuu vasta hetken kuluttua, joten mitataan viiveellä
    screen.orientation.addEventListener("change", () => setTimeout(resize, 200));
}

compass.refreshLabels();
compass.refreshTicks();
showStart();
resize();

requestAnimationFrame(now => { lastFrame = now; loop(now); });
