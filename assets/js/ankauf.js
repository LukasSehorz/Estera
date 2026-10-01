/* ---------------------------------------------------------------------------
   ESTERA — ANKAUFSPROFIL: die zwei Pop-ups (29.09.2026)

   Gehoert allein zu ankaufsprofil.html. Die Seite hat zwei <dialog>
   (#eigentuemer, #makler) mit dem Inhalt, der bis heute als eigene
   Abschnitte auf der Seite stand. Dieses Skript:

   1  oeffnet sie per showModal() bei Klick auf alles mit [data-pop="id"]
      („Mehr erfahren" in den Karten; ein Klick auf die Kartenflaeche
      landet ueber karriere.js ebenfalls dort),
   2  oeffnet sie, wenn die Seite mit #eigentuemer oder #makler in der
      Adresse aufgerufen wird (auch bei spaeterem Wechsel der Marke),
   3  schliesst per X, Escape (eingebaut) und Klick neben den Kasten,
   4  sperrt waehrenddessen das Rollen der Seite (.ank-pop-offen an <html>)
      und gibt beim Schliessen den Fokus an den Ausloeser zurueck.

   OHNE JAVASCRIPT oder in einem Browser ohne showModal() stehen beide als
   gewoehnliche Abschnitte auf der Seite: die Klasse ank-js wird dann
   wieder entfernt, ankauf.css zeigt sie an, und die Karten springen per
   Sprungmarke dorthin.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  var wurzel = document.documentElement;
  var dialoge = document.querySelectorAll('dialog.ank-pop');
  if (!dialoge.length) return;

  if (typeof dialoge[0].showModal !== 'function') {
    wurzel.classList.remove('ank-js');
    return;
  }

  var ausloeser = null;

  function finde(id) {
    var d = id ? document.getElementById(id) : null;
    return d && d.classList.contains('ank-pop') ? d : null;
  }

  function oeffnen(d, von) {
    if (!d || d.open) return;
    for (var i = 0; i < dialoge.length; i++) {
      if (dialoge[i].open) dialoge[i].close();
    }
    ausloeser = von || null;
    wurzel.classList.add('ank-pop-offen');
    d.showModal();
    var kasten = d.querySelector('.ank-pop__kasten');
    if (kasten) kasten.scrollTop = 0;
  }

  for (var i = 0; i < dialoge.length; i++) {
    (function (d) {
      d.addEventListener('close', function () {
        wurzel.classList.remove('ank-pop-offen');
        /* Die Marke aus der Adresse nehmen, damit Neuladen das Pop-up
           nicht wieder oeffnet und „Zurueck" nicht dorthin fuehrt. */
        if (location.hash === '#' + d.id && window.history && history.replaceState) {
          history.replaceState(null, '', location.pathname + location.search);
        }
        if (ausloeser && typeof ausloeser.focus === 'function') {
          try { ausloeser.focus({ preventScroll: true }); }
          catch (e) { ausloeser.focus(); }
        }
        ausloeser = null;
      });
      /* Ein Klick auf den Schleier trifft das <dialog> selbst; der Kasten
         fuellt das Element vollstaendig aus, jeder Klick auf den Inhalt
         hat also ein anderes Ziel. */
      d.addEventListener('click', function (ev) {
        if (ev.target === d) d.close();
      });
      var zu = d.querySelector('[data-pop-zu]');
      if (zu) zu.addEventListener('click', function () { d.close(); });
    })(dialoge[i]);
  }

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest ? ev.target.closest('[data-pop]') : null;
    if (!a) return;
    var d = finde(a.getAttribute('data-pop'));
    if (!d) return;
    ev.preventDefault();
    oeffnen(d, a);
  });

  function nachMarke() {
    var d = finde(decodeURIComponent(location.hash.slice(1)));
    if (d) oeffnen(d, null);
  }
  window.addEventListener('hashchange', nachMarke);
  nachMarke();
})();

/* ---------------------------------------------------------------------------
   DIE SZENEN IN KENNZAHLEN UND KRITERIEN (30.09.2026)

   Die Bewegung selbst steht vollstaendig in ankauf.css. Hier werden nur
   zwei Klassen geschaltet:

   ist-fertig  kommt 2,4 s nach .ist-da (das setzt karriere.js beim
               Hereinrollen). Ab dann gelten die Einblend-Regeln nicht mehr,
               und die Gesten beim Ueberfahren laufen auf denselben Teilen,
               ohne dass die Einblendung beim Verlassen noch einmal startet.
   ist-wieder  beim Ueberfahren mit der Maus, beim Antippen (Touch) und bei
               Tastaturfokus im Kasten; nach 1,6 s wieder weg. Die Gesten
               laufen damit einmal ganz durch und enden, wo sie angefangen
               haben.

   Laeuft NUR, wenn karriere.js die Bewegung eingeschaltet hat
   (data-js="an" an <main>) — bei prefers-reduced-motion also nie.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  var wurzel = document.querySelector('.kar');
  if (!wurzel || wurzel.getAttribute('data-js') !== 'an') return;
  if (!('MutationObserver' in window)) return;

  var kaesten = document.querySelectorAll('.ank-kachel, .ank-zahl');
  var FERTIG = 2400, WIEDER = 1600;

  function fertig(k) {
    setTimeout(function () { k.classList.add('ist-fertig'); }, FERTIG);
  }

  function wieder(k) {
    if (!k.classList.contains('ist-fertig') || k.classList.contains('ist-wieder')) return;
    k.classList.add('ist-wieder');
    setTimeout(function () { k.classList.remove('ist-wieder'); }, WIEDER);
  }

  for (var i = 0; i < kaesten.length; i++) {
    (function (k) {
      if (k.classList.contains('ist-da')) fertig(k);
      else {
        var mo = new MutationObserver(function () {
          if (k.classList.contains('ist-da')) { mo.disconnect(); fertig(k); }
        });
        mo.observe(k, { attributes: true, attributeFilter: ['class'] });
      }
      /* Maus: beim Hineinfahren. Touch und Stift: beim Antippen (click
         kommt dort ohnehin), damit nicht schon das Rollen ueber die
         Kachel die Geste ausloest. */
      k.addEventListener('pointerenter', function (ev) {
        if (ev.pointerType === 'mouse') wieder(k);
      });
      k.addEventListener('click', function () { wieder(k); });
      k.addEventListener('focusin', function () { wieder(k); });
    })(kaesten[i]);
  }
})();
