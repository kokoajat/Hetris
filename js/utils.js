/**
 * Pieniä apureita, joilla ei ole omaa kotia.
 */

/**
 * Siemenellinen satunnaisluku (mulberry32). Käytetään vain, kun osoitteessa
 * on `?seed=` – silloin palojen järjestys toistuu samanlaisena, mikä tekee
 * selaintesteistä ja bugiraporteista toistettavia.
 *
 * @param {string|number} seed
 * @returns {() => number} luku väliltä [0, 1)
 */
export function createRandom(seed) {

    let state = typeof seed === "number" ? seed >>> 0 : hashString(String(seed));

    return function random() {
        state = (state + 0x6D2B79F5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

}

function hashString(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
