# Estera — Website (Prototyp)

Statisches Prototyping, kein Build-Schritt. Lokal starten:

```bash
python3 -m http.server 4321
```

- Variante A (Briefing-Idee, aktiv weiterentwickelt) → http://127.0.0.1:4321/variante-a.html
- Variante B (Geometrie 1:1 nach Imperia) → http://127.0.0.1:4321/index.html

Unten mittig liegt ein Umschalter zwischen den Varianten. **Der ist nur für die
interne Abstimmung** und fliegt vor dem Launch raus (`.variant-switch` in
`base.css`, Markup am Ende beider HTML-Dateien).

---

## Aufbau

```
index.html          Variante B — Hero
variante-a.html     Variante A — Hero, Kunden, Ablauf
assets/css/
  fonts.css         @font-face, self-hosted
  base.css          Tokens, Header, Menü-Overlay, Buttons, Rotator
  hero-a.css        Bildband + eingelegter Kasten
  hero-b.css        Imperia-Geometrie
  referenzen.css    Kunden, die uns vertrauen
  leistungen.css    Section 3 — So funktioniert Estera
  auswahl.css       Section 4 — Warum Estera anders auswählt
  prinzip.css       Section 5 — Das finanzielle Prinzip
  vergleich.css     Section 6 — Viele Bausteine. Ein strukturierter Weg.
  schluss.css       Section 7, 9 und Fuß
  loop.css          Lemniskaten-Variante des Ablaufs, derzeit nicht eingebunden
assets/js/site.js   Kopfnavigation, Menü, Sticky-Header, Rotator, Reveal,
                    Linienlänge, Referenzen-Akkordeon
assets/fonts/       woff2, kein CDN
assets/img/
```

---

## Die zwei Varianten

**Variante A — Bildband + eingelegter Kasten**
Niedriges vollbreites Bildband (Prinzip MLP), darüber ein breiter Kasten mit
abgerundeten Ecken, Text links, Objektbild rechts.

Der Kasten hat oben und an den Seiten eine Navy-Haarlinie, **unten keine** — er
löst sich nach unten ins Seitenpapier auf, damit die Abschnitte ineinander
laufen statt abzusetzen.

**Variante B — Geometrie 1:1 nach Imperia**
Im Browser an imperiaimmobilien.de gemessen und exakt nachgebaut:

| | Imperia | Estera B |
|---|---|---|
| Hero-Höhe | 646,0 px | 646,0 px |
| Headline | 44 px / 48,4 px | 44 px / 48,4 px |
| Subline | 24 px / 31,2 px · 3 Zeilen | 24 px / 31,2 px · 3 Zeilen |
| Textspalte | x 80, w 826,7 | x 80, w 826,7 |
| Bild | x 938,7 · y 160 · 581,3 × 387,5 | identisch |
| Bildradius | 12 px | 12 px |
| CTA | 48 px hoch · Padding 0 20 px · Radius 8 px · 12 px Abstand · keine Versalien | identisch |
| Headline → Subline | 32 px | 32 px |
| Subline → CTA | 40 px | 40 px |

Übernommen ist die Anordnung; Schrift, Farbe und Duktus sind Estera.

---

## Gestalterische Festlegungen

| Ebene | Entscheidung |
|---|---|
| Headline & Fließtext | Weiches Schwarz `#2B2E33` |
| Hervorhebung | Blau `#1E4270` — zweite Headline-Zeile und einzelne Wörter |
| Leitfarbe Flächen | Navy `#102949`, Overlay `#0A192E` |
| Papier | Reines Weiß `#FFFFFF` auf allen Sections |
| Gold | Nur Haarlinien `#A8874F`; als Schrift `#86693A` |
| Schrift | **Cormorant Garamond 300–700** für alles — Headline, Fließtext, Buttons, Menü |
| Ausnahme | „IMMOBILIEN" in der Wortmarke bleibt Jost |
| Radien | Bild 12 px, Button 8 px (beides von Imperia übernommen) |

Hervorgehoben wird über **Farbe, nicht über Fettung** — so bleibt der Satz ruhig.

Headline: Zeile 1 „Kapitalanlageimmobilien" in Schwarz, Zeile 2 in Blau und
**wechselnd** durch den Markenkern — „Diskret ausgewählt." → „Strukturiert
begleitet." → „Langfristig gedacht." (alle 3,4 s, per `prefers-reduced-motion`
abschaltbar; dann bleibt die erste Zeile stehen).

Bei Imperia rotiert die zweite Zeile ebenfalls — sie steckt in einer `<ul>`
neben dem `h1` mit vier Einträgen.

Der Wechsel läuft **nacheinander, nicht überblendet**: Die alte Zeile blendet
in 0,26 s vollständig aus, erst dann kommt die neue in 0,34 s. Nachgemessen
über einen kompletten Zyklus liegt die Summe beider Deckkräfte konstant bei
1,00 — es überlagert sich also zu keinem Zeitpunkt etwas.

Keine Trust-Leiste im Hero — wie bei Imperia.

**Bindestriche:** Cormorants Divis steht schräg. Ein `@font-face` mit
`unicode-range: U+002D, U+2010, U+2011` schiebt für genau diese drei Zeichen
Josts geraden Strich unter (`'Estera Hyphen'` in `fonts.css`).

---

## Kunden, die uns vertrauen

Ein Fries über die volle Breite (88–97 % der Fensterbreite): Goldhaarlinie
oben und unten, dazwischen vier Spalten mit Firmenlogo, Name des
Geschäftsführers und seinem Satz.

Bewusst **kein gerahmter Kasten** wie in der Referenz — ein abgerundetes
Rechteck mit heller Kontur ist die Formsprache eines UI-Baukastens. Der Rest
der Seite arbeitet mit gestochenen Haarlinien.

Die Wirkung trägt der Größenkontrast: Zitat 1,48 rem kursiv, Name 1,3 rem,
Rolle 0,71 rem gesperrte Versalien, Logo klein. Die Rangfolge macht die
**Größe**, nicht die Entsättigung — Logos und Porträts stehen in voller
Farbe, entsättigt wirkte der Abschnitt kalt.

`subgrid` bindet Logo-, Namens- und Zitatzeile aller vier Spalten auf
gemeinsame Linien. Eine negative Außenmarge in Höhe des Spalten-Innenabstands
sorgt dafür, dass der Text der ersten Spalte auf dem Seitenrand steht und
trotzdem alle vier Spalten dieselbe Zeilenbreite behalten.

**Akkordeon.** In Ruhe zeigt jede Spalte Logo, Name, Tätigkeit, Haarlinie
und Porträt. Fährt man eine an, wächst sie auf die halbe Friesbreite, der
Name wird deutlich größer und das Zitat erscheint **rechts neben dem Bild**;
die anderen drei rücken nach rechts und schrumpfen.

Zwei Dinge halten die Bauhöhe dabei konstant, damit nichts darunter springt:
das Porträt hat eine feste Höhe statt eines Seitenverhältnisses, und die
Namenszeile reserviert dauerhaft die Höhe der großen Schriftgröße. Das Zitat
hat eine feste Satzbreite — die Spalte klippt es nur, statt es bei jedem
Zwischenschritt neu umbrechen zu lassen. Gemessen: 0 px Sprung auf allen vier
Karten von 1201 bis 1920 px.

Gesteuert über `data-aktiv`/`data-offen` aus `site.js`, nicht über `:hover` —
so greift dieselbe Logik für Maus, Tastatur und Fingertipp. Unterhalb von
1201 px ist das Akkordeon aus; dort steht das Zitat unter dem Bild.

**Alle Inhalte sind Platzhalter.** Die Logos unter `assets/img/logos/` sind
Beispiele fremder Marken (Apple, Adidas), die Porträts unter
`assets/img/personen/` sind KI-generiert — keine echten Personen, aber sie
hängen an erfundenen Zitaten.

Beides liegt im Repo, damit die Vorschau auf Netlify vollständig ist. Die
Seiten tragen `noindex, nofollow`, und `_headers` setzt denselben Hinweis als
HTTP-Header, damit auch Bilder und Logos nicht in Suchmaschinen landen.

**Vor der Veröffentlichung müssen beide Ordner gegen echtes Material getauscht
werden.** Fremde Marken unter der Überschrift „Kunden, die uns vertrauen"
wären sonst eine Falschbehauptung — und Logo, Name und Zitat brauchen je eine
schriftliche Freigabe. Vor der Freischaltung wird je Referenz
gebraucht: Logo als SVG, Name und Funktion, der Satz wörtlich, und eine
schriftliche Freigabe für alle drei.

Die Google-Bewertungen sind entfallen (Commit `5d499b7^`, `reviews.css`).
Damit hat die Seite derzeit **keine öffentlich nachprüfbare** Referenz mehr:
Google-Rezensionen konnte jeder selbst aufrufen, Logo und Zitat kann man nur
glauben. Sobald die echten Referenzen stehen, lohnt ein Blick, ob die
Bewertungen nicht doch zusätzlich an anderer Stelle auftauchen sollten.

## Kopfnavigation

Wortmarke mittig, links die **Abschnitte dieser Seite**, rechts die
**einzelnen Seiten**. Wortlaut und Reihenfolge rechts exakt nach der
vorgeschlagenen Hauptnavigation, Briefing S. 5:
„Konzept · Qualität · Wissen · Über Estera · Karriere | Erstgespräch".

Das Raster ist `1fr auto 1fr` — die Wortmarke sitzt in Spalte 2 und bleibt
dadurch exakt mittig, obwohl links fünf und rechts sechs Punkte stehen
(gemessen 0 px Versatz von 1440 bis 1920 px).

Ab 1440 px steht die Navigation waagerecht, darunter übernimmt wieder das
Burger-Overlay — elf Punkte nebeneinander brauchen gemessen rund 1420 px.

Unter dem Kopf liegt ein weicher Verlauf nach Navy, der auf null ausläuft.
Ohne ihn steht die weiße Schrift über dem Bildband stellenweise auf einer
hellen Fassade und ist schlicht nicht lesbar. Gemessen liegt der Kontrast
damit zwischen 11,9:1 und 16,6:1, der schlechteste Einzelpixel im ganzen
Kopf bei 9,74:1 — deutlich über der AAA-Anforderung von 7:1.

`site.js` sperrt Verweise, deren Ziel es noch nicht gibt (Startseiten-
Abschnitte 4, 5 und 7 sowie sämtliche Unterseiten), und gibt sie automatisch
frei, sobald das Ziel existiert. Dadurch springt nichts ins Leere und es
entsteht keine 404.

---

## Section 3 — das Geschäftsmodell in wenigen Schritten

Briefing S. 6: „Die wichtigste Sektion der Startseite." Die sechs Schritte
stehen dort **wörtlich** und sind hier nur um je einen erklärenden Satz
ergänzt, nicht umformuliert:

1. Erstgespräch und gegenseitige Eignung
2. Ersteinschätzung der Möglichkeiten
3. Suche nach einer passenden Kapitalanlageimmobilie
4. Objektvorstellung mit Zahlen, Daten und Fakten
5. Finanzierung über das Netzwerk
6. Notar und weitere Begleitung

Die Überschrift lautet **nicht** „Ein strukturierter Weg." — dieser Satz
gehört im Briefing zu Punkt 6 (interaktiver Vergleich „Selbst koordinieren"
gegen „Mit Estera strukturiert begleitet"). Hier steht stattdessen der
Wortlaut des sekundären Hero-CTA, der genau hierher springt.

---

## Section 4 — warum Estera anders auswählt

Briefing S. 7: „Kurzer Qualitätsmoment: Off-Market-Zugang allein reicht
nicht. Entscheidend ist, welche Objekte Estera bewusst nicht empfiehlt."

Sämtliche Inhalte stehen wörtlich im Briefing — Kernaussage S. 11 und die
sechs Ablehnungsgründe S. 11/12. Nichts ergänzt, nichts umformuliert.

Die sechs Gründe stehen als **Verzweigung** nach dem Vorbild von Imperias
„Unsere Leistungen": ein Kasten oben, von dem die Wege ausgehen, danach drei
Stufen mit je einem Kasten links und rechts, jeder mit Icon. Imperia zieht
dort 1,5-px-Linien in Gold — übernommen ist die Strichsprache, nicht die
Farbe: hier läuft alles in Navy.

Die Linien laufen als **doppelte Haarlinie**: 1 px Linie, 1 px Luft, 1 px
Linie. Eine einzelne Linie ist eine Verbindung, zwei parallele sind eine
Randung — dieselbe Sprache wie auf einem Wertpapier. Die Pfeilspitzen
bestehen entsprechend aus zwei ineinanderliegenden Winkeln; eine einfache
Spitze an einer doppelten Linie sah aus, als gehörte sie nicht dazu.

Der Startkasten ist ein deckendes Navy-Siegel mit Goldrandung — der einzige
dunkle Punkt auf weißem Papier. Vorher hatte er dasselbe Gewicht wie die
sechs darunter, und es gab keinen erkennbaren Ursprung. Die Icons sitzen in
Medaillons mit Goldring, derselben Form wie das Siegel im Ablauf.

Die Verbinder sind **kein SVG**, sondern Rahmenkanten mit Eckenradius. Ein
SVG müsste seine Koordinaten mit dem Raster in Deckung halten und bräche bei
jeder Breitenänderung; Rahmen wachsen von selbst mit. Zwei Details dabei:
die Linienfarbe ist deckend statt `rgba`, weil an den Bögen zwei Rahmenkanten
exakt übereinanderliegen und sich mit Transparenz aufaddieren würden; und die
Senkrechte sitzt bei `calc(50% - 1px)`, damit sie genau auf diesen Kanten
liegt statt daneben — sonst wäre die Linie 2 px breit.

Unter 880 px läuft die Linie am linken Rand durch und alle sechs Gründe
hängen einspaltig rechts daran.

Bewusst **kurz** — die sechs Prüfbereiche (Makrolage,
Mikrolage, Objekt, Wirtschaftlichkeit, Finanzierbarkeit, Langfristigkeit)
gehören laut Briefing S. 11 auf die Seite „Auswahl & Qualität".

Das Querbild aus Abschnitt 3 hängt mit 71 % seiner Höhe hier hinein. Der
Vorlauf ist deshalb aus der Bildgeometrie gerechnet
(`padding-top: calc(22.1vw + 3.5rem)`, hergeleitet aus 46,6 vw Breite bei
3:2 und 71 % Überstand) statt geschätzt — gemessen bleiben von 1101 bis
1920 px konstant 107 px Luft zwischen Bildunterkante und Überschrift.

---

## Section 5 — das finanzielle Prinzip

Briefing S. 7: „Eine ruhige Visualisierung zeigt das Zusammenspiel von
Finanzierung, Immobilie, Miete, Tilgung, laufenden Kosten und möglicher
steuerlicher Wirkung."

Die sechs Bausteine stehen **wörtlich** im Briefing S. 10, Spalte „Einfache
Aussage für die Website". Geändert ist nur die Anrede („der Investor" → „Sie").
„Was bewusst offenbleibt" ebenso wörtlich, S. 11.

**Auf der Section steht keine einzige Zahl.** Das Briefing verbietet die
pauschale monatliche Belastung, „ab 0 Euro", aggressive Rendite- und
Steuerversprechen sowie jede individuelle Berechnung.

Der Trenner zwischen den vier Trägern und den beiden unteren Posten ist
**beschriftet**. Blank gelassen las er sich als Rechenstrich — vier
Summanden oben, Summe unten. Das wäre inhaltlich falsch, und bei
„Langfristigkeit" ergibt es keinen Sinn: die ist keine Folge, sondern eine
Bedingung. Beide unteren Posten haben genau eines gemeinsam — sie hängen von
der persönlichen Situation ab, und genau das steht jetzt auf der Linie.

Aufbau: ein Kopfband über die volle Fensterbreite mit dunklem Objektbild,
Überschrift und Subline in Weiß darauf. Darunter vier ineinandergreifende
Ringe nach dem Vorbild der Audi-Ringe (213 px breit, 35 px Überschneidung =
16,4 %) mit den Namen Finanzierung, Miete, Tilgung und Steuern. Dann ein
zweites dunkles Objektbild, auf dem „Ihr eigener Beitrag" und
„Langfristigkeit" stehen. Zum Schluss „Was bewusst offenbleibt" als eine
Zeile zum Aufklappen.

Die Lesespalte ist 900 px breit, deutlich schmaler als die übrigen
Abschnitte. Beide Bilder sind über `brightness(1.5)` angehoben — im Original
war die blaue Stunde so dunkel, dass die Fassaden verschwanden. Die Verläufe
decken nur dort, wo Schrift steht. Gemessen: Kopfband 17,8:1 im Mittel und
6,7:1 an der hellsten Stelle, Bildbeschriftung 18,5:1 und 9,6:1.

Bewusst **ohne Diagramm** — der Abschnitt davor ist genau das. Hier tragen
Typografie und eine doppelte waagerechte Haarlinie: eine Tafel, kein
Schaubild. Und bewusst **ohne Icons**, weil in Abschnitt 4 in jedem Kasten
eins sitzt und drei der Symbole (Bank, Waage, Balken) dieselben gewesen wären.

Der lange steuerliche Absatz aus S. 10 steht **nicht** hier: er gehört laut
S. 3 auf „Wissen & Fragen", und das Briefing verlangt für ihn ausdrücklich
eine steuerliche und rechtliche Prüfung.

---

## Section 6 — viele Bausteine, ein strukturierter Weg

Briefing S. 7 und S. 14. Ein Umschalter zeigt dieselben sechs Bausteine in
zwei Zuständen: „Selbst koordinieren" und „Mit Estera begleitet". Beide
Textfassungen stehen wörtlich in der Tabelle auf S. 14, die Statuszeilen
greifen den dort vorgegebenen Wortlaut auf.

Die sichtbare Veränderung ist die Aussage: im ersten Zustand stehen die
Karten gegeneinander versetzt und ohne Verbindung, im zweiten fluchten sie
auf einer Linie und sind durch eine Haarlinie verbunden. Gemessen wandern
sie von 490/516/502 auf 490/490/490.

S. 7 verlangt ausdrücklich Entlastung statt Angstkommunikation, S. 14
verbietet Schockzahlen und Insolvenzszenarien. Der erste Zustand ist
deshalb nur unruhig gesetzt, nicht bedrohlich.

---

## Section 7 — Werte und Selektion

Der einzige Abschnitt in voller Navy-Fläche. S. 20: „Dunkle Vollflächen nur
als bewusste Spannungsmomente." Deshalb eine gefärbte Fläche und kein Bild —
die beiden Bildbänder in Abschnitt 5 sind bereits dunkel.

Die drei Markenworte müssen in **eine** Zeile passen, sonst bricht das letzte
um und der zugehörige Goldstrich hängt am Zeilenende ins Leere. Die Größe ist
daraus gerechnet (rund 3,3 vw); unter 900 px stehen die Worte untereinander.

Die vier Punkte unter „Wann Estera bewusst Nein sagt" stehen wörtlich auf S. 16.

---

## Section 9 — Wissen, Karriere und Abschluss

S. 18/19. Nur die **Fragen**, keine Antworten — die gehören laut S. 3 auf die
Unterseite. Die Karriere-Aussage ist wörtlich von S. 19. Danach der
Abschluss-CTA „Erstgespräch vereinbaren".

---

## Fuß

Kontakt, Rechtliches und ein Risikohinweis. **Firmierung, Anschrift, Telefon,
Registerangaben und die Erlaubnis nach § 34c GewO sind Platzhalter** und
müssen von Estera geliefert werden — ein falsches Impressum ist abmahnfähig.

---

## Ablauf

Senkrechte Linie links, sechs nummerierte Schritte rechts daneben, dazu zwei
Bilder desselben Gebäudes: hochformatig rechts, querformatig darunter und
überlappend.

Die Anordnung ist an der Referenz ausgemessen: linke Kante des Querbilds bei
26,5 % der Breite, Breite 46,6 %, rund 29 % seiner Höhe überlappen das
Hochbild.

**Buchstaben statt Strich auf der Bildkante.** Überschriften und Fließtext
fluchten exakt mit der linken Kante des Querbilds (0 px Versatz von 1280 bis
1920 px). Die Ziffern hängen als Marginalie nach links aus, die Linie läuft
noch weiter links daran vorbei.

Die Linie endet nicht am Abschnitt, sondern **auf der Unterkante des
Querbilds**. Das lässt sich in CSS nicht ausdrücken, weil die Höhe eines
prozentual breiten Bildes dort nicht verfügbar ist — `site.js` misst beide
Kanten zur Laufzeit und setzt `bottom` (0 px Abweichung auf allen geprüften
Breiten, neu berechnet bei `resize` und nach `document.fonts.ready`).

Unter 1100 px fallen beide Bilder weg; Linie und Text rücken an den normalen
Seitenrand zurück.

---

## Geprüft

- Bündigkeit Text ↔ Bildkante: 0 px bei 1920 / 1600 / 1440 / 1280.
- Abstand Fließtext ↔ Hochbild: mindestens 32 px auf allen Breiten.
- Kein horizontales Scrollen von 390 px bis 1920 px, keine Konsolenfehler.
- Farbton beider Ablauf-Bilder angeglichen: Rot/Blau-Verhältnis 1,023 zu 1,001.
- Kopfnavigation über dem Bildband: 11,9:1 bis 16,6:1, schlechtester
  Einzelpixel 9,74:1.
- Kontraste nach WCAG AA gemessen: Headline schwarz 13.6:1, Headline blau
  10.2:1, `--ink-mute` `#5F6E85` bei 5.20:1, Gold als Schrift `#86693A` bei
  4.82:1 — alles über der Anforderung.
- Menü-Overlay: Öffnen, Escape, Fokusfalle, Fokus-Rückgabe an den Burger,
  Body-Scroll-Sperre.
- `prefers-reduced-motion` schaltet alle Bewegung ab.

---

## Grundsatz zum Inhalt

Briefing S. 3: **„Nur echte Bewertungen, Nachweise, Zahlen, Partnerschaften und
Zertifikate."**

Auf der Seite steht deshalb keine erfundene Zahl, Bewertung, Zertifizierung,
kein erfundenes Partnerlogo und kein erfundenes Teammitglied. Keine
Renditeversprechen, keine Steuer-, Null-Euro- oder Ohne-Eigenkapital-Aussagen.

Wording: nicht „ausgewählte Wohnimmobilien", sondern
**Kapitalanlageimmobilien** bzw. **Off-Market-Objekte**. „Bauträger" und
„Direktverkäufer" kommen nicht vor — Estera ist keins von beidem.

---

## Offen / vom Kunden benötigt

- **Leistungsumfang.** Briefing S. 14: Estera muss den tatsächlichen Umfang vor
  Veröffentlichung bestätigen. Die sechs Schritte bilden den *Ablauf* ab, nicht
  einen zugesicherten Leistungskatalog.
- **Vier Referenzen**: Logo als SVG, Name, Funktion, der Satz wörtlich,
  schriftliche Freigabe für Logo, Name und Zitat.
- **Logo als SVG.** Aktuell ist die Wortmarke typografisch nachgebaut
  (Cormorant Garamond, Sperrsatz). Sobald das echte Logo da ist, ersetzt es
  `.wordmark` in beiden HTML-Dateien.
- **Bilder.** Aktuell Platzhalter unter `assets/img/`. Sie zeigen die
  Bildsprache, sind aber nicht final und zeigen keine echten Estera-Objekte.
- **Kontaktdaten, Impressum, Datenschutz.** Navigationsziele sind vorbereitet,
  aber noch nicht befüllt.

Fonts liegen lokal unter `assets/fonts/` — **kein Google-Fonts-CDN**. Für eine
deutsche Website ist das Einbinden über Googles Server ein DSGVO-Risiko
(LG München I, 3 O 17493/20).
