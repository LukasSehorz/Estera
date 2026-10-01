/* ---------------------------------------------------------------------------
   ESTERA — ANKAUFSPROFIL: Bewegung im Inneren der zwei Pop-ups (30.09.2026)

   Oeffnen und Schliessen erledigt weiter ankauf.js (unveraendert). Dieses
   Skript schaltet nur Klassen fuer ankauf-popup.css:

   apo-an   am <dialog>, wenn Bewegung erlaubt ist. Ohne diese Klasse steht
            alles sofort im Endzustand (auch ohne Javascript und bei
            prefers-reduced-motion).
   ist-da   an jedem [data-apo], sobald es im rollenden Kasten sichtbar
            wird. Beim Schliessen wird es entfernt, beim naechsten Oeffnen
            baut sich alles neu auf.

   Wird geladen per defer aus dem Pop-up heraus, laeuft also nach ankauf.js;
   ein schon per #eigentuemer / #makler geoeffnetes Pop-up wird erkannt.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  var dialoge = document.querySelectorAll('dialog.apo-pop');
  if (!dialoge.length) return;
  if (typeof dialoge[0].showModal !== 'function') return;
  if (!('IntersectionObserver' in window) || !('MutationObserver' in window)) return;
  var ruhig = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  if (ruhig && ruhig.matches) return;

  for (var i = 0; i < dialoge.length; i++) {
    (function (d) {
      var kasten = d.querySelector('.ank-pop__kasten');
      var teile = d.querySelectorAll('[data-apo]');
      if (!kasten || !teile.length) return;
      d.classList.add('apo-an');

      var io = new IntersectionObserver(function (eintraege) {
        for (var k = 0; k < eintraege.length; k++) {
          if (eintraege[k].isIntersecting) {
            eintraege[k].target.classList.add('ist-da');
            io.unobserve(eintraege[k].target);
          }
        }
      }, { root: kasten, rootMargin: '0px 0px -6% 0px', threshold: 0.12 });

      function zuruecksetzen() {
        io.disconnect();
        for (var k = 0; k < teile.length; k++) teile[k].classList.remove('ist-da');
      }
      function starten() {
        zuruecksetzen();
        /* Einen Anstrich warten, damit der Kasten seine Groesse hat und
           ankauf.js ihn nach oben gerollt hat. */
        requestAnimationFrame(function () {
          for (var k = 0; k < teile.length; k++) io.observe(teile[k]);
        });
      }

      new MutationObserver(function () {
        if (d.open) starten(); else zuruecksetzen();
      }).observe(d, { attributes: true, attributeFilter: ['open'] });

      if (d.open) starten();
    })(dialoge[i]);
  }
})();
