// Headless check of Guide.html: every tab renders on a phone and on desktop, no script errors.
//   python3 -m http.server 8744 (repo root), then: node web/guide-smoke.mjs
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const base = process.argv[2] || 'http://127.0.0.1:8744/Guide.html';
const out = path.join(root, 'output/guide'); fs.mkdirSync(out, { recursive: true });
const exe = process.env.CHROME || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(f => fs.existsSync(f));
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox'] });
try {
  for (const [dev, vp] of [['phone', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ['desktop', { width: 1366, height: 900 }]]) {
    const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.setViewport(vp);
    for (const tab of ['home', 'bikes', 'bikes/cfr', 'bikes/speedmax-cf-2011', 'stats', 'news', 'help']) {
      await page.goto(`${base}#${tab}`, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 400));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${dev} ${tab} overflows`);
      await page.screenshot({ path: path.join(out, `${dev}-${tab.replace('/', '-')}.png`), fullPage: dev === 'phone' && tab === 'stats' });
    }
    assert.deepEqual(errors, [], dev); console.log(dev, 'OK'); await page.close();
  }
} finally { await browser.close(); }
