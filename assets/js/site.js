/* ESTERA — Interaktion: Menü-Overlay, Scroll-Zustand, Einlauf */
(function () {
  'use strict';

  /* --- Einlauf-Staffelung ------------------------------------------------ */
  requestAnimationFrame(function () {
    document.documentElement.classList.add('is-ready');
  });

  /* --- Menü -------------------------------------------------------------- */
  var menu   = document.querySelector('[data-menu]');
  var open   = document.querySelector('[data-menu-open]');
  var close  = document.querySelector('[data-menu-close]');
  var lastFocus = null;

  if (menu) {
    // Staffel-Index für den Einlauf der Menüzeilen setzen
    var stagger = menu.querySelectorAll('.menu__nav li, .menu__aside > *, .menu__foot > *');
    Array.prototype.forEach.call(stagger, function (el, i) {
      el.style.setProperty('--i', i);
    });

    var setMenu = function (state) {
      menu.setAttribute('data-open', String(state));
      menu.setAttribute('aria-hidden', String(!state));
      document.body.classList.toggle('is-locked', state);
      if (open) open.setAttribute('aria-expanded', String(state));

      if (state) {
        lastFocus = document.activeElement;
        var first = menu.querySelector('a, button');
        if (first) setTimeout(function () { first.focus(); }, 420);
      } else if (lastFocus) {
        lastFocus.focus();
      }
    };

    if (open)  open.addEventListener('click', function () { setMenu(true); });
    if (close) close.addEventListener('click', function () { setMenu(false); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.getAttribute('data-open') === 'true') setMenu(false);
    });

    // Fokus im geöffneten Overlay halten
    menu.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || menu.getAttribute('data-open') !== 'true') return;
      var items = menu.querySelectorAll('a[href], button:not([disabled])');
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* --- Header: erst ab Scroll als Leiste sichtbar ------------------------- */
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('site-header--sticky', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- Wechselnde zweite Headline-Zeile ----------------------------------- */
  /* Zeigt nacheinander den Markenkern: diskret / strukturiert / langfristig.
     Für Screenreader ist immer nur die aktive Zeile relevant, deshalb wird
     der ganze Block als aria-live=off ausgezeichnet und der Text der ersten
     Variante bleibt der zugängliche Standard. */
  document.querySelectorAll('[data-rotator]').forEach(function (rot) {
    var items = rot.querySelectorAll('.rotator__item');
    if (items.length < 2) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;   // ohne Bewegung bleibt die erste Zeile stehen

    var i = 0;
    setInterval(function () {
      items[i].removeAttribute('data-active');
      i = (i + 1) % items.length;
      items[i].setAttribute('data-active', 'true');
    }, 3400);
  });

  /* --- Aufdecken beim Scrollen -------------------------------------------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    if (!('IntersectionObserver' in window)) {
      // Ohne Observer sofort zeigen — nichts darf unsichtbar hängen bleiben
      Array.prototype.forEach.call(reveals, function (el) { el.setAttribute('data-seen', 'true'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.setAttribute('data-seen', 'true');
          io.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
      Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
    }
  }

  /* --- Linien und Pfeile zeichnen sich selbst ----------------------------- */
  /* Es gibt mehrere Grafiken: Zufluss von den Quellen, die Mittelachse und
     der Pfeil zum Ergebnis. Jede wird einzeln beobachtet und zieht auf,
     sobald sie ins Bild kommt. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-lines]'), function (svg) {
    var host  = svg.closest('.lst__axis-inner') || svg.parentElement;
    var paths = svg.querySelectorAll('g > path, svg > path');

    Array.prototype.forEach.call(paths, function (path, i) {
      if (path.closest('marker')) return;          // Pfeilspitzen nie animieren
      var len = Math.ceil(path.getTotalLength());
      path.style.setProperty('--len', len);
      path.style.setProperty('--d', i * 120);
    });

    var zeigen = function () { host.setAttribute('data-drawn', 'true'); };

    if (!('IntersectionObserver' in window)) { zeigen(); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        zeigen();
        obs.disconnect();
      });
    }, { threshold: 0.25 });
    obs.observe(svg);
  });

  /* --- Vignetten: echte Linienlänge setzen, damit sie sauber aufziehen ----- */
  document.querySelectorAll('[data-vignette]').forEach(function (svg) {
    svg.querySelectorAll('path, circle').forEach(function (el, i) {
      var len = Math.ceil(el.getTotalLength());
      el.style.setProperty('--len', len);
      el.style.setProperty('--d', i);
    });
  });

  /* --- Lemniskate: Stationen, Pfeile und Beschriftung setzen -------------- */
  /* Alle Positionen kommen aus der echten Pfadlänge statt aus handgesetzten
     Koordinaten. Dadurch sitzen sie auch nach Formänderungen exakt. */
  var loop = document.querySelector('[data-loop]');
  if (loop) {
    var pfad   = loop.querySelector('#loop-path');
    var marks  = loop.querySelector('.loop__marks');
    var dots   = loop.querySelector('.loop__dots');
    var labels = loop.parentElement.querySelector('[data-labels]');
    var vb     = loop.viewBox.baseVal;
    var laenge = pfad.getTotalLength();

    var NS = 'http://www.w3.org/2000/svg';

    /* Die sechs Stationen liegen NICHT in gleichen Längenabständen — dabei
       landeten zwei davon im Kreuzungsbereich. Stattdessen sind je drei
       Ankerpunkte pro Bogen vorgegeben; gesucht wird der Punkt auf dem
       Pfad, der dem Anker am nächsten liegt. So sitzt jede Station sicher
       auf ihrem Bogen, und die Reihenfolge folgt dem Weg:
       linker Bogen oben → links → unten, dann rechter Bogen oben → rechts → unten. */
    var stationen = [
      { z: 'I',   t: 'Einordnung',   x: 250, y:  74, ausricht: 'oben'  },
      { z: 'II',  t: 'Objektzugang', x:  58, y: 232, ausricht: 'links' },
      { z: 'III', t: 'Aufbereitung', x: 250, y: 390, ausricht: 'unten' },
      { z: 'IV',  t: 'Finanzierung', x: 650, y:  74, ausricht: 'oben'  },
      { z: 'V',   t: 'Koordination', x: 842, y: 232, ausricht: 'rechts'},
      { z: 'VI',  t: 'Begleitung',   x: 650, y: 390, ausricht: 'unten' }
    ];

    // Pfad einmal abtasten, damit wir zu jedem Anker den nächsten Punkt finden
    var SCHRITTE = 900;
    var proben = [];
    for (var k = 0; k <= SCHRITTE; k++) {
      var l = laenge * (k / SCHRITTE);
      var pp = pfad.getPointAtLength(l);
      proben.push({ l: l, x: pp.x, y: pp.y });
    }
    var naechster = function (zx, zy) {
      var best = proben[0], bd = Infinity;
      for (var k = 0; k < proben.length; k++) {
        var d = (proben[k].x - zx) * (proben[k].x - zx) + (proben[k].y - zy) * (proben[k].y - zy);
        if (d < bd) { bd = d; best = proben[k]; }
      }
      return best;
    };

    /* Zeitsteuerung: Jede Station erscheint genau dann, wenn die Linie sie
       erreicht hat — nicht nach einem pauschalen Index. Sonst schweben
       Ziffern im Leeren, während die Kurve noch unterwegs ist. */
    var START = 0.6;    // Sekunden, ab wann die Acht zu zeichnen beginnt
    var DAUER = 2.2;    // Sekunden, die das Zeichnen der Acht braucht
    var zeitBei = function (l) { return (START + (l / laenge) * DAUER + 0.1).toFixed(2); };

    var laengen = [];
    stationen.forEach(function (st, i) {
      var tp = naechster(st.x, st.y);
      laengen.push(tp.l);

      var g = document.createElementNS(NS, 'g');
      g.style.setProperty('--t', zeitBei(tp.l));
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', tp.x); c.setAttribute('cy', tp.y); c.setAttribute('r', 18);
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', tp.x); t.setAttribute('y', tp.y + 0.5);
      t.textContent = st.z;
      g.appendChild(c); g.appendChild(t); dots.appendChild(g);

      // Beschriftung nach außen versetzen, je nach Lage der Station
      var ab = 46, lx = tp.x, ly = tp.y;
      if (st.ausricht === 'oben')   ly -= ab;
      if (st.ausricht === 'unten')  ly += ab;
      if (st.ausricht === 'links')  lx -= ab + 14;
      if (st.ausricht === 'rechts') lx += ab + 14;

      var lab = document.createElement('span');
      lab.className = 'loop__label loop__label--' + st.ausricht;
      lab.textContent = st.t;
      lab.style.left = (lx / vb.width  * 100) + '%';
      lab.style.top  = (ly / vb.height * 100) + '%';
      lab.style.setProperty('--t', zeitBei(tp.l));
      labels.appendChild(lab);
    });

    // Richtungspfeile jeweils mittig zwischen zwei Stationen
    laengen.forEach(function (l1, i) {
      var l2 = laengen[(i + 1) % laengen.length];
      var mitte = (l2 > l1) ? (l1 + l2) / 2 : ((l1 + l2 + laenge) / 2) % laenge;
      var p1 = pfad.getPointAtLength(mitte);
      var p2 = pfad.getPointAtLength((mitte + 6) % laenge);
      var w  = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      var pf = document.createElementNS(NS, 'path');
      pf.setAttribute('d', 'M-5 -4.5 L 2.5 0 L -5 4.5');
      pf.setAttribute('transform', 'translate(' + p1.x + ',' + p1.y + ') rotate(' + w + ')');
      pf.style.setProperty('--t', zeitBei(mitte));
      marks.appendChild(pf);
    });

    var out = loop.querySelector('#loop-out');
    if (out) out.style.setProperty('--t', (START + DAUER + 0.15).toFixed(2));

    var zeigeLoop = function () { loop.closest('.loop__stage').setAttribute('data-drawn', 'true'); };
    if (!('IntersectionObserver' in window)) { zeigeLoop(); }
    else {
      var lo = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { zeigeLoop(); lo.disconnect(); } });
      }, { threshold: 0.25 });
      lo.observe(loop);
    }
  }

  /* --- Senkrechte Linie bis zur Unterkante des Querbilds ------------------ */
  /* Die Länge lässt sich nicht sauber in CSS ausdrücken, weil sie von der
     Höhe eines prozentual breiten Bildes abhängt. Deshalb hier gemessen. */
  var linie = document.querySelector('.ablauf__linie');
  var quer  = document.querySelector('.lst__unten');
  if (linie && quer) {
    var setzeLinie = function () {
      linie.style.bottom = '';                 // erst zurücksetzen, dann messen
      if (getComputedStyle(quer).display === 'none') return;
      var l = linie.getBoundingClientRect();
      var q = quer.getBoundingClientRect();
      linie.style.bottom = Math.round(l.bottom - q.bottom) + 'px';
    };
    setzeLinie();
    window.addEventListener('resize', setzeLinie, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setzeLinie);
  }

  /* --- Umschalter im Vergleich -------------------------------------------
     Setzt nur data-modus am Abschnitt; Reihenfolge, Versatz und
     Verbindungslinie loest vergleich.css daraus ab.                        */
  Array.prototype.forEach.call(document.querySelectorAll('[data-vergleich]'), function (block) {
    var knoepfe = block.querySelectorAll('[data-modus-knopf]');
    Array.prototype.forEach.call(knoepfe, function (knopf) {
      knopf.addEventListener('click', function () {
        var modus = knopf.getAttribute('data-modus-knopf');
        block.setAttribute('data-modus', modus);
        Array.prototype.forEach.call(knoepfe, function (k) {
          k.setAttribute('aria-pressed', String(k === knopf));
        });
      });
    });
  });

  /* --- Aufklappbare Zeilen ------------------------------------------------
     Die Hoehe animiert ueber grid-template-rows in auswahl-/prinzip.css;
     hier wird nur der Zustand umgeschaltet und aria-expanded nachgefuehrt. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-aufklapp]'), function (block) {
    var knopf = block.querySelector('button[aria-expanded]');
    if (!knopf) return;
    knopf.addEventListener('click', function () {
      var offen = block.hasAttribute('data-offen');
      if (offen) block.removeAttribute('data-offen');
      else block.setAttribute('data-offen', '');
      knopf.setAttribute('aria-expanded', String(!offen));
    });
  });

  /* --- Verzweigung der Ablehnungsgruende aufziehen -----------------------
     Ein Beobachter fuer den GANZEN Block, nicht einer je Kasten: nur so
     laufen Linie, Boegen und Kaesten auf einer gemeinsamen Zeitachse. Bei
     einzelnen Beobachtern geriete die Reihenfolge durcheinander, sobald der
     Block hoeher ist als das Fenster. Die Verzoegerungen stehen in
     auswahl.css und leiten sich aus --stufe ab.                            */
  Array.prototype.forEach.call(document.querySelectorAll('[data-zeichnen]'), function (block) {
    var zeigen = function () { block.setAttribute('data-gezeichnet', 'true'); };
    if (!('IntersectionObserver' in window)) { zeigen(); return; }
    var beob = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        zeigen();
        beob.disconnect();
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.08 });
    beob.observe(block);
  });

  /* --- Kopfnavigation: noch nicht gebaute Ziele sperren -------------------
     Die Navigation zeigt die vollstaendige Struktur aus dem Masterbriefing.
     Abschnitte 4, 5 und 7 der Startseite und die Unterseiten gibt es aber
     noch nicht. Statt ins Leere zu springen oder eine 404 zu erzeugen,
     werden diese Verweise gesperrt — und automatisch wieder frei, sobald
     das Ziel existiert. Nichts muss dafuer nachgepflegt werden.            */
  var vorhandeneSeiten = ['index.html', 'variante-a.html'];
  Array.prototype.forEach.call(
    document.querySelectorAll('.kopfnav a, .menu__link'),
    function (verweis) {
      var ziel = verweis.getAttribute('href') || '';
      var fehlt = ziel.charAt(0) === '#'
        ? !document.querySelector(ziel)
        : vorhandeneSeiten.indexOf(ziel.replace('./', '')) === -1;
      if (!fehlt) return;
      verweis.setAttribute('aria-disabled', 'true');
      verweis.addEventListener('click', function (e) { e.preventDefault(); });
    }
  );

  /* --- Referenzen-Akkordeon ----------------------------------------------
     Eine Spalte faehrt auf, die anderen schrumpfen. Bewusst ueber Attribute
     statt reinem :hover geloest: so greift dieselbe Logik fuer Maus,
     Tastatur (Tab/Enter) und Fingertipp. Die Breiten selbst liegen in
     referenzen.css und gelten erst ab 1201 px.                             */
  var refTafel = document.querySelector('.ref__tafel');
  if (refTafel) {
    var refKarten = Array.prototype.slice.call(refTafel.querySelectorAll('.ref__karte'));
    var hatHover = window.matchMedia('(hover: hover)').matches;

    var refOeffne = function (index) {
      refKarten.forEach(function (karte, n) {
        if (n === index) karte.setAttribute('data-offen', '');
        else karte.removeAttribute('data-offen');
      });
      if (index === null) refTafel.removeAttribute('data-aktiv');
      else refTafel.setAttribute('data-aktiv', String(index + 1));
    };

    refKarten.forEach(function (karte, i) {
      if (hatHover) {
        karte.addEventListener('mouseenter', function () { refOeffne(i); });
      }
      karte.addEventListener('focus', function () { refOeffne(i); });
      /* Tippen und Enter schalten um — ohne Zeigegeraet gibt es kein
         Verlassen, also muss man auch wieder zuklappen koennen. */
      karte.addEventListener('click', function () {
        refOeffne(karte.hasAttribute('data-offen') ? null : i);
      });
      karte.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          refOeffne(karte.hasAttribute('data-offen') ? null : i);
        }
      });
    });

    if (hatHover) {
      refTafel.addEventListener('mouseleave', function () { refOeffne(null); });
    }
  }

  /* --- Sanfte Parallaxe des Bildbands (dezent, nur Desktop) --------------- */
  var band = document.querySelector('[data-parallax]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (band && !reduce && window.matchMedia('(min-width: 861px)').matches) {
    var ticking = false;
    var update = function () {
      var r = band.getBoundingClientRect();
      var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      band.style.setProperty('--shift', (p * -18).toFixed(2) + 'px');
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }
})();
