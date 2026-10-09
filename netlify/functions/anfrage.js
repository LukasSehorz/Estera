/* =====================================================================
   GEGENSTELLE DER FORMULARSTRECKEN — seit 11.09.2026
   =====================================================================
   Bis hierher hatten alle drei Formulare in kontakt.html ein leeres
   action und schickten nichts weg. Diese Funktion ist der Empfaenger,
   der dort gefehlt hat.

   WAS SIE TUT
     1  nimmt den Formularinhalt als multipart/form-data entgegen,
     2  setzt daraus eine lesbare Mail (Text und HTML),
     3  haengt einen Lebenslauf an, falls einer mitkam,
     4  schickt sie ueber Resend an den Empfaenger.

   DER SCHLUESSEL STEHT NICHT IN DIESER DATEI und gehoert auch in keine
   Datei des Repositories: es ist oeffentlich. Er kommt aus den
   Netlify-Umgebungsvariablen und wird hier nur gelesen.

   ANTWORT-ADRESSE: reply_to traegt die Adresse des Absenders. Damit
   antwortet ein Klick auf „Antworten" im Postfach direkt dem Interessenten
   und nicht der Absenderadresse des Formulars.
   ===================================================================== */

const { Resend } = require('resend');
const crypto = require('crypto');

/* Die Beschriftungen aus dem Formular. Ohne sie stuenden in der Mail die
   technischen Feldnamen („berufliche-situation"), was im Postfach
   unleserlich ist. Reihenfolge = Reihenfolge in der Mail. */
const FELDER_KONTAKT = [
  ['name',                 'Name'],
  ['email',                'E-Mail'],
  ['telefon',              'Telefon'],
  ['anliegen',             'Anliegen'],
  ['berufliche-situation', 'Berufliche Situation'],
  ['nettoeinkommen',       'Nettoeinkommen'],
  ['eigenkapital',         'Eigenkapital'],
  ['ernsthaftes-interesse','Ernsthaftes Interesse'],
];

const FELDER_BEWERBUNG = [
  ['vorname',        'Vorname'],
  ['nachname',       'Nachname'],
  ['email',          'E-Mail'],
  ['telefon',        'Telefon'],
  ['bereich',        'Bereich'],
  ['aufgaben',       'Aufgaben'],
  ['erfahrung',      'Erfahrung'],
  ['letzte-stelle',  'Letzte Stelle'],
  ['schulabschluss', 'Schulabschluss'],
  ['startzeitpunkt', 'Startzeitpunkt'],
];

/* Gegen Eintraege von Maschinen: ein Feld, das kein Mensch sieht und
   deshalb leer bleibt. Ist es gefuellt, war es ein Automat — die Anfrage
   wird still verworfen (200, damit der Automat nichts lernt). */
const FALLE = 'website';

/* =====================================================================
   SCHUTZ GEGEN FORMULAR-SPAM — 09.10.2026
   =====================================================================
   Anlass: Estera bekam ueber die Formulare viele Einsendungen von
   Automaten („ScottgralfGM Robertgralf", „NAEWTRER1464554NERTYTRY",
   Adresshaendler „FreeB2BData"). Die Feldfalle oben hielt sie nicht auf —
   diese Automaten fuellen sogar Auswahlfelder und die Einwilligung aus und
   schicken direkt an /api/anfrage, ohne die Seite je im Browser zu laden.

   DREI HUERDEN, alle unsichtbar fuer echte Besucher:

   1  PRUEFWERT. Die Seite holt sich beim Laden per GET einen Wert von hier:
      die Uhrzeit, mit einem Schluessel unterschrieben, den nur diese
      Funktion kennt. Ohne gueltige Unterschrift wird nicht versendet. Wer
      direkt an die Adresse schickt, hat keinen.
   2  ZEITFALLE. Die Unterschrift traegt die Uhrzeit DES SERVERS. Wer frueher
      als MINDESTALTER nach dem Laden absendet, ist kein Mensch — allein das
      Oeffnen der Strecke und drei Auswahlschritte dauern laenger. Die Uhr
      des Besuchers spielt dabei keine Rolle.
   3  INHALTSFILTER. Bekannte Muster (eindeutig) verwerfen; schwache
      Anzeichen (Link im Text, rein englischer Text, Unsinnsnamen) zaehlen.
      Zwei schwache = verworfen. EIN schwaches = trotzdem zugestellt, aber
      mit „[Spamverdacht]" im Betreff — ein englischsprachiger Interessent
      oder ein Link zu einem Expose soll nicht still verloren gehen.

   Verworfen wird STILL mit 200 „OK", wie bei der Feldfalle: Der Automat
   lernt nichts, und der Grund steht im Protokoll der Funktion (Netlify →
   Logs → Functions → anfrage), ohne Inhalt, nur Grund und Formular.

   WER OHNE JAVASCRIPT ABSENDET, hat keinen Pruefwert und faellt mit
   heraus. Ohne JavaScript landete er bisher schon auf einer weissen Seite
   mit Rohtext; die Strecke selbst braucht es.

   Der Schluessel wird aus RESEND_API_KEY abgeleitet, damit niemand in
   Netlify etwas eintragen muss. Wer ihn getrennt will, setzt
   FORMULAR_GEHEIMNIS. Wird der Resend-Schluessel getauscht, verfallen nur
   die Pruefwerte offener Seiten — die holen beim Absenden einen neuen.
   ===================================================================== */
const MINDESTALTER_MS = 5000;               /* frueher abgesendet = Automat     */
const HOECHSTALTER_MS = 24 * 60 * 60 * 1000; /* die Seite erneuert nach 6 Std.  */

function pruefSchluessel() {
  const quelle = process.env.FORMULAR_GEHEIMNIS || process.env.RESEND_API_KEY || '';
  return crypto.createHash('sha256').update('estera-formular:' + quelle).digest();
}

function unterschrift(zeit) {
  return crypto.createHmac('sha256', pruefSchluessel()).update(zeit).digest('base64url').slice(0, 22);
}

function pruefwertAusstellen() {
  const zeit = Date.now().toString(36);
  return zeit + '.' + unterschrift(zeit);
}

/* Liefert das Alter des Pruefwerts in Millisekunden, oder null, wenn er
   fehlt, kaputt oder nicht von hier ist. */
function pruefwertAlter(wert) {
  const m = /^([0-9a-z]{6,12})\.([A-Za-z0-9_-]{22})$/.exec(String(wert || '').trim());
  if (!m) return null;
  const soll = Buffer.from(unterschrift(m[1]));
  const ist = Buffer.from(m[2]);
  if (soll.length !== ist.length || !crypto.timingSafeEqual(soll, ist)) return null;
  return Date.now() - parseInt(m[1], 36);
}

/* Muster, die in keiner echten Anfrage an Estera stehen. Alle aus
   tatsaechlich eingegangenem Spam oder dessen bekannten Abwandlungen. */
const EINDEUTIG = [
  /gralf/i,                                  /* „ScottgralfGM Robertgralf" u. a. */
  /freeb2bdata|b2b ?data/i,
  /wanted to know your price/i,
  /\b(seo|backlinks?|casino|crypto|bitcoin|viagra|forex)\b/i,
  /[Ѐ-ӿ一-鿿؀-ۿ]/, /* kyrillisch, chinesisch, arabisch */
];
const FREITEXT = ['name', 'vorname', 'nachname', 'bereich', 'aufgaben', 'letzte-stelle', 'schulabschluss'];
const NAMEN = ['name', 'vorname', 'nachname'];
const WORT_EN = new Set(['the', 'you', 'your', 'we', 'our', 'hello', 'hi', 'price', 'please',
  'would', 'like', 'know', 'with', 'this', 'that', 'are', 'is', 'and', 'website', 'business', 'regards']);
const WORT_DE = new Set(['der', 'die', 'das', 'und', 'ich', 'ist', 'nicht', 'mit', 'für', 'fuer',
  'ein', 'eine', 'bei', 'auf', 'zu', 'wir', 'sie', 'du', 'habe', 'von', 'als', 'im', 'in']);

/* Liefert { verwerfen: Grund oder null, verdacht: Grund oder null }. */
function inhaltPruefen(werte) {
  /* Ohne Feldfalle und Pruefwert: der Pruefwert ist Zufallstext und koennte
     sonst rein zufaellig ein Muster treffen. */
  const alles = Object.keys(werte).filter((k) => k !== FALLE && k !== 'pruefwert')
    .map((k) => werte[k]).join(' \n ');
  for (const muster of EINDEUTIG) {
    if (muster.test(alles)) return { verwerfen: 'Muster ' + muster.source.slice(0, 24), verdacht: null };
  }
  const frei = FREITEXT.map((k) => werte[k] || '').join(' ');
  const namen = NAMEN.map((k) => werte[k] || '');
  const anzeichen = [];

  if (/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|org|net|ru|info|xyz|io)\b/i.test(frei)) anzeichen.push('Link im Text');
  if (namen.some((n) => /https?:|www\./i.test(n))) return { verwerfen: 'Link im Namen', verdacht: null };

  const woerter = frei.toLowerCase().match(/[a-zäöüß]+/g) || [];
  const en = woerter.filter((w) => WORT_EN.has(w)).length;
  const de = woerter.filter((w) => WORT_DE.has(w)).length + (/[äöüß]/i.test(frei) ? 1 : 0);
  if (en >= 3 && de === 0) anzeichen.push('englischer Text');

  if (namen.some((n) => (n.match(/\d/g) || []).length >= 4)) anzeichen.push('Ziffern im Namen');
  const [vor, nach] = [werte['vorname'] || '', werte['nachname'] || ''].map((s) => s.trim().toLowerCase());
  if (vor.length > 3 && vor === nach) anzeichen.push('Vorname gleich Nachname');

  if (anzeichen.length >= 2) return { verwerfen: anzeichen.join(' + '), verdacht: null };
  return { verwerfen: null, verdacht: anzeichen[0] || null };
}

function verwerfen(grund, werte) {
  /* Kein Inhalt ins Protokoll — nur, WARUM und WELCHES Formular. */
  console.log('Formular verworfen:', grund, '| formular=' + (werte['formular'] || '?'));
  return { statusCode: 200, body: 'OK' };
}

function html(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Die Mail wird zweifach gesetzt: als Text fuer Postfaecher, die kein HTML
   zeigen, und als HTML fuer alle anderen. Beide tragen denselben Inhalt. */
function mailText(felder, werte) {
  const zeilen = felder
    .filter(([schluessel]) => (werte[schluessel] || '').trim() !== '')
    .map(([schluessel, titel]) => `${titel}: ${werte[schluessel]}`);
  return zeilen.join('\n');
}

function mailHtml(felder, werte, ueberschrift) {
  const zeilen = felder
    .filter(([schluessel]) => (werte[schluessel] || '').trim() !== '')
    .map(([schluessel, titel]) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #e8e4dd;
                   font:400 13px/1.5 Helvetica,Arial,sans-serif;color:#6b6358;
                   white-space:nowrap;vertical-align:top;">${html(titel)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #e8e4dd;
                   font:400 15px/1.5 Helvetica,Arial,sans-serif;color:#1c2b42;">
          ${html(werte[schluessel])}</td>
      </tr>`).join('');

  return `<!doctype html>
<html lang="de"><body style="margin:0;padding:24px;background:#f4f1ec;">
  <table role="presentation" cellpadding="0" cellspacing="0"
         style="max-width:640px;margin:0 auto;background:#ffffff;
                border:1px solid #e8e4dd;border-radius:4px;">
    <tr>
      <td style="padding:24px 16px;background:#1c2b42;border-radius:4px 4px 0 0;">
        <div style="font:400 18px/1.3 Georgia,serif;color:#ffffff;
                    letter-spacing:.08em;">ESTERA IMMOBILIEN</div>
        <div style="font:400 13px/1.5 Helvetica,Arial,sans-serif;
                    color:#c9a227;margin-top:6px;">${html(ueberschrift)}</div>
      </td>
    </tr>
    <tr><td style="padding:8px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${zeilen}
      </table>
    </td></tr>
    <tr><td style="padding:16px;font:400 12px/1.6 Helvetica,Arial,sans-serif;
                   color:#8a8378;border-top:1px solid #e8e4dd;">
      Gesendet über das Formular auf estera.immobilien.
      Ein Klick auf „Antworten“ geht direkt an die absendende Person.
    </td></tr>
  </table>
</body></html>`;
}

exports.handler = async (event) => {
  /* GET stellt den Pruefwert aus (siehe SCHUTZ GEGEN FORMULAR-SPAM oben). */
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      body: JSON.stringify({ t: pruefwertAusstellen() }),
    };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Nur GET und POST.' };
  }

  const schluessel = process.env.RESEND_API_KEY;
  if (!schluessel) {
    /* Kein Schluessel: NICHT so tun, als sei es gutgegangen. Sonst sieht
       der Besucher das Dankebild und die Anfrage ist trotzdem verloren. */
    console.error('RESEND_API_KEY fehlt in den Umgebungsvariablen.');
    return { statusCode: 500, body: 'Der Versand ist nicht eingerichtet.' };
  }

  const absender   = process.env.ANFRAGE_ABSENDER   || 'formular@estera.immobilien';

  /* multipart/form-data zerlegen. Netlify reicht den Rumpf bei Dateien
     base64-kodiert durch; ohne diese Unterscheidung kaeme ein Lebenslauf
     beschaedigt an. */
  let werte = {};
  let anhang = null;
  try {
    const typ = event.headers['content-type'] || event.headers['Content-Type'] || '';
    const rumpf = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body || '', 'utf8');

    if (typ.includes('multipart/form-data')) {
      const treffer = typ.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
      const grenze = '--' + (treffer ? (treffer[1] || treffer[2]).trim() : '');
      const teile = rumpf.toString('binary').split(grenze);

      for (const teil of teile) {
        const schnitt = teil.indexOf('\r\n\r\n');
        if (schnitt === -1) continue;
        const kopf = teil.slice(0, schnitt);
        const name = (kopf.match(/name="([^"]*)"/) || [])[1];
        if (!name) continue;
        const datei = (kopf.match(/filename="([^"]*)"/) || [])[1];
        let inhalt = teil.slice(schnitt + 4);
        inhalt = inhalt.replace(/\r\n$/, '');

        if (datei) {
          if (datei.trim() === '' || inhalt.length === 0) continue;
          anhang = {
            filename: datei,
            content: Buffer.from(inhalt, 'binary').toString('base64'),
          };
        } else {
          const text = Buffer.from(inhalt, 'binary').toString('utf8').trim();
          /* Mehrfachauswahl: Werte sammeln statt ueberschreiben. */
          werte[name] = werte[name] ? werte[name] + ', ' + text : text;
        }
      }
    } else {
      new URLSearchParams(rumpf.toString('utf8')).forEach((wert, name) => {
        werte[name] = werte[name] ? werte[name] + ', ' + wert : wert;
      });
    }
  } catch (fehler) {
    console.error('Formular liess sich nicht zerlegen:', fehler);
    return { statusCode: 400, body: 'Die Angaben waren nicht lesbar.' };
  }

  /* Automat? Still annehmen, nichts versenden. */
  if ((werte[FALLE] || '').trim() !== '') {
    return verwerfen('Feldfalle gefuellt', werte);
  }

  /* Pruefwert und Zeitfalle — vor der Einwilligung, denn die fuellen die
     Automaten ebenfalls aus. */
  const alter = pruefwertAlter(werte['pruefwert']);
  if (alter === null) return verwerfen('ohne gueltigen Pruefwert', werte);
  if (alter < MINDESTALTER_MS) return verwerfen('zu schnell (' + Math.round(alter / 100) / 10 + ' s)', werte);
  if (alter > HOECHSTALTER_MS) return verwerfen('Pruefwert abgelaufen', werte);

  const inhalt = inhaltPruefen(werte);
  if (inhalt.verwerfen) return verwerfen(inhalt.verwerfen, werte);

  /* Einwilligung ist Pflicht — dieselbe Pruefung wie im Browser, denn
     eine Pruefung allein im Browser laesst sich umgehen. */
  if ((werte['datenschutz'] || '').trim() === '') {
    return { statusCode: 400, body: 'Ohne Einwilligung kein Versand.' };
  }

  const istBewerbung = (werte['formular'] || '').startsWith('bewerbung');
  const felder = istBewerbung ? FELDER_BEWERBUNG : FELDER_KONTAKT;

  /* LEADS UND BEWERBUNGEN IN GETRENNTE POSTFAECHER — 26.09.2026.
     Bis dahin ging alles an info@. Estera hat dafuer zwei freigegebene
     Postfaecher in Microsoft 365 angelegt: anfrage@ fuer das Kontaktformular,
     karriere@ fuer beide Bewerbungsstrecken (bewerbung-vertrieb und
     bewerbung-backoffice). Freigegeben und nicht persoenlich, weil der
     Ausfall vom 15.09. genau daher kam: info@ leitete an das Postfach einer
     Mitarbeiterin weiter, das geloescht wurde, und jede Mail kam zurueck.

     Die Adressen stehen hier fest, damit niemand etwas in Netlify eintragen
     muss. Die beiden Umgebungsvariablen sind NEU benannt: eine aeltere
     ANFRAGE_EMPFAENGER (sie zeigte auf info@) soll die Trennung nicht still
     aufheben koennen. */
  const empfaenger = istBewerbung
    ? (process.env.EMPFAENGER_BEWERBUNGEN || 'karriere@estera.immobilien')
    : (process.env.EMPFAENGER_ANFRAGEN    || 'anfrage@estera.immobilien');
  const ueberschrift = istBewerbung
    ? 'Neue Bewerbung über das Karriere-Formular'
    : 'Neue Anfrage über das Kontaktformular';

  const betreff = (inhalt.verdacht ? '[Spamverdacht] ' : '') + (istBewerbung
    ? `Bewerbung: ${werte['vorname'] || ''} ${werte['nachname'] || ''}`.trim()
    : `Anfrage: ${werte['name'] || 'ohne Namen'}`);
  if (inhalt.verdacht) console.log('Formular mit Spamverdacht zugestellt:', inhalt.verdacht);

  const nachricht = {
    from: `Estera Formular <${absender}>`,
    to: [empfaenger],
    subject: betreff,
    text: mailText(felder, werte),
    html: mailHtml(felder, werte, ueberschrift),
  };

  /* Nur setzen, wenn eine Adresse dasteht — eine leere reply_to lehnt
     Resend ab. */
  if ((werte['email'] || '').trim() !== '') {
    nachricht.reply_to = werte['email'].trim();
  }
  if (anhang) nachricht.attachments = [anhang];

  try {
    const resend = new Resend(schluessel);
    const { data, error } = await resend.emails.send(nachricht);
    if (error) {
      console.error('Resend hat abgelehnt:', error);
      return { statusCode: 502, body: 'Der Versand ist fehlgeschlagen.' };
    }
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, id: data && data.id }),
    };
  } catch (fehler) {
    console.error('Versand gescheitert:', fehler);
    return { statusCode: 502, body: 'Der Versand ist fehlgeschlagen.' };
  }
};
