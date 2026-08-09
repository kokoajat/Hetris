/**
 * Palojen arvonta ja muoto. Puhdasta logiikkaa.
 *
 * Arvonta on "seitsemän pussi": kaikki seitsemän palaa sekoitetaan ja
 * jaetaan, ennen kuin seuraava seitsikko alkaa. Näin sama pala ei toistu
 * loputtomiin eikä I-pala jää tulematta.
 */

import { COLS, SHAPES } from "./config.js";

export const TYPES = Object.keys(SHAPES);

/**
 * @param {() => number} random  Satunnaislukulähde – testeissä siemenellinen.
 */
export function createBag(random = Math.random) {

    const queue = [];

    function refill() {

        const types = TYPES.slice();

        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }

        queue.push(...types);

    }

    return {
        /** Seuraava palatyyppi. Pussi täytetään ajoissa, jotta esikatselu toimii. */
        take() {
            if (queue.length < 2) refill();
            return queue.shift();
        },
        get length() {
            return queue.length;
        }
    };

}

/** Uusi pala keskelle lautaa. I-pala aloittaa rivin ylempää, koska sen
 *  matriisin ylin rivi on tyhjä. */
export function makePiece(type) {

    const matrix = SHAPES[type].map(row => row.slice());

    return {
        type,
        matrix,
        x: Math.floor((COLS - matrix[0].length) / 2),
        y: type === "I" ? -1 : 0
    };

}

/** Matriisin täytettyjen ruutujen rajat – esikatselun keskitystä varten. */
export function shapeBounds(matrix) {

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (!matrix[y][x]) continue;
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
    }

    return { minX, maxX, minY, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}
