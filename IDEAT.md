# Jatkokehitysideat

Lista on järjestetty työmäärän mukaan. Perustelut kertovat, mitä ongelmaa
kukin idea ratkaisee – ei kannata tehdä mitään näistä vain siksi, että se on
listalla.

## Nopeat voitot

### 1. Asetukset muistiin

Herkkyydet, ohjaustila ja käänteinen kopautus säädetään joka käynnistyksellä
uudelleen. Tallenna asetusolio `localStorage`iin ja lue se käynnistyksessä.
Tämä on pelin selvin arjen kitkakohta: säädöt ovat puhelinkohtaisia eivätkä
muutu, kun ne kerran on löytänyt.

### 2. Paras tulos näkyviin

Peli ei muista mitään. Yksi `localStorage`-avain ja neljäs ruutu ylätietoihin
riittää siihen, että pelillä on tavoite.

### 3. Kirjasin paikallisesti

`index.html` lataa Chakra Petchin Google Fontsista. Ilman verkkoa ulkoasu
putoaa järjestelmäkirjasimeen, ja jokainen käynnistys tekee kaksi ulkoista
pyyntöä. Kopioi kirjasin `fonts/`-hakemistoon tai valitse järjestelmäkirjasin
tietoisesti.

### 4. GitHub Actions -putki

`npm test` ja `npm run test:e2e` jokaisella pushilla. Testit ovat jo
olemassa, joten työtä on ~25 riviä YAML:ia.

### 5. Siemen näkyviin ja jaettavaksi

`?seed=` on jo olemassa mutta piilossa. Näytä käytössä oleva siemen
lopetusnäytöllä ja tarjoa "sama peli uudelleen" -painike. Samalla syntyy
päivän haaste ilman palvelinta: siemen voi olla päivämäärä.

## Keskisuuret

### 6. Kalibrointivelho

Kolmen liukusäätimen säätäminen sokkona on pelin vaikein kohta. Pyydä
pelaajaa kopauttamaan kutakin reunaa viisi kertaa, mittaa toteutuneet
voimakkuudet ja aseta kynnykset niiden perusteella (esim. mediaani × 0,6).
Tämä ratkaisisi käyttöönoton kokonaan, ja tarvittava mittaus on jo olemassa
(`compass.js`:n huippuseuranta).

### 7. Tallennetut anturidatat testeihin

`tap.js`:n kommentissa lukee "n. 82 % oikein" ilman toistettavaa lähdettä.
Tallenna oikeilta puhelimilta raakadataa merkittyinä (mikä reuna, mikä
tulos), aja tunnistin niitä vasten ja mittaa osumatarkkuus testinä. Vasta
silloin kynnyksiä ja ikkunoita voi säätää tietäen, paraniko vai huononiko
tulos.

### 8. Pidä-pala (hold) ja pidempi jono

Nykyisin näkyy yksi seuraava pala eikä palaa voi säästää. Kumpikin on
vakiovarustusta ja parantaa peliä selvästi. `pieces.js` tukee jonon
pidentämistä jo nyt.

### 9. Oikea SRS-kääntöjärjestys

`config.js`:n `KICKS` on sama kaikille paloille ja kaikille kierroille.
Vakiintunut SRS määrittelee siirrot palakohtaisesti, mikä tekee ahtaista
paikoista ennustettavia. Ero näkyy heti, kun pino kasvaa.

### 10. Äänet ja parempi tärinä

Kopautuspelissä laite on kädessä ja katse ruudussa. Lyhyt naps
onnistuneesta siirrosta ja eri sävy hylätystä iskusta antaisivat palautteen
ilman että kompassia tarvitsee vilkuilla.

### 11. PWA: asennettavuus ja offline

Manifest ja service worker. Peli on staattinen ja pieni, joten se toimisi
kokonaan ilman verkkoa – ja aloitusnäytöltä käynnistyvä koko näytön peli on
kopautusohjaukselle luontevampi kuin selainvälilehti.

### 12. Pehmeä lasku ja tason nousun tuntuma

Tällä hetkellä `dropInterval` on lineaarinen ja pysähtyy 80 ms:iin. Tason
nousu ei näy muuten kuin nopeutena. Rivinpoiston animaatio, tason
vaihtumisen välähdys ja combo-pisteet tekisivät etenemisestä palkitsevaa.

## Isommat

### 13. Kopautuksen tunnistus mallilla

Nykyinen tunnistus on käsin viritetty sääntöjoukko. Kun idean 7 aineisto on
olemassa, sama päätös voi syntyä pienestä opitusta luokittelijasta, joka
näkee koko 60 ms:n ikkunan kerralla eikä vain huippuja. Vaatii aineiston
ensin – muuten mallia ei voi verrata mihinkään.

### 14. Kaksinpeli samalla siemenellä

Sama palajono kahdelle puhelimelle ja rivien lähetys vastustajalle.
Yhteydeksi riittää WebRTC tai pieni relay; siemen tekee peleistä jo nyt
identtiset.

### 15. Tyyppitarkistus ilman käännösvaihetta

JSDoc-tyypit ja `tsc --checkJs --noEmit` antavat editorille ja CI:lle
tyyppitiedot ilman että projektiin tulee käännösvaihe. Anturitapahtumien
kentät ovat tässä sovelluksessa se, mikä yleisimmin yllättää.

## Tietoisesti tekemättä jätettyä

- **Kehysratkaisu (React, Vue).** Peli on yksi näkymä ja kankaalle piirretty
  ruudukko. Kehys toisi käännösvaiheen ja riippuvuuspuun ilman hyötyä.
- **Bundleri.** Moduulit ladataan sellaisenaan. Tiedostoja on parikymmentä ja
  ne ovat pieniä; HTTP/2:lla ero on olematon, ja lähdekoodi pysyy
  luettavana myös julkaistussa versiossa.
- **Kallistusohjaus.** Kallistus on jatkuva suure, mutta Tetris tarvitsee
  erillisiä askelia – kallistuksesta pitäisi keksiä toistonopeus ja
  kuollut alue, ja lopputulos olisi eri peli. Kopautus ja väännös ovat
  molemmat tapahtumia, ja juuri se tekee niistä tähän sopivia.
