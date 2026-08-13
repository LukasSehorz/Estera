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
variante-a.html     Variante A — Hero, Kundenstimmen, Ablauf
assets/css/
  fonts.css         @font-face, self-hosted
  base.css          Tokens, Header, Menü-Overlay, Buttons, Rotator
  hero-a.css        Bildband + eingelegter Kasten
  hero-b.css        Imperia-Geometrie
  reviews.css       Kundenstimmen
  leistungen.css    Ablauf (senkrechte Linie + zwei Bilder)
  loop.css          Lemniskaten-Variante des Ablaufs, derzeit nicht eingebunden
assets/js/site.js   Menü, Sticky-Header, Rotator, Reveal, Linienlänge
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

## Kundenstimmen

Vier **echte** Google-Bewertungen (Younes Karali, Sandro Horn,
Johannes Strasser, eight1six), versetzt gesetzt.

Statt Porträtfotos steht eine Initiale im Medaillon: Fotos der Bewertenden
liegen nicht vor, und Fremdfotos neben echten Namen wären Falschdarstellung
realer Personen.

Kennzahl, Sterne, Anzahl und Quelle stehen bewusst zusammen. Wer mit einem
Bewertungsschnitt wirbt, muss erkennbar machen, worauf er beruht und woher er
stammt (§ 5 UWG, § 5b Abs. 3 UWG). *Keine Rechtsberatung.*

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
- **URL des Google-Profils** für den Link unter den Bewertungen.
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
