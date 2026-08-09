/**
 * Pelin vakiot yhdessä paikassa.
 *
 * Luvut on eroteltu logiikasta, koska juuri niitä on säädetty pelitestien
 * perusteella: kynnykset, ikkunat ja pisteet ovat pelituntuma, eivät
 * rakennetta.
 */

/* ------------------------------------------------------------------
   Lauta ja palat
   ------------------------------------------------------------------ */

export const COLS = 10;
export const ROWS = 20;

export const COLORS = {
    I: "#4CC9F0",
    J: "#4361EE",
    L: "#F77F00",
    O: "#FFD166",
    S: "#06D6A0",
    T: "#C77DFF",
    Z: "#EF476F"
};

export const SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    O: [[1, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]]
};

/** Siirrot, joita kääntö kokeilee järjestyksessä, jos suora kääntö osuu. */
export const KICKS = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]];

/* ------------------------------------------------------------------
   Ajastus ja pisteet
   ------------------------------------------------------------------ */

/** Kuinka kauan pala saa levätä pinon päällä ennen lukitusta. */
export const LOCK_DELAY = 500;

/** Montako kertaa siirto tai kääntö saa nollata lukitusajan. */
export const MAX_LOCK_RESETS = 15;

export const LINE_SCORES = [0, 100, 300, 500, 800];
export const HARD_DROP_POINTS = 2;
export const SOFT_DROP_POINTS = 1;
export const LINES_PER_LEVEL = 10;

export const BASE_DROP_MS = 800;
export const LEVEL_SPEEDUP_MS = 65;
export const MIN_DROP_MS = 80;
export const SOFT_DROP_MS = 60;

/* ------------------------------------------------------------------
   Kopautustunnistus
   ------------------------------------------------------------------ */

export const DEG = Math.PI / 180;

/** Oletuskynnykset (m/s²). Pystykopautus on fysikaalisesti heikompi kuin
 *  sivukopautus, joten sen rajat ovat matalampia. */
export const DEFAULT_SENS = { side: 5, drop: 3, rot: 2.5 };

/** Väännöksen oletuskynnys (rad/s). */
export const DEFAULT_TWIST_RATE = 2;

/** Liukusäätimen rajat kummassakin tilassa. */
export const TAP_RANGE = { min: 2.25, max: 15, step: 0.25 };
export const TWIST_RANGE = { min: 1, max: 4, step: 0.1 };

/** ms, kuinka kauan yhtä iskua seurataan ennen ratkaisua. */
export const CAPTURE_WINDOW = 60;

/** ms, väännös on kopautusta pidempi ele. */
export const TWIST_WINDOW = 140;

/** ms, tauko onnistuneen laukaisun jälkeen. */
export const REFRACTORY = 200;

/** ms, lyhyempi tauko hylätyn iskun jälkeen. */
export const REJECT_PAUSE = 90;

/** Osuus matalimmasta kynnyksestä, joka herättää akselin. */
export const GATE_FACTOR = 0.5;

/** Tämän osuuden yli menevä kierto vaimentaa kopautukset väännöstilassa. */
export const TWIST_SUPPRESS = 0.7;

/** Osuus kynnyksestä, jonka alle on rauhoituttava ennen uutta iskua. */
export const REARM_LEVEL = 0.35;

/** ms, kuinka kauan rauhoittumista korkeintaan odotetaan. */
export const REARM_MAX = 250;

/** Painovoiman liukuvan keskiarvon painotus varareitillä. */
export const GRAVITY_SMOOTHING = 0.9;

/* ------------------------------------------------------------------
   Mittarit ja palaute
   ------------------------------------------------------------------ */

/** Kopautusmittarin kiinteä asteikko (m/s²). */
export const METER_MAX = 18;

/** Gyromittarin asteikko (rad/s). */
export const ROT_MAX = 5;

/** Mittarin huipun valuminen yksikköä millisekunnissa. */
export const METER_DECAY = 0.03;
export const ROT_DECAY = 0.006;

/** ms, kuinka kauan osuma välähtää kompassissa. */
export const ZONE_FLASH_MS = 170;

/** ms, kuinka kauan hylkäyksen syy näkyy keskellä. */
export const REJECT_SHOW_MS = 500;

export const VIBRATE = { move: 10, rotate: 10, drop: [8, 30, 14] };
