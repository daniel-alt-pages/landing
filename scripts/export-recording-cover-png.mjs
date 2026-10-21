/**
 * Exporta miniatura idéntica a RecordingCoverArt (640×360) vía HTML + Puppeteer.
 * Uso: node scripts/export-recording-cover-png.mjs [--clase 35]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const PRESETS = {
  35: {
    slug: 'clase-35-ciencias-naturales',
    hex: '#22C55E',
    areaKey: 'ciencias naturales',
    areaLabel: 'Ciencias naturales',
    mascot: 'ciencias-naturales.webp',
    badge: '#35',
    recordedAt: '2026-06-27',
    dateLine: '27 jun 2026',
    partLabel: 'Clase oficial',
    tags: ['biología', 'química'],
  },
};

function parseClaseArg() {
  const idx = process.argv.indexOf('--clase');
  if (idx === -1 || !process.argv[idx + 1]) return 35;
  return Number.parseInt(process.argv[idx + 1], 10);
}

function buildHtml(preset, mascotFileUrl) {
  const { hex, badge, areaLabel, dateLine, partLabel, tags, recordedAt } = preset;
  const footerLine = `${partLabel} · ${areaLabel}`;
  const [tag1, tag2] = tags;
  const areaUpper = areaLabel.toUpperCase();
  const dateUpper = dateLine.toUpperCase();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 640px; height: 360px; overflow: hidden; background: #060608; }
    .cover {
      position: relative;
      width: 640px;
      height: 360px;
      overflow: hidden;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.06);
      background: linear-gradient(165deg, #12121a 0%, #060608 42%, #08060c 100%);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.14),
        inset 0 -1px 0 ${hex}33,
        0 0 0 1px rgba(255,255,255,0.07),
        0 18px 48px -12px ${hex}44,
        0 8px 28px rgba(0,0,0,0.55);
      font-family: Inter, Arial, Helvetica, sans-serif;
    }
    .dots, .dots-soft, .pattern, .glow-a, .glow-b, .glow-c, .glow-d, .glow-e,
    .shade-a, .shade-b, .shade-c, .line-top, .line-bottom {
      position: absolute; inset: 0; pointer-events: none;
    }
    .dots {
      opacity: 0.9;
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.11) 1px, transparent 0);
      background-size: 12px 12px;
    }
    .dots-soft {
      opacity: 0.6;
      mix-blend-mode: overlay;
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0);
      background-size: 24px 24px;
    }
    .pattern {
      opacity: 0.7;
      mix-blend-mode: soft-light;
      background-image:
        radial-gradient(circle at 72% 38%, rgba(255,255,255,0.05) 0%, transparent 28%),
        radial-gradient(circle at 72% 38%, transparent 42%, rgba(255,255,255,0.04) 43%, transparent 44%),
        radial-gradient(circle at 72% 38%, transparent 58%, rgba(255,255,255,0.03) 59%, transparent 60%);
    }
    .glow-a {
      inset: auto -20% -45% -20%;
      height: 85%;
      border-radius: 50%;
      filter: blur(48px);
      background: radial-gradient(ellipse 80% 70% at 50% 100%, ${hex} 0%, ${hex}bb 28%, ${hex}66 48%, transparent 72%);
    }
    .glow-b {
      inset: auto 0 0 0;
      height: 62%;
      background: linear-gradient(to top, ${hex}88 0%, ${hex}55 22%, ${hex}28 45%, transparent 100%);
    }
    .glow-c {
      inset: auto 0 0 0;
      height: 28%;
      z-index: 1;
      background: linear-gradient(to top, ${hex}aa 0%, ${hex}44 55%, transparent 100%);
    }
    .glow-d {
      right: -8%; bottom: -15%; left: auto; top: auto;
      width: 55%; height: 75%;
      border-radius: 50%;
      filter: blur(40px);
      background: radial-gradient(circle, ${hex}77 0%, ${hex}33 45%, transparent 70%);
    }
    .glow-e {
      left: -5%; top: 18%; right: auto; bottom: auto;
      width: 50%; height: 55%;
      border-radius: 50%;
      filter: blur(36px);
      background: radial-gradient(circle, ${hex}44 0%, transparent 68%);
    }
    .shade-a { z-index: 1; background: linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.2)); }
    .shade-b { z-index: 1; background: linear-gradient(to top right, rgba(255,255,255,0.07), transparent 50%); }
    .shade-c { z-index: 1; background: radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.06), transparent 50%); }
    .canvas { position: absolute; inset: 0; z-index: 2; }
    .panel {
      position: absolute;
      left: 28px; top: 22px;
      width: 352px;
      padding: 16px 18px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(0,0,0,0.24);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 24px rgba(0,0,0,0.28);
      z-index: 3;
    }
    .badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px; height: 50px;
      margin-bottom: 12px;
      border-radius: 9999px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(0,0,0,0.55);
      box-shadow: 0 0 18px ${hex}55;
      color: #fff;
      font-size: 26px;
      font-weight: 900;
    }
    .head {
      font-size: 50px;
      font-weight: 900;
      line-height: 0.88;
      letter-spacing: -0.025em;
      text-transform: uppercase;
      color: #fff;
      text-shadow: 0 4px 24px rgba(0,0,0,0.85);
    }
    .head span { display: block; }
    .divider {
      margin: 12px 0;
      width: 200px; height: 3px;
      border-radius: 9999px;
      background: linear-gradient(90deg, ${hex}, ${hex}99, transparent);
      box-shadow: 0 0 14px ${hex}88;
    }
    .sub {
      font-size: 19px;
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: 0.025em;
      text-transform: uppercase;
      color: #fff;
      text-shadow: 0 2px 14px rgba(0,0,0,0.8);
    }
    .sub .date { display: block; margin-top: 4px; color: rgba(255,255,255,0.9); }
    .tag {
      position: absolute;
      z-index: 2;
      padding: 4px 8px;
      border-radius: 8px;
      border: 1px solid ${hex}55;
      background: ${hex}22;
      box-shadow: 0 4px 16px ${hex}33, inset 0 1px 0 rgba(255,255,255,0.12);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
      color: rgba(255,255,255,0.9);
      backdrop-filter: blur(12px);
    }
    .tag-1 { left: 458px; top: 28px; transform: rotate(-6deg); }
    .tag-2 { left: 478px; top: 108px; transform: rotate(4deg); }
    .floater {
      position: absolute;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      border: 1px solid ${hex}66;
      background: ${hex}28;
      box-shadow: 0 6px 20px ${hex}44, inset 0 1px 0 rgba(255,255,255,0.18);
      color: rgba(255,255,255,0.9);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: -0.02em;
      backdrop-filter: blur(12px);
    }
    .mascot-wrap {
      position: absolute;
      right: -16px; bottom: -8px;
      width: 284px; height: 318px;
      z-index: 2;
    }
    .mascot-wrap img {
      width: 100%; height: 100%;
      object-fit: contain;
      object-position: bottom;
      filter: drop-shadow(0 16px 32px ${hex}55) drop-shadow(0 8px 24px rgba(0,0,0,0.65));
    }
    .footer {
      position: absolute;
      left: 0; right: 0; bottom: 0;
      z-index: 4;
      padding: 10px 16px;
      border-top: 1px solid ${hex}44;
      background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.2));
      backdrop-filter: blur(12px);
      box-shadow: inset 0 1px 0 ${hex}33;
    }
    .footer-main {
      font-size: 13px;
      font-weight: 700;
      line-height: 1.375;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .footer-meta {
      margin-top: 2px;
      font-size: 10px;
      font-weight: 500;
      color: rgba(255,255,255,0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .line-top {
      z-index: 4; inset: 0 0 auto 0; height: 1px;
      background: linear-gradient(90deg, transparent 5%, ${hex}cc 50%, transparent 95%);
    }
    .line-bottom {
      z-index: 4; inset: auto 0 0 0; height: 2px;
      background: linear-gradient(90deg, transparent, ${hex}, transparent);
    }
  </style>
</head>
<body>
  <div class="cover">
    <div class="dots"></div>
    <div class="dots-soft"></div>
    <div class="pattern"></div>
    <div class="glow-a"></div>
    <div class="glow-b"></div>
    <div class="glow-c"></div>
    <div class="glow-d"></div>
    <div class="glow-e"></div>
    <div class="shade-a"></div>
    <div class="shade-b"></div>
    <div class="shade-c"></div>
    <div class="canvas">
      <div class="panel">
        <div class="badge">${badge}</div>
        <h3 class="head"><span>Grabación</span><span>de la clase</span></h3>
        <div class="divider"></div>
        <p class="sub"><span>${areaUpper}</span><span class="date">${dateUpper}</span></p>
      </div>
      <span class="floater" style="left:50px;top:46px;width:36px;height:36px;transform:rotate(-7deg);opacity:0.92;font-size:9px">⚛</span>
      <span class="floater" style="left:164px;top:76px;width:32px;height:32px;transform:rotate(4deg);opacity:0.9;font-size:10px">H₂O</span>
      <span class="floater" style="left:196px;top:130px;width:30px;height:30px;transform:rotate(-5deg);opacity:0.86;font-size:9px">ADN</span>
      <span class="floater" style="left:86px;top:154px;width:28px;height:28px;transform:rotate(6deg);opacity:0.82;font-size:8px">E=mc²</span>
      <span class="tag tag-1">${tag1}</span>
      <span class="tag tag-2">${tag2}</span>
      <div class="mascot-wrap">
        <img src="${mascotFileUrl}" alt="" />
      </div>
      <div class="footer">
        <p class="footer-main">${footerLine}</p>
        <p class="footer-meta">preicfes-sg26 · ${dateLine}</p>
      </div>
    </div>
    <div class="line-top"></div>
    <div class="line-bottom"></div>
  </div>
</body>
</html>`;
}

async function main() {
  const clase = parseClaseArg();
  const preset = PRESETS[clase];
  if (!preset) {
    console.error(`Sin preset para clase ${clase}. Disponibles: ${Object.keys(PRESETS).join(', ')}`);
    process.exit(1);
  }

  const mascotPath = path.join(root, 'public', 'images', 'recordings', 'mascotas', preset.mascot);
  const outDir = path.resolve(root, '..', '_salida', 'covers');
  const htmlPath = path.join(outDir, `${preset.slug}.html`);
  const outPath = path.join(outDir, `${preset.slug}.png`);

  await mkdir(outDir, { recursive: true });

  const mascotUrl = `${pathToFileURL(mascotPath).href}?v=${Date.now()}`;
  const html = buildHtml(preset, mascotUrl);
  await writeFile(htmlPath, html, 'utf8');

  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 640, height: 360, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0' });
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });
    await page.waitForFunction(() => {
      const img = document.querySelector('.mascot-wrap img');
      return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
    });
    const cover = await page.$('.cover');
    await cover.screenshot({ path: outPath, type: 'png' });
  } finally {
    await browser.close();
  }

  console.log(`OK ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
