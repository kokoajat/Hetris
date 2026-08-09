/**
 * Yksikkötestit puhtaalle logiikalle. Ajetaan Nodella ilman riippuvuuksia:
 *
 *     npm test
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
    clearFullRows,
    collides,
    dropInterval,
    emptyBoard,
    ghostOffset,
    levelFor,
    lineScore,
    merge,
    rotateMatrix
} from "../js/board.js";
import { COLS, DEFAULT_SENS, REFRACTORY, ROWS } from "../js/config.js";
import { createGame } from "../js/game.js";
import { createMotionReader } from "../js/motion.js";
import { createBag, makePiece, shapeBounds, TYPES } from "../js/pieces.js";
import { compassLabels, createSettings, zoneFor } from "../js/settings.js";
import { createTapDetector } from "../js/tap.js";
import { createRandom } from "../js/utils.js";

/* ==================================================================
   Lauta
   ================================================================== */

/** Pala, jonka matriisi on yksi täysi ruutu – helpoin tapa testata rajoja. */
const dot = (x, y) => ({ type: "O", matrix: [[1]], x, y });

test("collides tunnistaa seinät ja lattian", () => {

    const board = emptyBoard();

    assert.equal(collides(board, dot(0, 0), -1, 0), true);
    assert.equal(collides(board, dot(COLS - 1, 0), 1, 0), true);
    assert.equal(collides(board, dot(0, ROWS - 1), 0, 1), true);
    assert.equal(collides(board, dot(5, 5), 0, 1), false);

});

test("laudan yläpuoli on sallittua tyhjää", () => {

    const board = emptyBoard();

    // pala syntyy osittain näkyvän alueen yläpuolelle, eikä se ole osuma
    assert.equal(collides(board, dot(4, -2), 0, 0), false);

    board[0][4] = "T";
    assert.equal(collides(board, dot(4, -1), 0, 1), true);

});

test("collides huomaa pinon", () => {

    const board = emptyBoard();
    board[10][3] = "T";

    assert.equal(collides(board, dot(3, 9), 0, 1), true);
    assert.equal(collides(board, dot(2, 9), 0, 1), false);

});

test("rotateMatrix kääntää myötäpäivään", () => {

    assert.deepEqual(
        rotateMatrix([[1, 0, 0], [1, 1, 1], [0, 0, 0]]),   // J
        [[0, 1, 1], [0, 1, 0], [0, 1, 0]]
    );

    // neljä kääntöä palauttaa alkutilan
    let m = [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
    const start = JSON.stringify(m);
    for (let i = 0; i < 4; i++) m = rotateMatrix(m);
    assert.equal(JSON.stringify(m), start);

});

test("merge kertoo, jäikö osa palasta laudan yläpuolelle", () => {

    const board = emptyBoard();

    assert.equal(merge(board, { type: "T", matrix: [[1], [1]], x: 2, y: 4 }), true);
    assert.equal(board[4][2], "T");
    assert.equal(board[5][2], "T");

    assert.equal(merge(board, { type: "I", matrix: [[1], [1]], x: 3, y: -1 }), false);
    assert.equal(board[0][3], "I");

});

test("clearFullRows poistaa rivit ja pudottaa ylemmät", () => {

    const board = emptyBoard();

    board[ROWS - 1] = new Array(COLS).fill("T");
    board[ROWS - 2] = new Array(COLS).fill("T");
    board[ROWS - 3][0] = "L";

    assert.equal(clearFullRows(board), 2);

    // yksinäinen kuutio valui kahden rivin verran alas
    assert.equal(board[ROWS - 1][0], "L");
    assert.equal(board[0].every(cell => cell === null), true);

});

test("clearFullRows käsittelee myös välissä olevat aukot", () => {

    const board = emptyBoard();

    board[ROWS - 1] = new Array(COLS).fill("T");
    board[ROWS - 2][1] = "Z";                       // vajaa rivi jää
    board[ROWS - 3] = new Array(COLS).fill("S");

    assert.equal(clearFullRows(board), 2);
    assert.equal(board[ROWS - 1][1], "Z");

});

test("pisteytys ja taso", () => {

    assert.equal(lineScore(1, 1), 100);
    assert.equal(lineScore(4, 1), 800);
    assert.equal(lineScore(4, 3), 2400);
    assert.equal(lineScore(0, 5), 0);

    assert.equal(levelFor(0), 1);
    assert.equal(levelFor(9), 1);
    assert.equal(levelFor(10), 2);
    assert.equal(levelFor(35), 4);

});

test("dropInterval kiihtyy tasoittain mutta pysähtyy rajaan", () => {

    assert.equal(dropInterval(1), 800);
    assert.equal(dropInterval(2), 735);
    assert.equal(dropInterval(20), 80);
    assert.equal(dropInterval(99), 80);

});

test("ghostOffset kertoo pudotusmatkan", () => {

    const board = emptyBoard();
    assert.equal(ghostOffset(board, dot(0, 0)), ROWS - 1);

    board[15][0] = "T";
    assert.equal(ghostOffset(board, dot(0, 0)), 14);

});

/* ==================================================================
   Palat
   ================================================================== */

test("pussi jakaa jokaisen palan kerran seitsikossa", () => {

    const bag = createBag(createRandom(7));
    const drawn = [];

    for (let i = 0; i < 14; i++) drawn.push(bag.take());

    assert.deepEqual([...new Set(drawn.slice(0, 7))].sort(), TYPES.slice().sort());
    assert.deepEqual([...new Set(drawn.slice(7, 14))].sort(), TYPES.slice().sort());

});

test("sama siemen antaa saman palajonon", () => {

    const a = createBag(createRandom("kops"));
    const b = createBag(createRandom("kops"));

    for (let i = 0; i < 20; i++) assert.equal(a.take(), b.take());

});

test("makePiece keskittää palan ja nostaa I-palan riviä ylemmäs", () => {

    assert.deepEqual(makePiece("O"), { type: "O", matrix: [[1, 1], [1, 1]], x: 4, y: 0 });
    assert.equal(makePiece("I").y, -1);
    assert.equal(makePiece("T").y, 0);
    assert.equal(makePiece("T").x, 3);

});

test("shapeBounds rajaa täytetyt ruudut", () => {

    const bounds = shapeBounds([[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]]);

    assert.deepEqual(bounds, { minX: 0, maxX: 3, minY: 1, maxY: 1, width: 4, height: 1 });

});

/* ==================================================================
   Peli
   ================================================================== */

function newGame(extra = {}) {
    const game = createGame({ random: createRandom(1), ...extra });
    game.start();
    return game;
}

test("siirto pysähtyy seinään", () => {

    const game = newGame();

    for (let i = 0; i < 20; i++) game.move(-1);

    const piece = game.state.piece;
    assert.equal(piece.x, 0);
    assert.equal(game.move(-1), false);

});

test("kova pudotus lukitsee palan ja antaa pisteet matkasta", () => {

    const game = newGame();
    const before = game.state.score;

    assert.equal(game.hardDrop(), true);

    // pala on laudan pohjalla ja pisteitä tuli matkan verran
    assert.equal(game.state.board[ROWS - 1].some(cell => cell), true);
    assert.ok(game.state.score > before);

});

test("täysi rivi tuhoutuu ja tuottaa pisteet", () => {

    const game = newGame();

    // rakennetaan valmis rivi yhtä ruutua vaille ja pudotetaan pala aukkoon
    const board = game.state.board;
    for (let x = 0; x < COLS; x++) board[ROWS - 1][x] = "T";
    board[ROWS - 1][0] = null;

    const piece = game.state.piece;
    piece.matrix = [[1]];
    piece.x = 0;
    piece.y = 0;

    game.hardDrop();

    assert.equal(game.state.lines, 1);
    assert.ok(game.state.score >= 100);
    assert.equal(board[ROWS - 1].every(cell => cell === null), true);

});

test("peli päättyy, kun pino kasvaa yli", () => {

    let overs = 0;
    const game = newGame({ onGameOver: () => overs++ });

    // Pino nostetaan ylös asti, mutta sarake 0 jätetään tyhjäksi: yksikään
    // rivi ei ole valmis, joten mikään ei tuhoudu vahingossa.
    const board = game.state.board;
    for (let y = 2; y < ROWS; y++) {
        for (let x = 1; x < COLS; x++) board[y][x] = "T";
    }

    for (let i = 0; i < 5 && !game.state.gameOver; i++) game.hardDrop();

    assert.equal(game.state.gameOver, true);
    assert.equal(game.state.running, false);
    assert.equal(overs, 1);

});

test("pehmeä pudotus kerryttää pisteen askeleelta", () => {

    const game = newGame();

    game.setSoftDrop(true);
    game.update(100);

    assert.equal(game.state.score, 1);

});

test("pala lukittuu vasta lukitusviiveen jälkeen", () => {

    const game = newGame();

    game.hardDrop();                     // ensimmäinen pala pohjalle
    const first = game.state.piece;

    while (game.state.piece === first && !game.state.gameOver) game.update(100);

    // pala ehti pohjaan asti ennen lukitusta
    assert.equal(game.state.board.flat().filter(Boolean).length > 0, true);

});

test("tauolla peli ei etene", () => {

    const game = newGame();
    const y = game.state.piece.y;

    game.togglePause();
    game.update(5000);

    assert.equal(game.state.piece.y, y);
    assert.equal(game.move(1), false);

    game.togglePause();
    game.update(5000);
    assert.ok(game.state.piece.y >= y);

});

/* ==================================================================
   Anturin luku
   ================================================================== */

const motionEvent = (x, y, alpha = null) => ({
    acceleration: { x, y, z: 0 },
    rotationRate: alpha === null ? null : { alpha, beta: 0, gamma: 0 }
});

test("pystyasennossa anturin akselit ovat ruudun akselit", () => {

    const reader = createMotionReader({ screenAngle: () => 0 });
    const sample = reader.read(motionEvent(3, -4));

    assert.equal(Math.round(sample.sx), 3);
    assert.equal(Math.round(sample.sy), -4);

});

test("vaaka-asennossa akselit kiertyvät ruudun mukana", () => {

    const reader = createMotionReader({ screenAngle: () => 90 });
    const sample = reader.read(motionEvent(0, 5));

    // puhelin työntyy laitteen y-suuntaan, mutta ruudulla se on oikealle
    assert.equal(Math.round(sample.sx), 5);
    assert.equal(Math.round(sample.sy), 0);

});

test("ilman acceleration-kenttää painovoima suodatetaan pois", () => {

    const reader = createMotionReader({ screenAngle: () => 0 });

    // vakaa lepotila: painovoima 9.81 alaspäin, ei iskua
    let sample;
    for (let i = 0; i < 200; i++) {
        sample = reader.read({ accelerationIncludingGravity: { x: 0, y: -9.81, z: 0 } });
    }
    assert.ok(Math.abs(sample.sy) < 0.5, `lepotilan jäännös ${sample.sy}`);

    // nopea isku näkyy lähes kokonaan
    sample = reader.read({ accelerationIncludingGravity: { x: 0, y: -9.81 + 8, z: 0 } });
    assert.ok(sample.sy > 7, `iskun voimakkuus ${sample.sy}`);

});

test("tyhjä otos ei lukitse lukutapaa eikä gyrotietoa", () => {

    const reader = createMotionReader({ screenAngle: () => 0 });

    // selaimet lähettävät tällaisen heti kuuntelijan lisäämisen jälkeen
    assert.equal(reader.read({ acceleration: null, accelerationIncludingGravity: null }), null);
    assert.equal(reader.hasGyro(), null);

    // oikea otos pääsee silti perille
    const sample = reader.read(motionEvent(0, 7, 40));
    assert.equal(Math.round(sample.sy), 7);
    assert.equal(reader.hasGyro(), true);

});

test("gyron olemassaolo tunnistetaan", () => {

    const withGyro = createMotionReader({ screenAngle: () => 0 });
    assert.equal(withGyro.hasGyro(), null);
    withGyro.read(motionEvent(1, 1, 30));
    assert.equal(withGyro.hasGyro(), true);

    const without = createMotionReader({ screenAngle: () => 0 });
    without.read(motionEvent(1, 1));
    assert.equal(without.hasGyro(), false);

});

/* ==================================================================
   Kopautuksen tunnistus
   ================================================================== */

/**
 * Simuloi yhden kopautuksen: isku ja sitä seuraava vastaheilahdus.
 *
 * Kiihtyvyys vaihtaa merkkinsä vastaheilahduksessa – juuri se on se ilmiö,
 * jonka takia suunta lukitaan ensimmäisestä otoksesta. Kulmanopeus sen sijaan
 * pitää merkkinsä koko eleen ajan: ranneväännös on yhteen suuntaan kiertyvä
 * liike, ei isku.
 *
 * @param detector
 * @param {object} shape  { sx, sy, wz } eleen huippuarvot
 * @param {object} opts   { start, swing, ms }
 * @returns viimeinen ei-tyhjä tulos
 */
function strike(detector, { sx = 0, sy = 0, wz = 0 }, { start = 1000, swing = 1.4, ms = 90 } = {}) {

    let result = null;

    for (let t = 0; t <= ms; t += 10) {

        const rising = t < 30;
        const phase = rising ? 1 : -swing;   // isku ensin, sitten vastaheilahdus
        const spin = rising ? 1 : 0.5;       // kierto laantuu suuntaa vaihtamatta

        const out = detector.feed({ sx: sx * phase, sy: sy * phase, wz: wz * spin }, start + t);
        if (out) result = out;

    }

    return result;
}

function quiet(detector, from, ms = 400) {
    for (let t = 0; t <= ms; t += 20) detector.feed({ sx: 0, sy: 0, wz: 0 }, from + t);
}

test("kopautus vasempaan reunaan siirtää palaa oikealle", () => {

    const detector = createTapDetector(createSettings());

    // vasempaan reunaan osuva isku työntää puhelinta oikealle: sx > 0
    assert.deepEqual(strike(detector, { sx: 9 }), { action: "right", zone: "left" });

});

test("kopautus oikeaan reunaan siirtää palaa vasemmalle", () => {

    const detector = createTapDetector(createSettings());

    assert.deepEqual(strike(detector, { sx: -9 }), { action: "left", zone: "right" });

});

test("vastaheilahdus ei käännä suuntaa", () => {

    // vastaheilahdus on iskua voimakkaampi – ilman suunnan lukitusta
    // tulos olisi päinvastainen
    const detector = createTapDetector(createSettings());

    assert.deepEqual(strike(detector, { sx: 7 }, { swing: 2.5 }), { action: "right", zone: "left" });

});

test("liian kevyt kopautus hylätään syyn kera", () => {

    const detector = createTapDetector(createSettings());

    // ylittää heräämisrajan (min 2.5) mutta jää sivuttaiskynnyksen (5) alle
    assert.deepEqual(strike(detector, { sx: 3.2 }), { reject: "liian kevyt" });

});

test("kopautus yläreunaan pudottaa, alareunaan kääntää", () => {

    const down = createTapDetector(createSettings());
    // yläreunan isku työntää puhelinta alas: sy < 0
    assert.deepEqual(strike(down, { sy: -9 }), { action: "drop", zone: "top" });

    const up = createTapDetector(createSettings());
    assert.deepEqual(strike(up, { sy: 9 }), { action: "rotate", zone: "bottom" });

});

test("käänteinen kopautus vaihtaa toiminnot mutta ei välähdystä", () => {

    const settings = createSettings();
    settings.inverted = true;

    const detector = createTapDetector(settings);

    assert.deepEqual(strike(detector, { sx: 9 }), { action: "left", zone: "left" });

    quiet(detector, 1500);
    assert.deepEqual(strike(detector, { sy: 9 }, { start: 2000 }), { action: "drop", zone: "bottom" });

});

test("aikaisemmin herännyt akseli voittaa", () => {

    const detector = createTapDetector(createSettings());

    // pystyakseli herää ensin, vaikka vaaka-akseli on lopulta voimakkaampi
    detector.feed({ sx: 0, sy: 6 }, 1000);
    detector.feed({ sx: 12, sy: 8 }, 1020);
    const result = detector.feed({ sx: 12, sy: 8 }, 1070);

    assert.deepEqual(result, { action: "rotate", zone: "bottom" });

});

test("suojatauko estää iskun kaksinkertaisen laukeamisen", () => {

    const detector = createTapDetector(createSettings());

    assert.ok(strike(detector, { sx: 9 }).action);

    // heti perään tuleva isku osuu suojataukoon
    assert.equal(strike(detector, { sx: 9 }, { start: 1100 }), null);

    // rauhoittumisen jälkeen tunnistus toimii taas
    quiet(detector, 1300);
    assert.ok(strike(detector, { sx: 9 }, { start: 1800 }).action);

});

test("uusi peli rauhoittaa tunnistimen aloitushetkeksi", () => {

    const detector = createTapDetector(createSettings());
    detector.reset(1000);

    assert.equal(strike(detector, { sx: 12 }, { start: 1000, ms: REFRACTORY - 20 }), null);

});

test("väännöstilassa sivuttaissiirto luetaan gyrosta", () => {

    const settings = createSettings();
    settings.sideMode = "twist";

    const left = createTapDetector(settings);
    assert.deepEqual(strike(left, { wz: 3 }, { ms: 200 }), { action: "left", zone: "left" });

    const right = createTapDetector(settings);
    assert.deepEqual(strike(right, { wz: -3 }, { ms: 200 }), { action: "right", zone: "right" });

});

test("vajaa väännös vaimennetaan, jottei se pudota palaa", () => {

    const settings = createSettings();
    settings.sideMode = "twist";

    const detector = createTapDetector(settings);

    // kierto jää kynnyksen (2 rad/s) alle mutta ylittää vaimennusrajan (1.4),
    // ja mukana on pystykiihtyvyyttä joka muuten laukaisisi pudotuksen
    assert.deepEqual(
        strike(detector, { sy: -9, wz: 1.6 }, { ms: 200 }),
        { reject: "vajaa väännös" }
    );

});

test("väännöstilassa pystykopautus toimii yhä", () => {

    const settings = createSettings();
    settings.sideMode = "twist";

    const detector = createTapDetector(settings);

    assert.deepEqual(strike(detector, { sy: -9 }, { ms: 200 }), { action: "drop", zone: "top" });

});

test("väännöstila ei käytä sivuttaiskynnystä heräämiseen", () => {

    const settings = createSettings();
    settings.sideMode = "twist";
    settings.sens.side = 15;              // korkeinkaan sivuttaisraja ei estä

    const detector = createTapDetector(settings);

    assert.deepEqual(strike(detector, { wz: 3 }, { ms: 200 }), { action: "left", zone: "left" });

});

test("herkkyyden kiristäminen näkyy heti seuraavassa iskussa", () => {

    const settings = createSettings();
    const detector = createTapDetector(settings);

    settings.sens.side = 12;

    assert.deepEqual(strike(detector, { sx: 9 }), { reject: "liian kevyt" });

});

/* ==================================================================
   Asetusten johdetut tekstit
   ================================================================== */

test("ruutunapautus välähtää kopautusta vastaavalla reunalla", () => {

    const settings = createSettings();

    assert.equal(zoneFor(settings, "left"), "right");
    assert.equal(zoneFor(settings, "right"), "left");
    assert.equal(zoneFor(settings, "drop"), "top");
    assert.equal(zoneFor(settings, "rotate"), "bottom");

    settings.inverted = true;
    assert.equal(zoneFor(settings, "left"), "left");
    assert.equal(zoneFor(settings, "drop"), "bottom");

    // väännöstilassa reunat kuvaavat lopputulosta, eivät kopautuspaikkaa
    settings.sideMode = "twist";
    assert.equal(zoneFor(settings, "left"), "left");
    assert.equal(zoneFor(settings, "right"), "right");

});

test("kompassin selitteet seuraavat voimassa olevaa logiikkaa", () => {

    const settings = createSettings();

    assert.equal(compassLabels(settings).top, "Pudota");
    assert.equal(compassLabels(settings).left, "Oikealle →");

    settings.inverted = true;
    assert.equal(compassLabels(settings).top, "Käännä");
    assert.equal(compassLabels(settings).left, "← Vasemmalle");

    settings.sideMode = "twist";
    assert.match(compassLabels(settings).core, /Väännä/);
    assert.equal(compassLabels(settings).left, "↺ Vasemmalle");

});

test("oletusherkkyydet vastaavat HTML:n liukusäätimiä", () => {

    // jos nämä eriävät, taukonäyttö näyttäisi eri luvut kuin peli käyttää
    assert.deepEqual(createSettings().sens, DEFAULT_SENS);

});
