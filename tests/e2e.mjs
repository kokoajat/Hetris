/**
 * Selaintesti: käynnistää pelin paikalliseen palvelimeen ja käy läpi
 * tärkeimmät käyttöpolut – näppäimistön, ruutunapautuksen, taukonäytön
 * säätimet ja liikeanturin.
 *
 *     npm run test:e2e
 *
 * Vaatii Playwrightin:  npm install
 *
 * Anturi syötetään oikeina DeviceMotionEvent-tapahtumina, joten testi kulkee
 * saman polun kuin puhelin: motion.js → tap.js → peli. Palojen järjestys
 * kiinnitetään `?seed=`-parametrilla, jotta ajo on toistettava.
 */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = 8124;
const URL_BASE = `http://127.0.0.1:${PORT}/?seed=kops-e2e`;

/* ------------------------------------------------------------------
   Paikallinen staattinen palvelin
   ------------------------------------------------------------------ */

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8"
};

const server = createServer(async (req, res) => {

    const path = normalize(decodeURIComponent(req.url.split("?")[0]));
    const file = join(ROOT, path === "/" ? "index.html" : path);

    if (!file.startsWith(ROOT)) {
        res.writeHead(403).end();
        return;
    }

    try {
        const body = await readFile(file);
        res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
        res.end(body);
    } catch {
        res.writeHead(404).end("not found");
    }

});

await new Promise(resolve => server.listen(PORT, "127.0.0.1", resolve));

/* ------------------------------------------------------------------
   Testikehys
   ------------------------------------------------------------------ */

let failures = 0;

function check(condition, name, extra = "") {
    if (condition) {
        console.log(`  ok   ${name}`);
    } else {
        failures++;
        console.log(`  FAIL ${name}${extra ? "  – " + extra : ""}`);
    }
}

/* ------------------------------------------------------------------
   Selain
   ------------------------------------------------------------------ */

/* CHROMIUM_PATH annetaan ympäristöissä, joissa selain on valmiiksi asennettu
   muualle kuin Playwrightin omaan hakemistoon. Tavallisesti tätä ei tarvita:
   `npm install` ja `npx playwright install` riittävät. */
const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const page = await browser.newPage({ viewport: { width: 420, height: 860 } });

/* Verkkoyhteyttä ei testissä ole, joten CDN:stä ladattava kirjasinperhe
   epäonnistuu odotetusti – vain sovelluksen omat virheet kiinnostavat. */
const problems = [];
page.on("pageerror", error => problems.push(String(error)));
page.on("console", message => {
    if (message.type() !== "error") return;
    if (message.text().includes("Failed to load resource")) return;
    problems.push(message.text());
});

await page.goto(URL_BASE);

/** Kompassin välähdykset ovat lyhyitä, joten ne kerätään tarkkailijalla. */
async function watchZones() {
    await page.evaluate(() => {
        window.__zones = [];
        if (window.__zoneObserver) window.__zoneObserver.disconnect();
        window.__zoneObserver = new MutationObserver(records => {
            for (const record of records) {
                const el = record.target;
                if (el.classList.contains("hit")) window.__zones.push(el.id);
                if (el.classList.contains("miss")) window.__zones.push(el.id + ":miss");
            }
        });
        for (const id of ["zTop", "zBottom", "zLeft", "zRight", "tapCore"]) {
            window.__zoneObserver.observe(document.getElementById(id), {
                attributes: true,
                attributeFilter: ["class"]
            });
        }
    });
}

const zones = () => page.evaluate(() => window.__zones.slice());
const hidden = selector => page.$eval(selector, el => el.hidden);
const text = selector => page.$eval(selector, el => el.textContent.trim());
const number = selector => page.$eval(selector, el => Number(el.textContent));

/**
 * Yksi kopautus tai väännös anturitapahtumina.
 *
 * Työpöytäselaimessa ei ole liikeantureita eikä `DeviceMotionEvent`-luokkaa,
 * joten tapahtuma rakennetaan tavallisesta Eventistä ja siihen ripustetaan
 * samat kentät kuin puhelin lähettäisi. Sovellus lukee vain näitä kenttiä,
 * joten polku motion.js → tap.js → peli on sama kuin oikeasti.
 *
 * @param {object} shape { x, y } kiihtyvyyden huippu (m/s²),
 *                       { alpha } kierto (deg/s), { ms } eleen kesto
 * @returns {Promise<string>} voimamittarin leveys eleen lopussa
 */
async function tapDevice({ x = 0, y = 0, alpha = 0, ms = 120 }) {
    return page.evaluate(async ({ x, y, alpha, ms }) => {

        const wait = () => new Promise(resolve => setTimeout(resolve, 10));

        const send = (ax, ay, wa) => {
            const event = new Event("devicemotion");
            event.acceleration = { x: ax, y: ay, z: 0 };
            event.rotationRate = { alpha: wa, beta: 0, gamma: 0 };
            window.dispatchEvent(event);
        };

        for (let t = 0; t <= ms; t += 10) {
            const rising = t < 40;
            const phase = rising ? 1 : -1.3;          // kiihtyvyys heilahtaa takaisin
            send(x * phase, y * phase, alpha * (rising ? 1 : 0.5));
            await wait();
        }

        // mittarin lukema luetaan ennen rauhoittumista, koska huippu valuu pois
        const meter = document.getElementById("meterFill").style.width;

        // Rauhallinen jakso, jotta tunnistin virittyy uudelleen: suojatauon on
        // ehdittävä umpeen ja sen jälkeen on tultava hiljaisia otoksia.
        for (let i = 0; i < 40; i++) {
            send(0, 0, 0);
            await wait();
        }

        return meter;

    }, { x, y, alpha, ms });
}

/** Avaa taukonäytön, tekee säädön ja jatkaa peliä. */
async function withPause(action) {
    await page.keyboard.press("p");
    await action();
    await page.click("#resumeBtn");
}

/* ------------------------------------------------------------------
   1. Aloitusnäyttö
   ------------------------------------------------------------------ */

console.log("\naloitusnäyttö");

check(await hidden("#startScreen") === false, "aloitusnäyttö näkyy");
check(await hidden("#pauseScreen"), "taukonäyttö on piilossa");
check(await text("#zTop") === "Pudota", "kompassin yläreuna pudottaa");
check(await text("#zLeft") === "Oikealle →", "vasen reuna siirtää oikealle");

check(
    await page.$eval("#board", el => el.width > 0 && el.height > 0),
    "lauta on mitoitettu ikkunaan"
);

/* ------------------------------------------------------------------
   2. Pelin aloitus
   ------------------------------------------------------------------ */

console.log("\npelin aloitus");

await page.click("#startBtn");

check(await hidden("#startScreen"), "aloitusnäyttö väistyi");
check(await number("#score") === 0, "pisteet nollattiin");
check(await number("#level") === 1, "taso on 1");

check(
    await page.$eval("#next", el => {
        const data = el.getContext("2d").getImageData(0, 0, el.width, el.height).data;
        return data.some((v, i) => i % 4 === 3 && v > 0);
    }),
    "seuraava pala on piirretty esikatseluun"
);

check(
    await page.$eval("#board", el => {
        const data = el.getContext("2d").getImageData(0, 0, el.width, el.height).data;
        return data.some((v, i) => i % 4 === 3 && v > 0);
    }),
    "lauta on piirretty"
);

/* ------------------------------------------------------------------
   3. Näppäimistö
   ------------------------------------------------------------------ */

console.log("\nnäppäimistö");

await page.keyboard.press("ArrowLeft");
await page.keyboard.press("ArrowUp");
await page.keyboard.press("Space");
await page.waitForTimeout(50);

const afterDrop = await number("#score");
check(afterDrop > 0, "kova pudotus kerrytti pisteet", `pisteet ${afterDrop}`);

await page.keyboard.down("ArrowDown");
await page.waitForTimeout(300);
await page.keyboard.up("ArrowDown");

check(await number("#score") > afterDrop, "pehmeä pudotus kerrytti pisteitä lisää");

/* ------------------------------------------------------------------
   4. Ruutunapautus
   ------------------------------------------------------------------ */

console.log("\nruutunapautus");

await watchZones();

const box = await page.$eval("#board", el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
});

await page.mouse.click(box.x + box.w * 0.9, box.y + box.h * 0.5);
await page.waitForTimeout(50);

check(
    (await zones()).includes("zLeft"),
    "oikealle siirtävä napautus välähtää vasemmalla reunalla",
    JSON.stringify(await zones())
);

/* ------------------------------------------------------------------
   5. Liikeanturi
   ------------------------------------------------------------------ */

console.log("\nliikeanturi");

await watchZones();
await tapDevice({ x: 9 });

check(
    (await zones()).includes("zLeft"),
    "kopautus vasempaan reunaan tulkittiin oikein",
    JSON.stringify(await zones())
);

await watchZones();
await tapDevice({ y: -9 });

check(
    (await zones()).includes("zTop"),
    "kopautus yläreunaan pudottaa palan",
    JSON.stringify(await zones())
);

await watchZones();
const lightMeter = await tapDevice({ x: 3.2 });

check(
    (await zones()).includes("tapCore:miss"),
    "liian kevyt kopautus näytetään hylättynä",
    JSON.stringify(await zones())
);

check(parseFloat(lightMeter) > 0, "mittari näyttää kopautuksen voiman", lightMeter);

await withPause(() => page.click("#modeTwist"));
await watchZones();
await tapDevice({ alpha: 200, ms: 220 });          // ~3,5 rad/s vastapäivään

check(
    (await zones()).includes("zLeft"),
    "ranneväännös vasemmalle luetaan gyrosta",
    JSON.stringify(await zones())
);

await withPause(() => page.click("#modeTap"));

/* ------------------------------------------------------------------
   6. Tauko ja säätimet
   ------------------------------------------------------------------ */

console.log("\ntauko ja säätimet");

await page.keyboard.press("p");

check(await hidden("#pauseScreen") === false, "P avaa taukonäytön");
check(await text("#pauseBtn") === "Jatka", "alapalkin nappi tarjoaa jatkamista");

await page.fill("#sensSide", "8");
await page.$eval("#sensSide", el => el.dispatchEvent(new Event("input", { bubbles: true })));

check(await text("#valSide") === "8", "sivuttaissäädin näyttää uuden arvon");
check(
    await page.$eval("#tickSide", el => parseFloat(el.style.left) > 40),
    "säätimen raja siirtyi mittarissa"
);

await page.click("#modeTwist");

check(await hidden("#tickSide"), "väännöstilassa sivuttaisraja katoaa mittarista");
check(await hidden("#meterRot") === false, "gyromittari tuli näkyviin");
check(await text("#labSide") === "Väännöksen voimakkuus", "säätimen selite vaihtui");
check((await text("#valSide")).includes("rad/s"), "yksikkö vaihtui rad/s:ksi");
check(await text("#zLeft") === "↺ Vasemmalle", "kompassi kertoo väännöksen suunnan");

await page.click("#modeTap");

check(await hidden("#meterRot"), "gyromittari piiloutui takaisin");
check(await text("#valSide") === "8", "kopautusherkkyys säilyi tilan vaihdossa");

await page.click("#invertTap");

check(await text("#zTop") === "Käännä", "käänteinen kopautus vaihtoi ylä- ja alareunan");
check(await text("#zLeft") === "← Vasemmalle", "sivureunat vaihtuivat mukana");

await page.click("#invertTap");
await page.click("#resumeBtn");

check(await hidden("#pauseScreen"), "jatkaminen sulki taukonäytön");
check(await text("#pauseBtn") === "Tauko", "nappi palasi taukoon");

/* ------------------------------------------------------------------
   7. Pelin päättyminen
   ------------------------------------------------------------------ */

console.log("\npelin päättyminen");

for (let i = 0; i < 400 && await hidden("#overScreen"); i++) {
    await page.keyboard.press("Space");
}

check(await hidden("#overScreen") === false, "pino kasvoi yli ja peli päättyi");
check(/pistettä · \d+ riviä · taso \d+/.test(await text("#finalScore")), "lopputulos näytetään");

await page.click("#againBtn");

check(await hidden("#overScreen"), "uusi peli sulki lopetusnäytön");
check(await number("#score") === 0, "pisteet nollautuivat");
check(await number("#lines") === 0, "rivit nollautuivat");

/* ------------------------------------------------------------------
   Yhteenveto
   ------------------------------------------------------------------ */

check(problems.length === 0, "selain ei raportoinut virheitä", problems.join(" | "));

await browser.close();
server.close();

console.log(failures ? `\n${failures} testiä epäonnistui\n` : "\nkaikki selaintestit läpi\n");
process.exit(failures ? 1 : 0);
