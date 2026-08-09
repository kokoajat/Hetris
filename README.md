# KOPS — kopautus-Tetris

Selainpeli, jota ohjataan kopauttamalla puhelimen reunaa. Yksi sääntö
selittää kaiken: **pala liikkuu siihen suuntaan, mihin puhelin työntyy.**
Kopautus yläreunaan työntää puhelinta alas, joten pala putoaa. Kopautus
oikeaan reunaan työntää vasemmalle, joten pala siirtyy vasemmalle.

Vaihtoehtoisessa **ranneväännöstilassa** sivuttaissiirto luetaan gyrosta:
puhelinta väännetään kuin rattia. Se on tarkempi, koska sivuttaisliike ja
pystykopautus tulevat silloin eri antureista eikä niitä tarvitse erottaa
toisistaan.

Peli toimii myös ilman antureita: näppäimistö ja ruudun napautus ovat aina
käytettävissä.

Sovellus on täysin staattinen: ei palvelinta, ei käännösvaihetta, ei
seurantaa.

## Käyttö

Sovellus käyttää ES-moduuleja, joten se pitää avata verkkopalvelimen kautta –
`file://`-osoitteesta selain estää moduulien latauksen.

```bash
npm start           # palvelin osoitteessa http://localhost:8124
```

Julkaisuun riittää minkä tahansa staattisen palvelun juuri, esimerkiksi
GitHub Pages: valitse repositorion asetuksista *Pages* → *Deploy from a
branch* → `main` / `(root)`.

Osoiteparametri `?seed=jotain` kiinnittää palojen järjestyksen. Sama siemen
antaa aina saman pelin, mikä on kätevää testeissä ja bugiraporteissa.

### Näppäimistö

| Näppäin | Toiminto |
| --- | --- |
| ← → | siirrä |
| ↑ | käännä |
| ↓ | pehmeä pudotus |
| väli | pudota |
| P | tauko ja herkkyysasetukset |

## Rakenne

```
index.html            Sivun rakenne, ei tyylejä eikä logiikkaa
css/styles.css        Kaikki tyylit
js/
  main.js             Käynnistys, kytkennät, kuvaruutusilmukka
  config.js           Vakiot: mitat, pisteet, kynnykset, ikkunat
  board.js            Lauta ja säännöt: osumat, kääntö, rivien tuho
  pieces.js           Palojen arvonta (seitsemän pussi) ja muodot
  game.js             Pelin tila: pisteet, taso, lukitus, elinkaari
  render.js           Kankaan piirto: lauta, haamu, esikatselu
  motion.js           DeviceMotionEvent → ruudun akselit
  tap.js              Kopautuksen ja väännöksen tunnistus
  sensors.js          Anturin lupa ja kuuntelijan kytkentä
  compass.js          Kopautuskompassi: välähdykset, hylkäykset, mittarit
  settings.js         Ohjausasetukset ja niistä johdetut tekstit
  settings-view.js    Taukonäytön säätimet
  controls.js         Näppäimistö ja ruudun napautus
  screens.js          Peittokerrokset, tilastonumerot, wake lock
  dom.js              DOM-tunnisteet yhdessä paikassa
  utils.js            Siemenellinen satunnaisluku
tests/
  unit.test.mjs       Yksikkötestit puhtaalle logiikalle (ei riippuvuuksia)
  e2e.mjs             Selaintesti, liikeanturi tynkinä
```

Kerrosjako on tarkoituksellinen: `board.js`, `pieces.js`, `game.js` ja
`tap.js` eivät koske DOM:iin, `motion.js` ei tiedä pelistä, ja `main.js` ei
sisällä sääntöjä. Näin sekä pelisäännöt että kopautuksen tunnistus voi ajaa
testissä ilman selainta – juuri ne ovat ne osat, joita on tarvinnut säätää
eniten.

## Testit

```bash
npm test              # yksikkötestit, pelkkä Node riittää
npm install           # asentaa Playwrightin selaintestiä varten
npx playwright install
npm run test:e2e      # selaintesti: käyttöpolut läpi tynkädatalla
```

Selaintesti käynnistää oman staattisen palvelimen ja käy läpi näppäimistön,
ruutunapautuksen, taukonäytön säätimet, pelin päättymisen sekä liikeanturin.
Työpöytäselaimessa ei ole antureita, joten anturitapahtumat rakennetaan
testissä käsin – polku `motion.js → tap.js → peli` on silti sama kuin
puhelimessa.

Jos selain on asennettu valmiiksi muualle kuin Playwrightin omaan
hakemistoon, polun voi antaa ympäristömuuttujalla:

```bash
CHROMIUM_PATH=/polku/chromium npm run test:e2e
```

## Miksi tunnistus on tällainen

Muutama ratkaisu näyttää monimutkaiselta, kunnes tietää mitä anturi näkee.

- **Vastaheilahdus on usein iskua voimakkaampi.** Kädessä pidettävä puhelin
  heilahtaa takaisin kopautuksen jälkeen, ja se heilahdus näkyy anturissa
  suurempana kuin isku itse. Siksi kummankin akselin suunta lukitaan sen
  ensimmäisestä merkittävästä otoksesta, ja voimakkuudeksi lasketaan vain
  samansuuntaiset otokset (`js/tap.js`). Ilman tätä pala liikkui
  vastakkaiseen suuntaan kuin kopautettiin.
- **Voittava akseli ratkaistaan herätysjärjestyksestä.** Aikaisemmin herännyt
  akseli on se, johon isku kohdistui. Epäselvä isku hylätään näkyvästi:
  arvaus väärään suuntaan on pelaajalle pahempi kuin tekemätön siirto.
- **Pystykopautus on fysikaalisesti heikompi kuin sivukopautus.** Sivuisku
  saa otepisteen ympäri syntyvästä kierrosta ison lisän anturin kohdalla,
  pystyisku ei. Siksi pystyrajat ovat oletuksena matalampia.
- **Tyhjä anturinäyte ei saa päättää lukutapaa.** Selaimet lähettävät heti
  kuuntelijan lisäämisen jälkeen tapahtuman, jonka kaikki kentät ovat
  tyhjiä. Jos se saa valita, luetaanko `acceleration` vai
  `accelerationIncludingGravity`, koko peli jää väärälle reitille
  (`js/motion.js`).
- **Kompassi näyttää myös epäonnistumiset.** Hylätyn iskun syy ilmestyy
  keskelle ja mittari näyttää kopautuksen voiman suhteessa rajoihin. Vasta
  tämä tekee herkkyyden säätämisestä mahdollista – muuten pelaaja ei tiedä,
  näkyikö kopautus lainkaan.

## Jatkokehitys

Ideoita on koottu tiedostoon [IDEAT.md](IDEAT.md).

## Lisenssi

MIT.
