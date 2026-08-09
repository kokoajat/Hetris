/**
 * Lauta ja sen säännöt. Puhdasta logiikkaa: ei DOM:ia, ei tilaa moduulissa,
 * kaikki tarvittava annetaan parametreina. Tämän ansiosta pelisäännöt voi
 * testata Nodella ilman selainta.
 *
 * Lauta on ROWS × COLS taulukko, jonka alkio on joko null tai palan
 * tyyppikirjain ("I", "J", ...).
 */

import {
    BASE_DROP_MS,
    COLS,
    LEVEL_SPEEDUP_MS,
    LINE_SCORES,
    LINES_PER_LEVEL,
    MIN_DROP_MS,
    ROWS
} from "./config.js";

export function emptyBoard() {
    return Array.from({ length: ROWS }, () => new Array(COLS).fill(null));
}

/**
 * Osuuko pala paikkaan (x + dx, y + dy)? Palan matriisin voi korvata
 * `matrix`-parametrilla, jolloin käännön voi tarkistaa ennen sen tekemistä.
 *
 * Laudan yläpuoli (ny < 0) on sallittua tyhjää: pala syntyy osittain
 * näkyvän alueen yläpuolelle.
 */
export function collides(board, piece, dx, dy, matrix) {

    const m = matrix || piece.matrix;

    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {

            if (!m[y][x]) continue;

            const nx = piece.x + x + dx;
            const ny = piece.y + y + dy;

            if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
            if (ny >= 0 && board[ny][nx]) return true;

        }
    }

    return false;
}

/** Kääntö myötäpäivään. Matriisi on aina neliö, joten kääntö on paikallaan. */
export function rotateMatrix(m) {

    const size = m.length;
    const out = Array.from({ length: size }, () => new Array(size).fill(0));

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            out[x][size - 1 - y] = m[y][x];
        }
    }

    return out;
}

/**
 * Kirjoittaa palan lautaan.
 *
 * @returns {boolean} false, jos osa palasta jäi laudan yläpuolelle – silloin
 *                    pino on kasvanut yli ja peli päättyy.
 */
export function merge(board, piece) {

    const m = piece.matrix;
    let fits = true;

    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {

            if (!m[y][x]) continue;

            const ny = piece.y + y;
            const nx = piece.x + x;

            if (ny < 0) { fits = false; continue; }

            board[ny][nx] = piece.type;

        }
    }

    return fits;
}

/** Poistaa täydet rivit ja pudottaa ylemmät alas. Palauttaa poistettujen määrän. */
export function clearFullRows(board) {

    let cleared = 0;

    for (let y = board.length - 1; y >= 0; y--) {

        if (!board[y].every(cell => cell)) continue;

        board.splice(y, 1);
        board.unshift(new Array(COLS).fill(null));
        cleared++;
        y++;   // sama rivi tarkistetaan uudelleen, koska ylempi valui tähän

    }

    return cleared;
}

export function lineScore(cleared, level) {
    return (LINE_SCORES[cleared] || 0) * level;
}

export function levelFor(lines) {
    return Math.floor(lines / LINES_PER_LEVEL) + 1;
}

/** Kuinka monta millisekuntia pala odottaa ennen seuraavaa askelta alas. */
export function dropInterval(level) {
    return Math.max(MIN_DROP_MS, BASE_DROP_MS - (level - 1) * LEVEL_SPEEDUP_MS);
}

/** Kuinka monta riviä pala putoaisi, jos se pudotettaisiin nyt. */
export function ghostOffset(board, piece) {
    let dy = 0;
    while (!collides(board, piece, 0, dy + 1)) dy++;
    return dy;
}
