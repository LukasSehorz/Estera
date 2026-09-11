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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Nur POST.' };
  }

  const schluessel = process.env.RESEND_API_KEY;
  if (!schluessel) {
    /* Kein Schluessel: NICHT so tun, als sei es gutgegangen. Sonst sieht
       der Besucher das Dankebild und die Anfrage ist trotzdem verloren. */
    console.error('RESEND_API_KEY fehlt in den Umgebungsvariablen.');
    return { statusCode: 500, body: 'Der Versand ist nicht eingerichtet.' };
  }

  const empfaenger = process.env.ANFRAGE_EMPFAENGER || 'info@estera.immobilien';
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
    return { statusCode: 200, body: 'OK' };
  }

  /* Einwilligung ist Pflicht — dieselbe Pruefung wie im Browser, denn
     eine Pruefung allein im Browser laesst sich umgehen. */
  if ((werte['datenschutz'] || '').trim() === '') {
    return { statusCode: 400, body: 'Ohne Einwilligung kein Versand.' };
  }

  const istBewerbung = (werte['formular'] || '').startsWith('bewerbung');
  const felder = istBewerbung ? FELDER_BEWERBUNG : FELDER_KONTAKT;
  const ueberschrift = istBewerbung
    ? 'Neue Bewerbung über das Karriere-Formular'
    : 'Neue Anfrage über das Kontaktformular';

  const betreff = istBewerbung
    ? `Bewerbung: ${werte['vorname'] || ''} ${werte['nachname'] || ''}`.trim()
    : `Anfrage: ${werte['name'] || 'ohne Namen'}`;

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
