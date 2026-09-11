#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSS-LECK-PRUEFUNG — vor jedem Push einmal laufen lassen.

    python3 tools/css-leck-pruefung.py

WONACH SIE SUCHT. Eine Regel fuer schmale Fenster steht in einem
@media (max-width: …)-Block. Steht SPAETER in derselben Datei eine Regel
OHNE Media-Query, die denselben Selektor trifft und dieselbe Eigenschaft
anders setzt, gewinnt die spaetere — auch auf dem Telefon. Die Handy-Regel
ist damit tot, ohne dass es jemand sieht.

WARUM DAS GEFAEHRLICH IST. Genau so lag am 11.09.2026 in warum.css eine
Desktop-Regel `.wi__feld { aspect-ratio: 1240/295 }` hinter dem Mobile-Block
und hob dessen `aspect-ratio: auto` auf. Chrome, Firefox und neuere
WebKit-Fassungen liessen die Box trotzdem auf ihren Inhalt wachsen — auf
den Telefonen des Teams war nichts zu sehen. Das WebKit auf dem Telefon
des Kunden nahm das Verhaeltnis woertlich: die vier Karten quollen aus
dem Feld und lagen ueber der Tafel darunter.

WAS SIE MELDET. Kandidaten, keine Urteile. Jede gemeldete Stelle lesen:
eine spaetere Regel kann gewollt sein (dann steht es im Kommentar davor —
z. B. .wi__vgl in warum.css, seit dem 04.09.2026 auf allen Breiten volle
Breite). Ist sie nicht gewollt, gehoert sie in einen
@media (min-width: …)-Block.

Getroffen wird auch ein spezifischerer Selektor, der auf denselben
Selektor endet (`.wi .wi__feld` gegen `.wi__feld`) — solche
Ueberschreibungen gewinnen erst recht. Nicht getroffen werden
Ueberschreibungen ueber andere Klassen desselben Elements; dafuer
braucht es einen Browser. Blosse Tag-Selektoren (`ul`) werden nicht
verglichen, und Bereiche wie (min-width: 1340px) and (max-width: 1560px)
zaehlen nicht als Handy-Block.

Media-Queries, die das Telefon NICHT treffen, zaehlen nicht als Leck:
min-width, hover: hover, prefers-*, orientation, max-height.
"""
import re, glob, sys

HANDYFREMD = ('min-width', 'hover', 'prefers-', 'orientation', 'max-height', 'print')

def ohne_kommentare(css):
    # Zeilenzahl bleibt erhalten: jeder Kommentar wird durch seine Umbrueche ersetzt.
    return re.sub(r'/\*.*?\*/', lambda m: '\n' * m.group(0).count('\n'), css, flags=re.S)

def regeln(css):
    """Liefert (zeile, media, selektor, {eigenschaft: wert}) fuer jede Regel."""
    t = ohne_kommentare(css)
    aus = []
    stapel = []            # offene @-Bloecke, innerster zuletzt
    for m in re.finditer(r'([^{}]+)\{|(\})', t):
        if m.group(2):
            if stapel: stapel.pop()
            continue
        sel = m.group(1).strip()
        zeile = t.count('\n', 0, m.end()) + 1
        if sel.startswith('@'):
            stapel.append(sel if sel.startswith('@media') else None)
            continue
        # Gewoehnliche Regel: Platzhalter auf den Stapel. Ihre schliessende
        # Klammer kommt als eigener Treffer und nimmt ihn wieder herunter —
        # NICHT hier abbauen, sonst raeumt jene Klammer den @media-Eintrag
        # darunter ab und der Rest des Blocks gilt faelschlich als
        # „ohne Media-Query". (So geschehen am 11.09.2026, drei Fehlalarme.)
        stapel.append('')
        ende = t.find('}', m.end())
        koerper = t[m.end():ende]
        eig = {}
        for d in koerper.split(';'):
            if ':' in d:
                p, v = d.split(':', 1)
                eig[p.strip()] = re.sub(r'\s+', ' ', v.strip())
        media = next((s for s in reversed(stapel) if s), None)
        for s in (x.strip() for x in sel.split(',')):
            if s: aus.append((zeile, media, s, eig))
    return aus

def letzte_klasse(selektor):
    teil = re.split(r'[\s>+~]+', selektor.strip())[-1]
    teil = re.sub(r'::?[a-zA-Z-]+(\([^)]*\))?', '', teil)   # Pseudo weg
    return teil

def trifft_handy(media):
    if media is None: return None          # ohne Media-Query: trifft alles
    return not any(k in media for k in HANDYFREMD)

def pruefen(datei):
    css = open(datei, encoding='utf-8').read()
    rs = regeln(css)
    funde = []
    for i, (z1, m1, s1, e1) in enumerate(rs):
        if not m1 or 'max-width' not in m1 or 'min-width' in m1: continue
        k1 = letzte_klasse(s1)
        if not k1.startswith('.'): continue
        for z2, m2, s2, e2 in rs[i + 1:]:
            if trifft_handy(m2) is False: continue      # trifft das Telefon nicht
            if m2 and 'max-width' in m2: continue       # selbst ein Handy-Block
            if letzte_klasse(s2) != k1: continue
            if not (s2 == s1 or s2.endswith(' ' + s1) or s2.endswith('>' + s1)): continue
            anders = [p for p in e1 if p in e2 and e1[p] != e2[p]]
            if anders:
                funde.append((s1, z1, m1, s2, z2, {p: e2[p] for p in anders}))
    return funde

def main():
    gesamt = 0
    for datei in sorted(glob.glob('assets/css/*.css')):
        funde = pruefen(datei)
        if not funde: continue
        gesamt += len(funde)
        print(f"\n{datei}")
        for s1, z1, m1, s2, z2, eig in funde:
            print(f"  Handy   Z.{z1:<5} {s1}   [{m1}]")
            print(f"  spaeter Z.{z2:<5} {s2}   [ohne Media-Query] setzt "
                  + ', '.join(f'{p}: {v}' for p, v in eig.items()))
    if gesamt == 0:
        print("Keine Kandidaten — keine Handy-Regel wird spaeter ohne Media-Query ueberschrieben.")
    else:
        print(f"\n{gesamt} Kandidat(en). Jede Stelle lesen: gewollt (steht im Kommentar davor) "
              "oder in einen @media (min-width: …)-Block verschieben.")
    return 0

if __name__ == '__main__':
    sys.exit(main())
