/**
 * Pelin tila ja säännöt. Ei tiedä mitään DOM:ista, kankaasta eikä
 * antureista – ohjaus tulee sisään metodikutsuina ja tieto ulos
 * takaisinkutsuina. Koko peliä voi siis ajaa testissä ilman selainta.
 */

import {
    clearFullRows,
    collides,
    dropInterval,
    emptyBoard,
    levelFor,
    lineScore,
    merge,
    rotateMatrix
} from "./board.js";
import {
    HARD_DROP_POINTS,
    KICKS,
    LOCK_DELAY,
    MAX_LOCK_RESETS,
    SOFT_DROP_MS,
    SOFT_DROP_POINTS
} from "./config.js";
import { createBag, makePiece } from "./pieces.js";

/**
 * @param {object} [options]
 * @param {() => number} [options.random]      Satunnaislukulähde palojen arvontaan.
 * @param {() => void}   [options.onSpawn]     Uusi pala syntyi (esikatselu päivitettävä).
 * @param {() => void}   [options.onChange]    Näkymä kaipaa piirtoa heti.
 * @param {() => void}   [options.onGameOver]  Peli päättyi.
 */
export function createGame({ random, onSpawn, onChange, onGameOver } = {}) {

    const notifySpawn = onSpawn || (() => {});
    const notifyChange = onChange || (() => {});
    const notifyOver = onGameOver || (() => {});

    let board = emptyBoard();
    let bag = createBag(random);
    let piece = null;
    let nextType = null;

    let score = 0, lines = 0, level = 1;
    let dropTimer = 0, lockTimer = 0, lockResets = 0;
    let running = false, paused = false, gameOver = true;
    let softDropping = false;

    /* --------------------------------------------------------------
       Kyselyt
       -------------------------------------------------------------- */

    const state = {
        get board() { return board; },
        get piece() { return piece; },
        get nextType() { return nextType; },
        get score() { return score; },
        get lines() { return lines; },
        get level() { return level; },
        get running() { return running; },
        get paused() { return paused; },
        get gameOver() { return gameOver; }
    };

    function playable() {
        return running && !paused && !gameOver && !!piece;
    }

    /* --------------------------------------------------------------
       Palan elinkaari
       -------------------------------------------------------------- */

    function spawn() {

        piece = makePiece(nextType || bag.take());
        nextType = bag.take();
        dropTimer = 0; lockTimer = 0; lockResets = 0;

        notifySpawn();

        if (collides(board, piece, 0, 0)) endGame();

    }

    /** Siirto tai kääntö saa lykätä lukitusta, mutta vain rajallisen määrän
     *  kertoja – muuten palaa voisi pyörittää pinon päällä loputtomiin. */
    function touchLock() {
        if (collides(board, piece, 0, 1) && lockResets < MAX_LOCK_RESETS) {
            lockTimer = 0;
            lockResets++;
        }
    }

    function stepDown() {
        if (collides(board, piece, 0, 1)) return false;
        piece.y++;
        lockTimer = 0;
        return true;
    }

    function lockPiece() {

        if (!merge(board, piece)) { endGame(); return; }

        const cleared = clearFullRows(board);

        if (cleared) {
            score += lineScore(cleared, level);
            lines += cleared;
            level = levelFor(lines);
        }

        if (!gameOver) spawn();

    }

    /* --------------------------------------------------------------
       Ohjaus
       -------------------------------------------------------------- */

    function move(dir) {
        if (!playable()) return false;
        if (collides(board, piece, dir, 0)) return false;
        piece.x += dir;
        touchLock();
        notifyChange();
        return true;
    }

    function rotate() {

        if (!playable()) return false;

        const rotated = rotateMatrix(piece.matrix);

        for (const [kx, ky] of KICKS) {
            if (collides(board, piece, kx, ky, rotated)) continue;
            piece.matrix = rotated;
            piece.x += kx;
            piece.y += ky;
            touchLock();
            notifyChange();
            return true;
        }

        return false;
    }

    function hardDrop() {

        if (!playable()) return false;

        let dist = 0;
        while (stepDown()) dist++;

        score += dist * HARD_DROP_POINTS;
        lockPiece();
        notifyChange();

        return true;
    }

    function setSoftDrop(on) {
        softDropping = !!on;
    }

    /* --------------------------------------------------------------
       Elinkaari
       -------------------------------------------------------------- */

    function start() {
        board = emptyBoard();
        bag = createBag(random);
        nextType = null;
        score = 0; lines = 0; level = 1;
        softDropping = false;
        gameOver = false; paused = false; running = true;
        spawn();
        notifyChange();
    }

    function endGame() {
        gameOver = true;
        running = false;
        notifyOver();
    }

    function togglePause() {
        if (!running || gameOver) return false;
        paused = !paused;
        return paused;
    }

    /* --------------------------------------------------------------
       Aika
       -------------------------------------------------------------- */

    function update(dt) {

        if (!playable()) return;

        const interval = softDropping
            ? Math.min(SOFT_DROP_MS, dropInterval(level))
            : dropInterval(level);

        dropTimer += dt;

        if (dropTimer >= interval) {
            dropTimer = 0;
            if (stepDown() && softDropping) score += SOFT_DROP_POINTS;
        }

        if (collides(board, piece, 0, 1)) {
            lockTimer += dt;
            if (lockTimer >= LOCK_DELAY) lockPiece();
        } else {
            lockTimer = 0;
        }

    }

    return {
        state,
        playable,
        start,
        update,
        move,
        rotate,
        hardDrop,
        setSoftDrop,
        togglePause
    };

}
