import { hexToRgb, rgbToHex, deltaE00 } from './assets/color-math.mjs';
import { extractPalette } from './assets/image-palette.js';
const $ = selector => document.querySelector(selector);
const presets = { earth: ['#87674F', '#25282A', '#F0EDE6', '#C4D56C'], digital: ['#5820A4', '#00B398', '#DFE7ED', '#171224'], ocean: ['#174753', '#59B6BC', '#E5ECDD', '#152C35'] };
let colors = [...presets.earth], catalog = [], matches = [], dirty = false, converting = false, toastTimer;
function message(text) { clearTimeout(toastTimer); $('#toast').textContent = text; $('#toast').hidden = false; toastTimer = setTimeout(() => $('#toast').hidden = true, 3500); }
async function copy(text) { try { await navigator.clipboard.writeText(text); message('Código copiado. Pronto para criar.'); } catch { message('A cópia não foi permitida pelo navegador. Selecione o código e use Ctrl+C.'); } }
// sRGB / D65 for this browser demo. The desktop app uses the selected ICC profiles / Lab D50.
function lab(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  const xyz = [(r * .4124564 + g * .3575761 + b * .1804375) / .95047, r * .2126729 + g * .7151522 + b * .0721750, (r * .0193339 + g * .1191920 + b * .9503041) / 1.08883].map(v => v > 216 / 24389 ? Math.cbrt(v) : (24389 / 27 * v + 16) / 116);
  return [116 * xyz[1] - 16, 500 * (xyz[0] - xyz[1]), 200 * (xyz[1] - xyz[2])];
}
function ink(hex) { const [r, g, b] = hexToRgb(hex).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return r * .2126 + g * .7152 + b * .0722 > .179 ? '#17131F' : '#F8F5FC'; }
function markDirty() { dirty = true; matches = []; $('#copy-palette').disabled = true; $('#convert').disabled = !catalog.length || !colors.length || converting; $('#comparison').replaceChildren(); const hint = document.createElement('p'); hint.className = 'loading'; hint.textContent = colors.length ? 'Paleta pronta. Clique em HEX → PANTONE para comparar.' : 'Adicione uma cor, importe uma imagem ou escolha uma paleta de exemplo.'; $('#comparison').append(hint); }
function renderInput() {
  $('#input-palette').replaceChildren(...colors.map((hex, index) => { const button = document.createElement('button'); button.style.backgroundColor = hex; button.setAttribute('aria-label', `Remover ${hex} da paleta`); button.title = `Remover ${hex}`; button.addEventListener('click', () => { colors.splice(index, 1); renderInput(); markDirty(); }); return button; }));
  $('#palette-count').textContent = `${colors.length} / 8`; $('#clear-palette').disabled = !colors.length; $('#convert').disabled = !colors.length || !catalog.length || converting;
}
function half(color, title, code, detail, copied) {
  const button = document.createElement('button'); button.className = 'comparison-half'; button.style.setProperty('--swatch', color); button.style.setProperty('--ink', ink(color)); button.setAttribute('aria-label', `Copiar ${code}`); button.title = `Clique para copiar ${copied}`;
  const eyebrow = document.createElement('small'); eyebrow.textContent = title;
  const body = document.createElement('div'), name = document.createElement('strong'), info = document.createElement('span'); name.textContent = code; info.textContent = detail; body.append(name, info); button.append(eyebrow, body); button.addEventListener('click', () => copy(copied)); return button;
}
function convert() {
  if (!catalog.length || !colors.length || converting) return;
  converting = true; $('#convert').disabled = true; $('#convert').classList.add('is-converting'); $('#demo-error').textContent = '';
  requestAnimationFrame(() => setTimeout(() => {
    try {
      const collection = $('#collection').value, candidates = catalog.filter(c => c.collection === collection);
      if (!candidates.length) throw new Error('Esta coleção não está disponível na demonstração.');
      matches = colors.map(hex => { const source = lab(hex); let best = null; for (const candidate of candidates) { const delta = deltaE00(source, candidate.lab); if (!best || delta < best.delta) best = { ...candidate, delta }; } return best; });
      $('#comparison').replaceChildren(...colors.map((hex, index) => { const match = matches[index], row = document.createElement('div'); row.className = 'comparison-row'; const divider = document.createElement('span'); divider.className = 'comparison-divider'; divider.textContent = '↔'; divider.setAttribute('aria-hidden', 'true'); row.append(half(hex, 'ORIGINAL / sRGB', hex, `RGB ${hexToRgb(hex).join(', ')}`, hex), half(match.hex, 'APROXIMAÇÃO / sRGB', match.name, `${match.hex} · ΔE00 ${match.delta.toFixed(2)}`, match.name), divider); return row; }));
      dirty = false; $('#copy-palette').disabled = false;
    } catch (error) { $('#demo-error').textContent = error.message; }
    finally { converting = false; $('#convert').disabled = !colors.length || !catalog.length; setTimeout(() => $('#convert').classList.remove('is-converting'), 500); }
  }, 80));
}
$('#color-form').addEventListener('submit', event => { event.preventDefault(); try { if (colors.length >= 8) throw new Error('A paleta comporta até oito cores. Remova uma para adicionar outra.'); const hex = rgbToHex(hexToRgb($('#hex-input').value)); if (colors.includes(hex)) throw new Error('Esta cor já está na sua paleta.'); colors.push(hex); $('#hex-input').value = hex; $('#color-picker').value = hex; $('#demo-error').textContent = ''; renderInput(); markDirty(); } catch (error) { $('#demo-error').textContent = error.message; } });
$('#color-picker').addEventListener('input', event => $('#hex-input').value = event.target.value.toUpperCase());
$('#hex-input').addEventListener('input', event => { try { $('#color-picker').value = rgbToHex(hexToRgb(event.target.value)); } catch { /* Keep incomplete input while typing. */ } });
$('#convert').addEventListener('click', convert); $('#collection').addEventListener('change', () => { markDirty(); convert(); });
$('#clear-palette').addEventListener('click', () => { colors = []; renderInput(); markDirty(); });
$('#copy-palette').addEventListener('click', () => { if (dirty || !matches.length) return; copy(matches.map((c, i) => `${colors[i]} → ${c.name} · ${c.hex} · RGB ${hexToRgb(c.hex).join(', ')}`).join('\n')); });
document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => { if (converting) return; colors = [...presets[button.dataset.preset]]; renderInput(); markDirty(); convert(); }));
$('#image-input').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return; let url;
  try {
    if (converting) throw new Error('Aguarde a conversão atual para importar a imagem.');
    if (file.size > 20 * 1024 * 1024) throw new Error('Use uma imagem de até 20 MB.');
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/bmp'].includes(file.type)) throw new Error('Use PNG, JPEG, WebP ou BMP.');
    url = URL.createObjectURL(file); const image = new Image(); image.src = url; await image.decode();
    const scale = Math.min(1, 240 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale)); canvas.getContext('2d', { colorSpace: 'srgb' }).drawImage(image, 0, 0, canvas.width, canvas.height);
    colors = extractPalette(canvas).map(rgb => rgbToHex(rgb)).slice(0, 8); $('#demo-error').textContent = ''; renderInput(); markDirty(); convert(); message(`${colors.length} cores extraídas. A imagem permaneceu no seu navegador.`);
  } catch (error) { $('#demo-error').textContent = error.message || 'Não foi possível abrir esta imagem.'; }
  finally { if (url) URL.revokeObjectURL(url); event.target.value = ''; }
});
function applyLook(name) { const palette = presets[name], preview = $('#application-preview'); preview.style.setProperty('--main', palette[0]); preview.style.setProperty('--dark', name === 'digital' ? palette[3] : palette[1]); preview.style.setProperty('--light', palette[2]); preview.style.setProperty('--accent', name === 'digital' ? palette[1] : palette[3]); preview.style.setProperty('--main-ink', ink(palette[0])); document.querySelectorAll('[data-look]').forEach(button => { const selected = button.dataset.look === name; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); }); }
document.querySelectorAll('[data-look]').forEach(button => button.addEventListener('click', () => applyLook(button.dataset.look)));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.site-header nav a').forEach(link => { link.addEventListener('pointermove', event => { if (reduced.matches) return; const rect = link.getBoundingClientRect(); link.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .12}px, ${(event.clientY - rect.top - rect.height / 2) * .15}px) scale(1.05)`; }); link.addEventListener('pointerleave', () => link.style.transform = ''); });
renderInput(); markDirty(); applyLook('earth');
try { const response = await fetch('assets/colors.json'); if (!response.ok) throw new Error(); catalog = (await response.json()).map(c => ({ ...c, lab: lab(c.hex) })); renderInput(); convert(); } catch { $('#demo-error').textContent = 'Não foi possível carregar a base da demo. Recarregue a página quando estiver conectado. O aplicativo instalado usa sua base local.'; }
try { const response = await fetch('release.json', { cache: 'no-cache' }); if (!response.ok) throw new Error(); const release = await response.json(); if (/^\d+\.\d+\.\d+$/.test(release.version)) document.querySelectorAll('[data-version]').forEach(el => el.textContent = release.version); if (release.url?.startsWith('https://github.com/valteromega2019-blip/hex-to-think/releases/download/')) document.querySelectorAll('.download-link').forEach(link => link.href = release.url); if (Number.isSafeInteger(release.bytes)) $('#download-size').textContent = `${(release.bytes / 1048576).toFixed(1)} MB · .exe`; if (/^[a-f0-9]{64}$/i.test(release.sha256)) $('#release-checksum').textContent = release.sha256; if (Array.isArray(release.notes)) $('#release-notes').replaceChildren(...release.notes.map(note => { const li = document.createElement('li'); li.textContent = note; return li; })); } catch { /* The pinned version and release links remain available. */ }
