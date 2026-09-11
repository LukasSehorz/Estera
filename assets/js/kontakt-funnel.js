/* ===========================================================================
   ESTERA — Kontaktseite: die drei Anliegen als mehrstufige Strecke
   Markenkern: Diskret. Strukturiert. Langfristig.

   WOZU DIESE DATEI
   Der Kunde will die Strecken der beiden Vorlagen 1:1 („Jeder einzelne
   Schritt soll genau gleich sein wie hier bei Invenio."). Im HTML stehen
   deshalb alle Schritte als gewoehnliche <fieldset> untereinander. Dieses
   Skript faltet sie zusammen: es zeigt einen Schritt, setzt Fortschritt,
   „Weiter" und „Zurück" davor und laesst die uebrigen ruhen.

   WAS ES AUSDRUECKLICH NICHT TUT
     — Es baut keinen Schritt und keine Frage. Alles, was gelesen wird,
       steht im HTML. Faellt diese Datei aus, bleibt jede Frage lesbar und
       jedes Feld erreichbar; die Pflichtangaben prueft dann der Browser
       ueber `required`.
     — Es taeuscht kein Absenden vor, das nicht stattfindet. Solange
       `action` leer ist, zeigt es das Schlussbild der Vorlage — der Kunde
       hat es 1:1 verlangt. Sobald jemand `action` fuellt, sendet das
       Formular wirklich und das Skript haelt es nicht mehr auf (siehe
       absenden()).
       ACHTUNG: Der sichtbare Vorbehalt darunter („Formular noch nicht
       angebunden. Dieses Formular ist eine Ansichtsfassung …") ist am
       31.08.2026 auf Kundenwunsch entfernt worden. Der Sachverhalt ist
       unveraendert, nur steht er jetzt ausschliesslich als Kommentar im HTML
       bei Strecke 1. Wer das liest, bevor die Seite live geht: dort steht
       die Liste, was vorher eingetragen sein MUSS.

   WAS ES SEIT DEM 31.08.2026 ZUSAETZLICH TUT
     Es schaltet auch zwischen den drei ANLIEGEN um. Bis zum Vormittag jenes
     Tages machten das drei versteckte <input type="radio"> und der
     Geschwisterselektor :checked in kontakt.css, ganz ohne Javascript.
     Seit der Kunde das Vollbild verlangt hat, geht das nicht mehr: Fokus
     hineinlenken und zurueckgeben, die Seite dahinter stilllegen und an
     derselben Stelle freigeben, Esc abfangen — nichts davon kann CSS. Die
     Radios sind deshalb entfallen; an ihrer Stelle stehen drei gewoehnliche
     Verweise, die OHNE dieses Skript zu den offen stehenden Strecken
     springen und MIT ihm das Vollbild oeffnen.

   WARUM DIE HOEHE NICHT SPRINGT
   Nicht durch Messen. Sobald dieses Skript laeuft, setzt es
   data-funnel-aktiv auf das Formular; darauf legt kontakt.css alle Schritte
   in DIESELBE Rasterzelle. Damit ist die Buehne von sich aus so hoch wie
   ihr hoechster Schritt — ohne Zahl, die bei jedem Schriftgroessenwechsel
   nachgerechnet werden muesste. Die ruhenden Schritte tragen
   visibility:hidden: das nimmt sie aus der Tabreihenfolge UND aus dem Baum
   der Vorlesesoftware, laesst sie aber Platz belegen. Genau das wird hier
   gebraucht.

   BARRIEREFREIHEIT — DIE VIER PUNKTE, DIE HIER HAENGEN
     1  Beim Schrittwechsel wandert der Fokus auf die Frage des neuen
        Schritts ([data-frage], tabindex="-1").
     2  Der Fortschritt wird ueber eine aria-live-Region angesagt. Sie sagt
        NUR „Schritt 3 von 6" — die Frage liest die Vorlesesoftware ohnehin
        vor, weil der Fokus dorthin gewandert ist. Zweimal waere Laerm.
     3  „Weiter" ist gesperrt, solange die Pflichtangabe fehlt — aber mit
        aria-disabled und NICHT mit dem Attribut `disabled`. Ein disabled
        Knopf ist nicht fokussierbar: wer mit der Tastatur arbeitet, findet
        ihn nicht und erfaehrt nie, warum es nicht weitergeht. So bleibt er
        erreichbar, sagt „nicht verfuegbar" an, traegt ueber
        aria-describedby den Grund — und ein Druck darauf springt zur
        fehlenden Angabe, statt nichts zu tun.
     4  Zurueck geht immer. Beide Vorlagen haben keinen sichtbaren
        Zurueck-Knopf; damit ist jeder Fehlklick eine Sackgasse. Hier gibt
        es einen, bewusst leise gesetzt.
   =========================================================================== */
(function () {
  'use strict';

  var wurzel = document.querySelector('[data-kontakt]');
  if (!wurzel) return;

  /* --- Texte, die nicht im HTML stehen koennen ------------------------------
     Alles Sichtbare der Strecke steht im HTML. Diese vier Zeilen entstehen
     erst im Betrieb und haben dort keinen Platz.
     KEINER DAVON STAMMT VOM KUNDEN — VON ESTERA BESTAETIGEN LASSEN. */
  var TEXT = {
    weiter:      'Weiter',
    zurueck:     'Zurück',
    grundWahl:   'Wähl eine Antwort, dann geht es weiter.',
    grundFeld:   'Fülle die Pflichtfelder aus, dann geht es weiter.',
    /* Die Fehlermeldungen sind wortgleich aus dem abgeloesten
       assets/js/kontakt.js uebernommen, damit die Seite in der Sache
       weiterspricht wie bisher. */
    /* Das Feld heisst seit dem 01.09.2026 „Vor- und Nachname"
       (Optimierungsbriefing, Abschnitt 12) — die Meldung sagt dasselbe Wort
       wie die Beschriftung, sonst sucht man ein Feld, das es nicht gibt.
       Vorher: 'Bitte trag deinen Namen ein.' */
    fehltName:   'Bitte trag deinen Vor- und Nachnamen ein.',
    fehltVor:    'Bitte trag deinen Vornamen ein.',
    fehltNach:   'Bitte trag deinen Nachnamen ein.',
    fehltMail:   'Bitte trag deine E-Mail-Adresse ein.',
    /* Neu am 11.09.2026 mit der Einwilligung. Sie braucht eine eigene
       Meldung: „Fülle die Pflichtfelder aus" schickt bei einem Kreuzfeld
       auf die Suche nach einem Feld, in das man etwas schreiben koennte. */
    fehltDsgvo:  'Ohne deine Einwilligung dürfen wir die Angaben nicht verarbeiten.',
    formMail:    'Diese E-Mail-Adresse sieht nicht vollständig aus. Fehlt das @?',
    fehltTel:    'Bitte trag eine Telefonnummer ein, unter der wir dich erreichen.',
    fehltJahr:   'Ein Jahr genügt — zum Beispiel „2016".',
    /* Neu am 31.08.2026, weil „In welchem Bereich warst du tätig?" und
       „Welche Aufgaben hattest du?" auf Kundenwunsch Pflicht geworden sind.
       Ohne eigene Meldung fielen beide auf fehltAllg zurueck („Diese Angabe
       wird gebraucht.") — richtig, aber es sagt nicht, WAS erwartet wird, und
       genau das ist die Regel dieser Liste: jede Meldung stellt die Frage noch
       einmal. Beide Saetze sind meine Worte.
       VON ESTERA BESTAETIGEN LASSEN. */
    fehltBereich:'In welchem Bereich warst du tätig? Ein Stichwort genügt.',
    fehltAufgab: 'Beschreib kurz, was du in dieser Stelle gemacht hast.',
    fehltAllg:   'Diese Angabe wird gebraucht.',
    /* Neu am 01.09.2026 — Optimierungsbriefing, Abschnitt 18: „Fehler direkt
       unter dem betroffenen Feld anzeigen." Bis dahin bekam eine Radiogruppe
       ohne Kreuz gar keine Meldung: der Fokus sprang auf die erste Kachel, und
       die Begruendung stand nur unsichtbar am Weiterknopf (aria-describedby).
       Wer sieht, sah nichts passieren. Jetzt steht der Satz unter den Kacheln,
       im Behaelter .kf__fehler--gruppe des Schritts.
       VON ESTERA BESTAETIGEN LASSEN. */
    fehltWahl:   'Bitte wähl eine Antwort aus.',
    /* Neu am 11.09.2026 mit dem echten Versand. Bis dahin konnte gar nichts
       schiefgehen, weil nichts weggeschickt wurde. Jetzt kann die Leitung
       abreissen oder die Gegenstelle antworten, dass sie die Anfrage nicht
       annimmt — und dann darf NICHT das Dankebild erscheinen.
       Der Satz nennt den zweiten Weg, damit niemand vor einer Sackgasse
       steht: die E-Mail-Adresse steht ohnehin auf derselben Seite. */
    sendeFehler: 'Das Absenden hat gerade nicht geklappt. Versuch es bitte noch einmal — oder schreib uns an info@estera.immobilien.',
    sendeLaeuft: 'Wird gesendet …'
  };

  /* Ein Werkzeug, kein Vorgriff: erspart zehn createElement-Dreizeiler. */
  function bau(tag, klasse, text) {
    var k = document.createElement(tag);
    if (klasse) k.className = klasse;
    if (text) k.textContent = text;
    return k;
  }

  /* Der gewaehlte Wert einer Radiogruppe.
     NICHT ueber form.elements[name].value: hat eine Gruppe nur EIN Radio —
     Schritt 1 der Invenio-Strecke ist so eine —, liefert form.elements den
     Knoten selbst statt einer RadioNodeList, und .value gibt dann den Wert
     des Attributs zurueck, egal ob angekreuzt oder nicht. Die Strecke waere
     ab Schritt 1 offen. */
  function gruppenWert(form, name) {
    var alle = form.querySelectorAll('input[type="radio"][name="' + name + '"]');
    for (var i = 0; i < alle.length; i++) {
      if (alle[i].checked) return alle[i].value;
    }
    return '';
  }

  function reduziert() {
    return window.matchMedia &&
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ===========================================================================
     DAS VOLLBILD

     Kundenwunsch vom 31.08.2026: „Die Kontaktformulare sind erst sichtbar,
     wenn man auf eine dieser Fragen klickt. Das Popup öffnet sich über die
     ganze Section […] Der Bildschirm bekommt die Farbe Navy Blue und die
     Schriftfarbe ist weiß."

     ES IST EIN ECHTES <dialog> MIT showModal()
     Das ist keine Bequemlichkeit. Ein Vollbild ist die Stelle, an der ein
     handgebautes Overlay fast immer etwas vergisst — und der Browser bringt
     genau das Vergessene mit:
       — die Fokusfalle: mit Tab kommt man nicht in die Seite dahinter,
       — Esc schliesst,
       — alles hinter dem Kasten ist stillgelegt (inert), fuer Zeigegeraet
         UND fuer Vorlesesoftware, ohne ein einziges aria-hidden,
       — die oberste Ebene: der Kasten liegt ueber allem, auch ueber der
         Kopfleiste mit ihrem z-index von 60. Kein Wettruesten um Zahlen.
     Nachgebaut ist hier nur, was der Browser NICHT mitbringt: der Fokus
     zurueck auf die Frage, die geoeffnet hat; das Stilllegen des Rollstands
     dahinter samt punktgenauer Wiederherstellung; der Klick auf die Flaeche
     daneben; und der Zurueck-Druck des Browsers.

     WOHIN DIE FORMULARE WANDERN
     Im HTML stehen die drei Strecken unter den Fragen — dort sind sie ohne
     Javascript erreichbar. Laeuft Javascript, wird dieser ganze Block beim
     Laden HIERHER verschoben. Verschoben, nicht kopiert: die Formulare
     behalten dabei jede Eingabe und jedes Kreuz, auch ueber Schliessen und
     Wiederoeffnen hinweg.
     Damit ist im Ruhezustand der Seite kein einziges Eingabefeld sichtbar —
     genau das hatte der Kunde verlangt.
     =========================================================================== */
  var buehne = wurzel.querySelector('.kf__buehne');
  /* JETZT einsammeln, nicht spaeter. Gleich wandert die Buehne aus [data-kontakt]
     heraus in das <dialog> am Ende des <body> — von da an findet eine Suche
     unterhalb von wurzel kein einziges Formular mehr. Diese Liste haelt die
     Knoten selbst und ueberlebt den Umzug. */
  var formulare = buehne
    ? Array.prototype.slice.call(buehne.querySelectorAll('form[data-funnel]'))
    : [];
  var kasten = null;        /* das <dialog>                                   */
  var kanal = null;         /* der rollbare Kanal darin                       */
  var zuKnopf = null;
  var ausloeser = null;     /* die Frage, die geoeffnet hat                   */
  var rollstand = 0;
  var geschichte = false;   /* haben wir einen Verlaufseintrag gesetzt?       */
  var istOffen = false;
  var altesWiederherstellen = null;

  function vollbildBauen() {
    if (!buehne) return false;
    var probe = document.createElement('dialog');
    /* Kein <dialog>? Dann gibt es kein Vollbild. Die Strecken bleiben auf
       der Seite stehen und funktionieren dort Schritt fuer Schritt weiter —
       schlechter als das Vollbild, aber nie kaputt. */
    if (typeof probe.showModal !== 'function') return false;

    kasten = probe;
    kasten.className = 'kf__voll';
    kanal = bau('div', 'kf__voll__roll');
    var innen = bau('div', 'kf__voll__innen');
    var kopf = bau('div', 'kf__voll__kopf');

    /* WORTMARKE UND SCHLIESSKNOPF.

       DIE WORTMARKE WAR EINE HALBE STUNDE LANG WEG. Auf „Jeder restliche Text
       soll einfach raus, nur das soll zu sehen sein, sonst nichts" hatte ich
       sie entfernt. Der Kunde hat danach ausdruecklich ueber sie gesprochen:
       „das Estera-Logo oben im Popup ist blau, nicht weiss. Das muss weiss
       sein, damit man es lesen kann." Er will sie also sehen — sie steht
       wieder da, und zwar in Weiss.
       Sie ist auch nicht der Text, den er meinte: der stand im Formular und
       nicht in der Leiste darueber.

       Der Schliessknopf bleibt, weil er Bedienung ist und kein Text — ohne
       ihn kaeme man mit der Maus aus dem Popup nicht heraus.
       Auch seine Beschriftung „Schließen" ist ein Wort auf dem Bildschirm.
       Sie bleibt trotzdem: ein blosses Kreuz ohne Namen ist fuer
       Vorlesesoftware ein Knopf ohne Bedeutung, und ein aria-label waere
       genau der Fall, in dem sehende und nicht sehende Besucher
       Verschiedenes bekommen. Das Kreuz ist das Bild dazu (aria-hidden).

       Fester Bau ohne eine einzige Angabe von aussen — deshalb ist innerHTML
       hier unbedenklich und liest sich besser als zwanzig createElement. */
    kopf.innerHTML =
      '<span class="wordmark">' +
        '<span class="wordmark__name">ESTERA</span>' +
        '<span class="wordmark__sub">Immobilien</span>' +
      '</span>' +
      '<button class="kf__voll__zu" type="button">Schließen' +
        '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" ' +
             'stroke-width="1" aria-hidden="true">' +
          '<line x1="2" y1="2" x2="16" y2="16"></line>' +
          '<line x1="16" y1="2" x2="2" y2="16"></line>' +
        '</svg>' +
      '</button>';
    zuKnopf = kopf.querySelector('.kf__voll__zu');

    innen.appendChild(kopf);
    innen.appendChild(buehne);          /* verschiebt, kopiert nicht */
    kanal.appendChild(innen);
    kasten.appendChild(kanal);
    document.body.appendChild(kasten);

    zuKnopf.addEventListener('click', function () { schliessen(false); });

    /* Esc. Der Browser wuerde von sich aus schliessen — dann liefe unser
       Aufraeumen aber nicht: die Seite bliebe festgestellt und der Fokus
       laege im Nichts. Deshalb abfangen und selbst schliessen. */
    kasten.addEventListener('cancel', function (ev) {
      ev.preventDefault();
      schliessen(false);
    });

    /* Klick auf die Flaeche daneben. Getroffen sein muss der Kanal selbst
       oder der Kasten — also das Navy links und rechts vom Formular oder
       unter ihm. Ein Klick INS Formular steigt zwar auch hierher auf, hat
       dann aber ein anderes Ziel und wird nicht behandelt.
       Das ist ungefaehrlich: die Strecke behaelt beim Schliessen jede
       Eingabe und steht beim naechsten Oeffnen auf demselben Schritt. */
    kasten.addEventListener('mousedown', function (ev) {
      if (ev.target === kanal || ev.target === kasten) schliessen(false);
    });

    /* Der Zurueck-Druck des Browsers soll das Vollbild schliessen und nicht
       die Seite verlassen. */
    window.addEventListener('popstate', function () {
      if (istOffen) schliessen(true);
      /* Unser Eintrag ist weg — ab hier darf der Browser den Rollstand
         wieder selbst fuehren. Erst JETZT, nicht schon in schliessen():
         history.back() wirkt verzoegert, und ein zu frueh
         zurueckgestelltes 'auto' haette genau den Sprung wieder erlaubt,
         den wir gerade abgestellt haben. */
      if (altesWiederherstellen !== null && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = altesWiederherstellen;
        altesWiederherstellen = null;
      }
    });

    return true;
  }

  /* --- die Seite dahinter stilllegen ---------------------------------------
     position:fixed statt overflow:hidden. overflow:hidden auf <html> setzt
     in mehreren Browsern den Rollstand auf null zurueck — beim Schliessen
     staende die Seite dann ganz oben statt dort, wo man war. Der negative
     top-Wert haelt das Bild an derselben Stelle, und beim Freigeben wird
     genau dieser Wert wieder angerollt.
     base.css setzt html { scroll-behavior: smooth } — ohne die zwei Zeilen
     drumherum wuerde die Seite beim Schliessen sichtbar an ihre alte Stelle
     zurueckgleiten statt einfach dort zu sein. */
  function seiteFest() {
    rollstand = window.pageYOffset || document.documentElement.scrollTop || 0;
    var k = document.body.style;
    k.position = 'fixed';
    k.top = (-rollstand) + 'px';
    k.left = '0';
    k.right = '0';
    k.width = '100%';
  }

  function seiteFrei() {
    var k = document.body.style;
    k.position = '';
    k.top = '';
    k.left = '';
    k.right = '';
    k.width = '';

    /* GEMESSEN: ohne diese Zeile landete die Seite auf 0 statt auf 420.
       Solange body auf position:fixed stand, war das Dokument nur so hoch
       wie das Fenster — es gab gar keine 420 zum Hinrollen. Der Browser
       rechnet die neue Hoehe erst beim naechsten Bild aus, und scrollTo
       waere bis dahin auf den alten Hoechstwert gekappt worden. Das Lesen
       von offsetHeight erzwingt die Neuberechnung sofort. */
    void document.body.offsetHeight;

    /* base.css setzt html { scroll-behavior: smooth } — ohne die zwei Zeilen
       drumherum gliete die Seite beim Schliessen sichtbar an ihre alte
       Stelle zurueck, statt einfach dort zu sein. */
    var w = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, rollstand);
    document.documentElement.style.scrollBehavior = w;
  }

  function oeffnen(formId, vonWo) {
    if (istOffen || !kasten) return;
    var form = document.getElementById(formId);
    if (!form) return;

    formulare.forEach(function (f) {
      if (f === form) f.setAttribute('data-voll-aktiv', '');
      else f.removeAttribute('data-voll-aktiv');
    });

    /* Der Kasten heisst wie die Strecke darin — Vorlesesoftware sagt beim
       Oeffnen „Dialog, Erstgespräch anfragen" an und nicht „Dialog". */
    var titel = form.getAttribute('aria-labelledby');
    if (titel) kasten.setAttribute('aria-labelledby', titel);

    ausloeser = vonWo || null;
    seiteFest();
    kasten.showModal();
    istOffen = true;
    if (ausloeser) ausloeser.setAttribute('aria-expanded', 'true');

    kanal.scrollTop = 0;
    /* Der Fokus faellt auf die Frage des laufenden Schritts — nicht auf das
       erste Feld und nicht ins Leere. Gibt es sie nicht, faengt ihn der
       Schliessknopf: ein Fokus ausserhalb des Kastens waere der schlimmste
       Ausgang. */
    var ziel = form.querySelector('[data-aktiv] [data-frage]') || zuKnopf;
    if (ziel) ziel.focus({ preventScroll: true });

    if (window.history && window.history.pushState) {
      /* GEMESSEN, UND DIE URSACHE WAR HIER: die Seite landete nach dem
         Schliessen auf 0 statt auf 420.
         Der Browser merkt sich zu jedem Verlaufseintrag den Rollstand und
         stellt ihn beim Zurueckgehen selbst wieder her
         (history.scrollRestoration === 'auto'). Gemerkt hat er sich die
         Null — denn zum Zeitpunkt des pushState stand die Seite bereits
         auf position:fixed und damit rechnerisch ganz oben. Sein
         Wiederherstellen kam nach unserem und gewann.
         'manual' schaltet es ab: den Rollstand fuehren seiteFest() und
         seiteFrei(), und zwar mit dem Wert von VOR dem Feststellen.
         Zurueckgestellt wird es, sobald unser Eintrag wieder weg ist —
         siehe den popstate-Horcher. */
      try {
        if ('scrollRestoration' in window.history && altesWiederherstellen === null) {
          altesWiederherstellen = window.history.scrollRestoration;
          window.history.scrollRestoration = 'manual';
        }
        window.history.pushState({ kfVoll: formId }, '');
        geschichte = true;
      } catch (e) {
        geschichte = false;
      }
    }
  }

  function schliessen(vomVerlauf) {
    if (!istOffen) return;
    istOffen = false;
    kasten.close();
    seiteFrei();

    if (ausloeser) {
      ausloeser.setAttribute('aria-expanded', 'false');
      /* preventScroll: seiteFrei() hat den Rollstand gerade punktgenau
         wiederhergestellt — ein Fokus, der von sich aus rollt, machte das
         sofort wieder kaputt. */
      ausloeser.focus({ preventScroll: true });
    }

    if (geschichte && !vomVerlauf) {
      geschichte = false;
      window.history.back();
    } else {
      geschichte = false;
    }
  }

  /* --------------------------------------------------------------------------
     EINE STRECKE
  -------------------------------------------------------------------------- */
  function strecke(form) {
    var buehne = form.querySelector('[data-funnel-stufen]');
    if (!buehne) return;

    var stufen = Array.prototype.slice.call(buehne.querySelectorAll('[data-stufe]'));
    if (stufen.length < 2) return;

    /* Die Schlussbilder aus ihren <template> holen und SOFORT einhaengen —
       nicht erst, wenn sie dran sind. Sie stehen dann in derselben
       Rasterzelle wie die Schritte und zaehlen von Anfang an bei der Hoehe
       der Buehne mit. Wuerde man sie spaeter einhaengen, koennte die Buehne
       genau beim letzten Klick noch einmal wachsen. */
    var enden = {};
    Array.prototype.forEach.call(
      buehne.querySelectorAll('template[data-funnel-ende]'),
      function (vorlage) {
        var stueck = vorlage.content.firstElementChild;
        if (!stueck) return;
        var knoten = stueck.cloneNode(true);
        buehne.appendChild(knoten);
        enden[vorlage.getAttribute('data-funnel-ende')] = knoten;
      }
    );

    var bilder = stufen.slice();
    Object.keys(enden).forEach(function (k) { bilder.push(enden[k]); });

    /* Die Zaehlung: fuenf Schritte zum Ausfuellen plus das Dankebild.
       Das Absagebild zaehlt NICHT mit — wer dort landet, hat drei Schritte
       hinter sich und nicht sechs. */
    var gesamt = stufen.length + (enden.danke ? 1 : 0);

    /* --- Fortschritt ------------------------------------------------------
       Die Zahl steht sichtbar in der Form der Vorlagen („3 / 6") und ist
       aria-hidden; daneben liegt derselbe Stand als ganzer Satz fuer die
       Vorlesesoftware. Ein „3 / 6" wuerde je nach Software als „drei
       Schraegstrich sechs" oder gar nicht vorgelesen. */
    var fortschritt = bau('div', 'kf__fortschritt');
    var zahl = bau('p', 'kf__fortschritt__zahl');
    zahl.setAttribute('aria-hidden', 'true');
    var schiene = bau('div', 'kf__fortschritt__schiene');
    schiene.setAttribute('aria-hidden', 'true');
    var balken = bau('span', 'kf__fortschritt__balken');
    schiene.appendChild(balken);
    var ansage = bau('p', 'kf__fortschritt__ansage');
    ansage.setAttribute('role', 'status');
    ansage.setAttribute('aria-live', 'polite');
    fortschritt.appendChild(zahl);
    fortschritt.appendChild(schiene);
    fortschritt.appendChild(ansage);

    var kopf = form.querySelector('.kf__formular__kopf');
    if (kopf && kopf.nextSibling) {
      form.insertBefore(fortschritt, kopf.nextSibling);
    } else {
      form.insertBefore(fortschritt, buehne);
    }

    /* --- Fussleiste -------------------------------------------------------
       Sie liegt AUSSERHALB der Buehne. Dadurch sitzt die Hauptaktion auf
       jedem Schritt an derselben Stelle und wandert nicht mit der Laenge der
       Frage nach oben und unten. */
    var nav = bau('div', 'kf__nav');
    var aktion = bau('div', 'kf__nav__aktion');

    var zurueck = bau('button', 'kf__zurueck', TEXT.zurueck);
    zurueck.type = 'button';

    var weiter = bau('button', 'btn kf__weiter', TEXT.weiter);
    weiter.type = 'button';

    /* DIE BEGRUENDUNG STEHT NICHT MEHR AUF DEM BILDSCHIRM — 31.08.2026,
       Kundenwunsch woertlich: „Dann das ‚Wähl eine Antwort, dann geht es
       weiter' — das braucht es nicht."
       Der Grund, warum sie ueberhaupt dastand, gilt weiter: der Weiterknopf
       ist aria-disabled, und ein gesperrtes Bedienelement ohne Begruendung
       ist eine Sackgasse fuer jeden, der den Bildschirm nicht sieht.
       Die Zeile bleibt deshalb im Baum und haengt ueber aria-describedby am
       Knopf — sie ist nur optisch fortgeraeumt (kontakt.css, .kf__nav__grund
       traegt dieselbe Wegklapptechnik wie .kf__fortschritt__ansage).
       Wer sieht, erkennt die Sperre am Knopf selbst; wer nicht sieht,
       bekommt sie vorgelesen. */
    var grund = bau('p', 'kf__nav__grund');
    grund.id = (form.id || 'kf') + '-grund';
    weiter.setAttribute('aria-describedby', grund.id);

    aktion.appendChild(zurueck);
    aktion.appendChild(weiter);
    nav.appendChild(aktion);
    nav.appendChild(grund);
    buehne.parentNode.insertBefore(nav, buehne.nextSibling);

    /* Der Absendeknopf steht im HTML IM letzten Schritt, damit er ohne
       Javascript am Ende des langen Formulars sitzt. Mit Javascript wandert
       er hierher, an die Stelle von „Weiter" — sonst haette die Strecke auf
       dem letzten Schritt zwei Hauptaktionen an zwei verschiedenen Stellen.
       Er bleibt dabei im <form> und damit ein echter Absendeknopf. */
    var senden = form.querySelector('[data-funnel-senden]');
    if (senden) {
      senden.classList.add('kf__weiter');
      /* Auch der Absendeknopf wird gesperrt, solange Pflichtangaben fehlen —
         also braucht auch er die verborgene Begruendung. */
      senden.setAttribute('aria-describedby', grund.id);
      aktion.appendChild(senden);
    }

    /* Erst jetzt umschalten: ab hier legt kontakt.css die Schritte
       uebereinander. Vorher standen sie untereinander — auch fuer den
       Bruchteil einer Sekunde, in dem dieses Skript noch nicht fertig war. */
    form.setAttribute('data-funnel-aktiv', '');

    /* Ohne dies wuerde der Browser beim Absenden ueber ein Pflichtfeld
       stolpern, das in einem ruhenden Schritt liegt: er kann seine
       Sprechblase an ein unsichtbares Feld nicht heften und bricht den
       Versand kommentarlos ab. Geprueft wird stattdessen hier, Schritt fuer
       Schritt. Im HTML steht KEIN novalidate — ohne dieses Skript soll der
       Browser sehr wohl pruefen. */
    form.noValidate = true;

    /* --- Zustand ---------------------------------------------------------- */
    var pos = 0;          /* laufender Schritt                                */
    var pfad = [];        /* tatsaechlich gegangener Weg, fuer „Zurück"       */
    var schluss = null;   /* 'danke' | 'absage' | null                        */

    /* --- Pflichtangaben eines Schritts ------------------------------------- */
    function pflichtfelder(stufe) {
      return Array.prototype.slice.call(
        stufe.querySelectorAll('input[required], textarea[required], select[required]')
      );
    }

    function fehlt(feld) {
      if (feld.type === 'radio') return gruppenWert(form, feld.name) === '';
      /* Ein Kreuzfeld traegt seinen value AUCH UNANGEKREUZT — die Pruefung
         auf leeren value unten wuerde es also immer durchwinken. Gefragt
         ist checked, nicht value. Ohne diese Zeile liesse sich die
         Einwilligung im Browser umgehen; die Gegenstelle lehnte die Anfrage
         dann ab, und der Besucher saehe nur eine Fehlermeldung, ohne zu
         erfahren, welches Feld gemeint ist. — 11.09.2026 */
      if (feld.type === 'checkbox') return !feld.checked;
      if ((feld.value || '').trim() === '') return true;
      /* Die Form der E-Mail-Adresse fragen wir den Browser, statt eine
         eigene Regel zu erfinden. Jede handgeschriebene sperrt frueher oder
         spaeter eine gueltige Adresse aus. */
      if (feld.type === 'email' && feld.validity && feld.validity.typeMismatch) return true;
      return false;
    }

    function erfuellt(stufe) {
      return pflichtfelder(stufe).every(function (f) { return !fehlt(f); });
    }

    /* Wonach der Schritt fragt, entscheidet den Grundtext: eine Kachel waehlt
       man, ein Feld fuellt man aus. */
    function grundtext(stufe) {
      var p = pflichtfelder(stufe);
      var nurWahl = p.length > 0 && p.every(function (f) { return f.type === 'radio'; });
      return nurWahl ? TEXT.grundWahl : TEXT.grundFeld;
    }

    /* --- Fehlermeldungen an den Feldern ------------------------------------
       Der Behaelter steht im HTML neben dem Feld und ist ueber
       aria-describedby mit ihm verbunden — erst dadurch liest die
       Vorlesesoftware die Meldung ueberhaupt vor. */
    /* „Bitte ausfuellen" sagt nicht, WAS erwartet wird. Deshalb je Feld eine
       Meldung, die die Frage noch einmal stellt. */
    function meldungFuer(feld) {
      var leer = (feld.value || '').trim() === '';
      /* Vor der Pruefung auf type: ein Kreuzfeld traegt seinen value auch
         unangekreuzt, `leer` waere hier also stets falsch. */
      if (feld.type === 'checkbox') return TEXT.fehltDsgvo;
      if (feld.type === 'email') return leer ? TEXT.fehltMail : TEXT.formMail;
      if (feld.type === 'tel') return TEXT.fehltTel;
      if (feld.name === 'vorname') return TEXT.fehltVor;
      if (feld.name === 'nachname') return TEXT.fehltNach;
      if (feld.name === 'name') return TEXT.fehltName;
      if (feld.name === 'schulabschluss') return TEXT.fehltJahr;
      if (feld.name === 'bereich') return TEXT.fehltBereich;
      if (feld.name === 'aufgaben') return TEXT.fehltAufgab;
      return TEXT.fehltAllg;
    }

    function behaelter(feld) {
      var id = feld.getAttribute('aria-describedby');
      return id ? document.getElementById(id) : null;
    }

    function fehlerZeigen(feld) {
      var b = behaelter(feld);
      if (b) b.textContent = meldungFuer(feld);
      feld.setAttribute('aria-invalid', 'true');
    }

    function fehlerWeg(feld) {
      var b = behaelter(feld);
      if (b) b.textContent = '';
      feld.removeAttribute('aria-invalid');
    }

    /* --- Fehlermeldung an einer Radiogruppe --------------------------------
       01.09.2026, Optimierungsbriefing, Abschnitt 18. Eine Gruppe hat kein
       einzelnes Feld, unter das die Meldung koennte — der Behaelter steht
       deshalb im HTML unter den Kacheln des Schritts (.kf__fehler--gruppe).
       aria-describedby wird an ALLE Radios der Gruppe gehaengt, nicht nur an
       das erste: welches davon die Vorlesesoftware als naechstes anfaehrt,
       entscheidet der Nutzer, und die Begruendung soll an jedem haengen.
       Der Behaelter traegt role="alert" und wird deshalb beim Fuellen von
       selbst angesagt. */
    function gruppenBehaelter(stufe) {
      return stufe.querySelector('.kf__fehler--gruppe');
    }

    function gruppenFehlerZeigen(stufe, radio) {
      var b = gruppenBehaelter(stufe);
      if (!b) return;
      b.textContent = TEXT.fehltWahl;
      Array.prototype.forEach.call(
        form.querySelectorAll('input[type="radio"][name="' + radio.name + '"]'),
        function (r) {
          r.setAttribute('aria-describedby', b.id);
          r.setAttribute('aria-invalid', 'true');
        }
      );
    }

    function gruppenFehlerWeg(stufe, radio) {
      var b = gruppenBehaelter(stufe);
      if (b) b.textContent = '';
      Array.prototype.forEach.call(
        form.querySelectorAll('input[type="radio"][name="' + radio.name + '"]'),
        function (r) {
          r.removeAttribute('aria-describedby');
          r.removeAttribute('aria-invalid');
        }
      );
    }

    /* --- Anzeigen ---------------------------------------------------------- */
    function ruhen(bild, ruht) {
      if (ruht) {
        bild.removeAttribute('data-aktiv');
      } else {
        bild.setAttribute('data-aktiv', '');
      }
      /* visibility:hidden aus kontakt.css nimmt das Bild bereits aus
         Tabreihenfolge und Vorlesesoftware. `inert` kommt dazu, wo der
         Browser es kennt — doppelt genaeht, kostet eine Zeile. */
      if ('inert' in HTMLElement.prototype) bild.inert = ruht;
    }

    function fortschrittSetzen() {
      if (schluss === 'absage') {
        /* Keine Nummer: drei von sechs Schritten sind gegangen, „6 / 6"
           waere gelogen. Der Block bleibt trotzdem stehen (visibility, nicht
           display), damit die Seite nicht zusammenrutscht. */
        fortschritt.setAttribute('data-still', '');
        ansage.textContent = 'Ende der Strecke.';
        return;
      }
      fortschritt.removeAttribute('data-still');
      var n = schluss === 'danke' ? gesamt : pos + 1;
      /* „1 von 6" UND NICHT MEHR „1 / 6" — 31.08.2026, Kundenwunsch.
         Er hat den Zaehler selbst ausgesprochen: „einfach nur der Balken ‚1 von
         6, 2 von 6 …', der durchläuft". Die Schraegstrichform stammte von den
         beiden Vorlagen (Invenio und Estate Anfrage schreiben „3 / 6"); wo der
         Kunde eigene Worte nennt, gehen seine vor.
         Die Zeile bleibt dabei aria-hidden. Die Vorlesesoftware bekommt
         weiterhin den vollen Satz aus .kf__fortschritt__ansage („Schritt 1 von
         6") — sie ist eine aria-live-Region und sagt jeden Wechsel an. Doppelt
         gelesen wird nichts. */
      zahl.textContent = n + ' von ' + gesamt;
      balken.style.width = Math.round((n / gesamt) * 100) + '%';
      ansage.textContent = 'Schritt ' + n + ' von ' + gesamt;
    }

    function navSetzen() {
      if (schluss) {
        grund.textContent = '';
        /* Auf dem Dankebild ist nichts mehr zu tun — die Fussleiste
           verschwindet (visibility, damit die Hoehe steht).
           Auf der Absageseite bleibt sie: dort ist die Antwort, die dorthin
           gefuehrt hat, nur zwei Schritte alt und soll aenderbar sein. Sonst
           waere die Seite eine Sackgasse mit Schliessknopf. Zu sehen ist
           dann ausschliesslich „Zurück" — Weiter und Absenden bleiben weg. */
        var sackgasse = schluss !== 'absage' || pfad.length === 0;
        if (sackgasse) {
          nav.setAttribute('data-still', '');
          return;
        }
        nav.removeAttribute('data-still');
        zurueck.removeAttribute('data-still');
        weiter.hidden = true;
        if (senden) senden.hidden = true;
        return;
      }
      nav.removeAttribute('data-still');

      /* Auf Schritt 1 gibt es nichts, wohin zurueck fuehren koennte. Der
         Knopf wird dort aber NICHT mit `hidden` entfernt, sondern nur
         unsichtbar gestellt (kontakt.css, [data-still] -> visibility).
         Gemessen: mit `hidden` wuchs die Fussleiste beim Schritt von 1 auf 2
         um 2 px, weil der Zurueck-Knopf etwas hoeher baut als der
         Hauptknopf. Zwei Bildpunkte sind wenig — aber die Vorgabe heisst
         null, und visibility haelt den Platz frei. Fokussierbar ist er dabei
         genauso wenig wie bei `hidden`. */
      if (pfad.length === 0) {
        zurueck.setAttribute('data-still', '');
      } else {
        zurueck.removeAttribute('data-still');
      }

      var stufe = stufen[pos];
      var letzte = pos === stufen.length - 1;

      /* DER WEITERKNOPF FAELLT AUF REINEN WAHLSCHRITTEN WEG — 09.09.2026,
         Kundenwunsch woertlich: „Das mit dem automatisch Weiter funktioniert
         schon, aber der Weiter-Button ist immer noch ueberall da. Der soll
         heraus, sowohl auf mobiler Ansicht als auch auf Desktop-Ansicht."
         Er stand bis hierher auch dort, weil er der Weg fuer die Tastatur
         war: mit den Pfeiltasten wandert die Auswahl, und ein Schritt, der
         dabei davonspringt, waere unbedienbar. Dieser Weg ist nicht
         weggefallen, er ist umgezogen — die Leertaste und die Eingabetaste
         gehen jetzt weiter (siehe den Horcher weiter unten). Auf Schritten
         mit Textfeldern und auf dem letzten Schritt bleibt der Knopf. */
      weiter.hidden = letzte || !!nurWahl(stufe);
      if (senden) senden.hidden = !letzte;

      weiter.textContent = stufe.getAttribute('data-weiter') || TEXT.weiter;

      var offen = !erfuellt(stufe);
      var knopf = letzte && senden ? senden : weiter;
      knopf.setAttribute('aria-disabled', offen ? 'true' : 'false');
      grund.textContent = offen ? grundtext(stufe) : '';
    }

    /* Rollt den neuen Schritt in Sicht.

       IM VOLLBILD rollt nicht die Seite, sondern der Kanal darin. Jeder
       Schritt faengt oben an: wer auf einem langen Schritt bis zum
       „Weiter" hinuntergerollt ist, soll den naechsten nicht in seiner
       Mitte vorfinden.

       OHNE VOLLBILD (Browser ohne <dialog>) steht die Strecke auf der Seite
       — dann rollt das Fenster, und die Kopfleiste wird abgezogen, weil sie
       ueber dem Inhalt liegt (base.css) und die Frage sonst darunter
       verschwaende. */
    function inSicht() {
      if (kanal && kasten && kasten.contains(form)) {
        kanal.scrollTo({ top: 0, behavior: reduziert() ? 'auto' : 'smooth' });
        return;
      }
      var masse = form.getBoundingClientRect();
      var leiste = document.querySelector('.site-header');
      var hoch = (leiste ? leiste.offsetHeight : 88) + 16;
      if (masse.top >= hoch && masse.top <= window.innerHeight * 0.55) return;
      window.scrollTo({
        top: window.pageYOffset + masse.top - hoch,
        behavior: reduziert() ? 'auto' : 'smooth'
      });
    }

    function zeigen(fokussieren) {
      var aktiv = schluss ? enden[schluss] : stufen[pos];
      bilder.forEach(function (b) { ruhen(b, b !== aktiv); });
      fortschrittSetzen();
      navSetzen();
      if (!fokussieren) return;
      inSicht();
      var frage = aktiv.querySelector('[data-frage]');
      if (frage) frage.focus({ preventScroll: true });
    }

    /* --- Bewegen ----------------------------------------------------------- */
    function vor() {
      var stufe = stufen[pos];

      if (!erfuellt(stufe)) {
        /* Kein stilles Nichts: der Fokus springt auf die fehlende Angabe,
           der Grund steht schon unter dem Knopf. */
        var luecke = pflichtfelder(stufe).filter(fehlt)[0];
        if (luecke) {
          /* Textfeld: Meldung darunter. Radiogruppe: Meldung unter den
             Kacheln (seit 01.09.2026, vorher blieb sie stumm). */
          if (luecke.type === 'radio') gruppenFehlerZeigen(stufe, luecke);
          else fehlerZeigen(luecke);
          luecke.focus();
        }
        return;
      }

      /* Die Verzweigung steht am Bedienelement und nicht im Skript: welche
         Schlussseite ein Kreuz ausloest, sagt data-sprung im HTML. Genau ein
         Radio traegt es — „2.000-2.500€" in Schritt 2 der ersten Strecke.

         SIE WAR EINEN TAG LANG WEG. Der Kunde hatte die Absageseite der
         Vorlage abgelehnt („Was soll denn das? Das soll absolut nicht
         rein.") und danach richtiggestellt: die Seite bleibt, aber sie sagt
         etwas anderes — sie weist nicht ab, sie vertagt. Der neue Wortlaut
         steht im HTML.
         Alle uebrigen Antworten laufen unveraendert bis zu den Kontaktdaten
         durch. */
      var sprung = stufe.querySelector('input[data-sprung]:checked');
      if (sprung) {
        pfad.push(pos);
        schluss = sprung.getAttribute('data-sprung');
        zeigen(true);
        return;
      }

      if (pos < stufen.length - 1) {
        pfad.push(pos);
        pos += 1;
        zeigen(true);
      }
    }

    function rueck() {
      if (!pfad.length) return;
      schluss = null;
      pos = pfad.pop();
      zeigen(true);
    }

    /* Sperre gegen den Doppelklick: ohne sie gehen zwei gleiche Anfragen
       raus, weil der Knopf waehrend des Versands noch reagiert. */
    var sendetGerade = false;

    function absenden(ev) {
      var stufe = stufen[stufen.length - 1];
      var luecken = pflichtfelder(stufe).filter(fehlt);

      pflichtfelder(stufe).forEach(function (f) {
        if (f.type === 'radio') return;
        if (fehlt(f)) fehlerZeigen(f); else fehlerWeg(f);
      });

      if (luecken.length) {
        ev.preventDefault();
        luecken[0].focus();
        navSetzen();
        return;
      }

      /* BIS ZUM 11.09.2026 STAND HIER `if (ziel !== '') return;` — das
         Skript liess bei gefuelltem action los, das Formular schickte im
         Browserverfahren ab, und der Besucher landete auf der Antwort der
         Gegenstelle: einer weissen Seite mit {"ok":true,...}. Technisch
         richtig gesendet, fuer den Besucher ein Fehlerbild.

         Jetzt geht die Anfrage per fetch weg und die Seite bleibt stehen.
         Erst wenn die Gegenstelle bestaetigt hat, erscheint das Dankebild —
         es sagt damit weiterhin nur, was wirklich passiert ist. Scheitert
         der Versand, bleibt der letzte Schritt stehen und sagt es. */
      var ziel = (form.getAttribute('action') || '').trim();

      ev.preventDefault();

      /* Ohne Ziel wie frueher: Dankebild ohne Versand, damit die Strecke
         auch als Ansichtsfassung vollstaendig vorfuehrbar bleibt. */
      if (ziel === '') {
        schluss = 'danke';
        zeigen(true);
        return;
      }

      if (sendetGerade) return;
      sendetGerade = true;

      var knopf = form.querySelector('[data-funnel-senden]');
      var knopfText = knopf ? knopf.textContent : '';
      if (knopf) {
        knopf.disabled = true;
        knopf.textContent = TEXT.sendeLaeuft;
      }
      sendeFehlerWeg();

      /* FormData nimmt die Datei mit; ohne enctype-Kopfzeile von Hand —
         die setzt der Browser selbst, samt boundary. Wer sie hier setzt,
         zerbricht den Upload. */
      fetch(ziel, { method: 'post', body: new FormData(form) })
        .then(function (antwort) {
          if (!antwort.ok) throw new Error('Status ' + antwort.status);
          sendetGerade = false;
          schluss = 'danke';
          zeigen(true);
        })
        .catch(function (fehler) {
          sendetGerade = false;
          if (knopf) {
            knopf.disabled = false;
            knopf.textContent = knopfText;
          }
          sendeFehlerZeigen();
          if (window.console) console.error('Versand gescheitert:', fehler);
        });
    }

    /* Die Meldung zum gescheiterten Versand haengt am letzten Schritt, nicht
       an einem einzelnen Feld: es liegt an keinem von ihnen. */
    function sendeFehlerBehaelter() {
      var stufe = stufen[stufen.length - 1];
      var b = stufe.querySelector('[data-sende-fehler]');
      if (!b) {
        b = document.createElement('p');
        b.setAttribute('data-sende-fehler', '');
        b.className = 'kf__fehler kf__fehler--senden';
        b.setAttribute('role', 'alert');
        stufe.appendChild(b);
      }
      return b;
    }

    function sendeFehlerZeigen() {
      var b = sendeFehlerBehaelter();
      b.textContent = TEXT.sendeFehler;
      b.focus && b.focus();
    }

    function sendeFehlerWeg() {
      var stufe = stufen[stufen.length - 1];
      var b = stufe.querySelector('[data-sende-fehler]');
      if (b) b.textContent = '';
    }

    /* --- Horchen ----------------------------------------------------------- */
    weiter.addEventListener('click', vor);
    zurueck.addEventListener('click', rueck);
    form.addEventListener('submit', absenden);

    /* Den Knopf „Noch einmal von vorn" (data-funnel-neu) gab es nur auf dem
       Absagebild. Mit ihm ist auch vonVorn() entfallen — es gibt keine
       Sackgasse mehr, aus der man zurueckmuesste. */

    /* Ein Kreuz oder ein Zeichen kann den Weiterknopf freigeben — deshalb
       nach jeder Eingabe neu entscheiden. Ein einziger Horcher am Formular
       statt einer pro Feld: die Ereignisse steigen ohnehin auf. */
    form.addEventListener('change', function (ev) {
      if (ev.target && ev.target.getAttribute('aria-invalid') === 'true' && !fehlt(ev.target)) {
        /* Ein Kreuz in einer angemahnten Gruppe nimmt die Meldung unter den
           Kacheln wieder weg — an allen Radios der Gruppe, nicht nur am
           angekreuzten. */
        if (ev.target.type === 'radio') gruppenFehlerWeg(stufen[pos], ev.target);
        else fehlerWeg(ev.target);
      }
      navSetzen();
      selbstWeiter(ev.target);
    });

    /* ------------------------------------------------------------------------
       EINE ANTWORT, EIN SCHRITT — 06.09.2026

       Kundenwunsch woertlich: „Wenn man sich bei Kontakt bewirbt und einen der
       drei auswaehlt, muss man immer auf ‚Weiter‘ druecken. […] Dieses
       ‚Weiter‘ soll wegfallen. Sobald man darauf drueckt, kommt man sofort
       weiter."

       ES GILT NUR FUER REINE WAHLSCHRITTE, und die Bedingungen dafuer sind
       eng gesetzt:
         1  Das Ereignis kommt von einem Radioknopf.
         2  ALLE Pflichtangaben des Schritts sind Radios — auf einem Schritt
            mit einem Textfeld daneben duerfte nichts von selbst
            weiterlaufen, sonst springt er dem Besucher unter den Fingern
            weg, bevor er getippt hat.
         3  Sie gehoeren zu EINER Gruppe. Zwei Fragen auf einem Schritt
            waeren nach der ersten Antwort noch nicht beantwortet.
         4  Der Schritt ist erfuellt und ist nicht der letzte — abgesendet
            wird nie von allein.

       DIE VERZOEGERUNG VON 260 ms IST ABSICHT. Ohne sie verschwindet die
       Kachel, bevor man sie ausgewaehlt gesehen hat; die Bestaetigung „ich
       habe das getroffen, was ich wollte" faellt dann weg. 260 ms ist die
       Dauer, die das Aufleuchten der Kachel in kontakt.css braucht.
       Bei prefers-reduced-motion geht es ohne Warten weiter — dort leuchtet
       nichts auf, worauf man warten muesste.

       DER WEITERKNOPF BLEIBT STEHEN. Er ist der Weg fuer alle, die mit der
       Tastatur mit den Pfeiltasten durch die Kacheln gehen: dort loest jede
       Bewegung ein `change` aus, und ein Schritt, der beim Durchblaettern
       davonspringt, waere unbedienbar. Deshalb springt nur weiter, wer mit
       Zeiger oder Fingerkuppe getippt hat — `ev.detail` und die Bauart des
       Ereignisses geben das nicht her, also merkt sich der Zeigerhorcher
       darunter, ob die Auswahl aus einem echten Tippen kam.
    ------------------------------------------------------------------------ */
    var ausTippen = false;
    form.addEventListener('pointerdown', function (ev) {
      ausTippen = !!(ev.target && ev.target.closest && ev.target.closest('label, .kf__kachel'));
    });
    form.addEventListener('keydown', function (ev) {
      ausTippen = false;
      /* DER TASTATURWEG OHNE KNOPF. Die Pfeiltasten waehlen weiter aus, wie
         es sich fuer eine Radiogruppe gehoert — erst Leertaste oder
         Eingabetaste sind die Entscheidung, und die geht weiter. Ohne das
         waere ein reiner Wahlschritt ohne Weiterknopf mit der Tastatur eine
         Sackgasse.
         preventDefault an der Eingabetaste: sonst schickt der Browser das
         Formular ab, statt einen Schritt weiterzugehen. */
      if (ev.key !== 'Enter' && ev.key !== ' ' && ev.key !== 'Spacebar') return;
      var ziel = ev.target;
      if (!ziel || ziel.type !== 'radio') return;
      var stufe = stufen[pos];
      var gruppe = nurWahl(stufe);
      if (!gruppe || gruppe !== ziel.name) return;
      ev.preventDefault();
      /* Die Leertaste waehlt die Kachel erst aus; das erledigen wir hier
         selbst, weil preventDefault den Browser daran hindert. */
      if (!ziel.checked) {
        ziel.checked = true;
        ziel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (erfuellt(stufe)) vor();
    });

    /* Ein Schritt, der NUR nach einer Antwort fragt — eine Gruppe Kacheln,
       kein Textfeld daneben, und nicht der letzte Schritt. Nur hier faellt
       der Weiterknopf weg und nur hier geht es von selbst weiter. */
    function nurWahl(stufe) {
      if (stufen.indexOf(stufe) === stufen.length - 1) return null;
      var p = pflichtfelder(stufe);
      if (!p.length) return null;
      var name = p[0].name;
      var eine = p.every(function (f) { return f.type === 'radio' && f.name === name; });
      return eine ? name : null;
    }

    function selbstWeiter(ziel) {
      if (!ausTippen) return;
      if (!ziel || ziel.type !== 'radio') return;
      var stufe = stufen[pos];
      var gruppe = nurWahl(stufe);
      if (!gruppe || gruppe !== ziel.name) return;
      if (!erfuellt(stufe)) return;
      ausTippen = false;
      if (reduziert()) { vor(); return; }
      window.setTimeout(function () {
        /* Zwischenzeitlich koennte jemand zurueckgegangen sein oder das
           Vollbild geschlossen haben — dann ist der Schritt nicht mehr der,
           auf den sich der Klick bezog. */
        if (stufen[pos] === stufe && erfuellt(stufe)) vor();
      }, 260);
    }
    form.addEventListener('input', function (ev) {
      /* Eine Meldung, die stehen bleibt, obwohl der Fehler behoben ist,
         liest sich wie ein Vorwurf. */
      if (ev.target && ev.target.getAttribute('aria-invalid') === 'true' && !fehlt(ev.target)) {
        fehlerWeg(ev.target);
      }
      navSetzen();
    });

    /* Die Eingabetaste in einem Textfeld soll weiterblaettern und nicht das
       halb ausgefuellte Formular abschicken — auf jedem Schritt ausser dem
       letzten, wo sie richtig liegt. */
    form.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      var z = ev.target;
      if (!z || z.tagName === 'TEXTAREA' || z.tagName === 'BUTTON') return;
      if (schluss || pos === stufen.length - 1) return;
      ev.preventDefault();
      vor();
    });

    /* Erster Aufbau — ohne Fokus und ohne Rollen: niemand hat etwas
       angeklickt, und eine Seite, die beim Laden von selbst springt, ist
       eine Zumutung. */
    zeigen(false);
  }

  /* ---------------------------------------------------------------------------
     AUFBAU — DIE REIHENFOLGE IST NICHT BELIEBIG
       1  Das Vollbild bauen und die Strecken hineinschieben. Erst danach ist
          im Ruhezustand der Seite kein Eingabefeld mehr sichtbar.
       2  Die Strecken falten. Sie messen nichts beim Aufbau, aber sie sollen
          in ihrer endgueltigen Umgebung stehen, bevor der erste Schritt
          gezeigt wird.
       3  Die drei Fragen verdrahten — aber NUR, wenn es ein Vollbild gibt.
          Sonst bleiben sie das, was sie im HTML sind: Sprungverweise auf die
          Strecke, die dann offen auf der Seite steht. Kein toter Knopf.
  --------------------------------------------------------------------------- */
  var vollbildDa = vollbildBauen();

  formulare.forEach(strecke);

  if (vollbildDa) {
    Array.prototype.forEach.call(
      wurzel.querySelectorAll('[data-oeffnet]'),
      function (frage) {
        frage.setAttribute('aria-haspopup', 'dialog');
        frage.setAttribute('aria-expanded', 'false');
        frage.addEventListener('click', function (ev) {
          ev.preventDefault();
          oeffnen(frage.getAttribute('data-oeffnet'), frage);
        });
      }
    );
  }
})();
