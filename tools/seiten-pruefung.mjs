// SEITENPRUEFUNG IN CHROME MIT ECHTER GERAETE-EMULATION — 11.09.2026
//
//   python3 -m http.server 8000                       (im Repo-Verzeichnis)
//   node tools/seiten-pruefung.mjs 390 variante-a.html kontakt.html …
//   REDUCE=1 node tools/seiten-pruefung.mjs 390 …      (mit „Bewegung reduzieren")
//   node tools/seiten-pruefung.mjs 1440 …              (Desktop)
//
// Je Seite: Viewport, Seitenhoehe, horizontaler Ueberlauf (scrollWidth gegen
// clientWidth — jeder Ueberlauf ist ein Fehler), Elemente, die ueber den Rand
// ragen (Karussells und Laufbaender sind gewollt), Laufzeitfehler und
// Konsolenmeldungen, dazu ein Ganzseiten-Screenshot unter tools/pruefung-ausgabe/.
//
// WARUM NICHT EINFACH --window-size: Headless-Chrome legt dann ein mindestens
// 500 px breites Fenster an, emuliert kein Telefon und liefert Bilder, in
// denen Text rechts abgeschnitten scheint, der auf einem echten Telefon sauber
// umbricht. Dieses Skript geht ueber das DevTools-Protokoll (Node 22+ bringt
// fetch und WebSocket mit) und setzt Breite, DPR, Touch und iPhone-Kennung.
// Braucht Google Chrome unter /Applications.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333, BASE = process.env.BASE || 'http://127.0.0.1:8000/';
const OUT = new URL('./pruefung-ausgabe/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const [W, ...seiten] = process.argv.slice(2); const BREITE = parseInt(W, 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const udd = mkdtempSync(join(tmpdir(), 'cdp-'));
const chrome = spawn(CH, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${udd}`, 'about:blank'], { stdio: 'ignore' });

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url); this.id = 0; this.pending = new Map(); this.handlers = [];
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && this.pending.has(m.id)) { const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
      else if (m.method) this.handlers.forEach(h => h(m));
    };
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(fn) { this.handlers.push(fn); }
}

async function warten() { for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return; } catch {} await sleep(250); } throw new Error('Chrome antwortet nicht'); }

const MESSUNG = `(() => {
  const de = document.documentElement, W = de.clientWidth, off = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect(); if (r.width === 0) continue;
    if (r.right > W + 1 || r.left < -1) {
      const cls = typeof el.className === 'string' ? el.className.split(' ').filter(Boolean).slice(0, 2).join('.') : '';
      off.push(el.tagName.toLowerCase() + (cls ? '.' + cls : '') + ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
      if (off.length >= 10) break;
    }
  }
  return JSON.stringify({ sw: de.scrollWidth, cw: W, iw: innerWidth, sh: de.scrollHeight, off });
})()`;

const bericht = [];
try {
  await warten();
  for (const seite of seiten) {
    const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
    const c = new CDP(t.webSocketDebuggerUrl); await c.ready;
    const fehler = [];
    c.on(m => {
      if (m.method === 'Runtime.exceptionThrown') fehler.push('EXCEPTION ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]);
      if (m.method === 'Log.entryAdded' && ['error', 'warning'].includes(m.params.entry.level)) fehler.push(m.params.entry.level.toUpperCase() + ' ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
      if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) fehler.push('console.' + m.params.type + ' ' + m.params.args.map(a => a.value ?? a.description).join(' '));
    });
    await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable');
    if (process.env.REDUCE === '1') await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await c.send('Emulation.setDeviceMetricsOverride', { width: BREITE, height: 844, deviceScaleFactor: 2, mobile: BREITE < 800 });
    if (BREITE < 800) {
      await c.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
      await c.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    }
    const geladen = new Promise(r => c.on(m => { if (m.method === 'Page.loadEventFired') r(); }));
    await c.send('Page.navigate', { url: BASE + seite }); await geladen; await sleep(1500);
    // Einmal durchrollen, damit IntersectionObserver-Einblendungen feuern, dann nach oben.
    await c.send('Runtime.evaluate', { expression: `(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, 0); })()`, awaitPromise: true });
    await sleep(1500);
    const { result } = await c.send('Runtime.evaluate', { expression: MESSUNG, returnByValue: true });
    const m = JSON.parse(result.value);
    const shot = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: BREITE, height: Math.min(m.sh, 20000), scale: 1 } });
    const datei = join(OUT, `${BREITE}${process.env.REDUCE === '1' ? 'r' : ''}-${seite.replace('.html', '')}.png`);
    writeFileSync(datei, Buffer.from(shot.data, 'base64'));
    bericht.push({ seite, ...m, fehler });
    const ueberlauf = m.sw > m.cw ? `UEBERLAUF ${m.sw}>${m.cw}` : 'kein Ueberlauf';
    console.log(`${seite.padEnd(32)} Viewport ${m.cw}px  Hoehe ${m.sh}px  ${ueberlauf}  Fehler: ${fehler.length}`);
    if (m.off.length) console.log('   ragt ueber den Rand: ' + m.off.join(' | '));
    fehler.forEach(f => console.log('   ' + f));
    try { await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`); } catch {}
  }
  writeFileSync(join(OUT, `bericht-${BREITE}.json`), JSON.stringify(bericht, null, 1));
} finally { chrome.kill(); }
