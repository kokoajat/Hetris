/**
 * Piirto kankaalle. Lukee pelin tilaa mutta ei muuta sitä.
 */

import { ghostOffset } from "./board.js";
import { COLORS, COLS, ROWS, SHAPES } from "./config.js";
import { shapeBounds } from "./pieces.js";

const GRID_COLOR = "#161E29";
const GHOST_ALPHA = 0.16;

/** Laitteen pikselitiheys, katkaistuna – kolmen yli ei enää näy mitään. */
function pixelRatio() {
    return Math.min(window.devicePixelRatio || 1, 3);
}

function roundRect(ctx, x, y, w, h, r) {

    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        return;
    }

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();

}

/** Yksi ruutu: värillinen laatta ja sen yläreunaan vaalea korostus. */
function drawCell(ctx, cx, cy, size, color, alpha = 1) {

    const pad = Math.max(1, size * 0.06);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    roundRect(ctx, cx + pad, cy + pad, size - pad * 2, size - pad * 2, size * 0.18);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.28;
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, cx + pad, cy + pad, size - pad * 2, (size - pad * 2) * 0.32, size * 0.16);
    ctx.fill();

    ctx.globalAlpha = 1;

}

export function createRenderer(boardCanvas, nextCanvas) {

    const ctx = boardCanvas.getContext("2d");
    const nctx = nextCanvas.getContext("2d");

    let cell = 20;

    /** Sovittaa laudan käytettävissä olevaan tilaan kokonaisin ruuduin, jotta
     *  ruudukon viivat osuvat pikselirajoille. */
    function resize() {

        const rect = boardCanvas.parentElement.getBoundingClientRect();

        cell = Math.max(8, Math.floor(Math.min(rect.width / COLS, rect.height / ROWS)));

        const w = cell * COLS;
        const h = cell * ROWS;
        const dpr = pixelRatio();

        boardCanvas.style.width = w + "px";
        boardCanvas.style.height = h + "px";
        boardCanvas.width = Math.round(w * dpr);
        boardCanvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    }

    function drawGrid(w, h) {

        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 1; x < COLS; x++) {
            ctx.moveTo(x * cell + 0.5, 0);
            ctx.lineTo(x * cell + 0.5, h);
        }
        for (let y = 1; y < ROWS; y++) {
            ctx.moveTo(0, y * cell + 0.5);
            ctx.lineTo(w, y * cell + 0.5);
        }

        ctx.stroke();

    }

    function drawPiece(piece, dy, alpha) {

        const m = piece.matrix;

        for (let y = 0; y < m.length; y++) {
            for (let x = 0; x < m[y].length; x++) {
                if (!m[y][x]) continue;
                const row = piece.y + y + dy;
                if (row < 0) continue;
                drawCell(ctx, (piece.x + x) * cell, row * cell, cell, COLORS[piece.type], alpha);
            }
        }

    }

    function draw(state) {

        const w = cell * COLS;
        const h = cell * ROWS;

        ctx.clearRect(0, 0, w, h);
        drawGrid(w, h);

        const board = state.board;

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (board[y][x]) drawCell(ctx, x * cell, y * cell, cell, COLORS[board[y][x]]);
            }
        }

        if (!state.piece) return;

        // haamu ensin, jotta varsinainen pala jää sen päälle
        drawPiece(state.piece, ghostOffset(board, state.piece), GHOST_ALPHA);
        drawPiece(state.piece, 0, 1);

    }

    /** Seuraavan palan esikatselu omalle pikkukankaalleen. */
    function drawNext(type) {

        const w = 60;
        const h = 44;
        const dpr = pixelRatio();

        nextCanvas.style.width = w + "px";
        nextCanvas.style.height = h + "px";
        nextCanvas.width = Math.round(w * dpr);
        nextCanvas.height = Math.round(h * dpr);
        nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        nctx.clearRect(0, 0, w, h);

        if (!type) return;

        const m = SHAPES[type];
        const b = shapeBounds(m);
        const size = Math.floor(Math.min(w / (b.width + 0.5), h / (b.height + 0.5)));
        const ox = (w - b.width * size) / 2;
        const oy = (h - b.height * size) / 2;

        for (let y = b.minY; y <= b.maxY; y++) {
            for (let x = b.minX; x <= b.maxX; x++) {
                if (!m[y][x]) continue;
                drawCell(nctx, ox + (x - b.minX) * size, oy + (y - b.minY) * size, size, COLORS[type]);
            }
        }

    }

    return { resize, draw, drawNext, get cell() { return cell; } };

}
