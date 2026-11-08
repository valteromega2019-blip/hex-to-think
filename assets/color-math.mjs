export function channels(values, count, maximum) {
  if (!Array.isArray(values) || values.length !== count || values.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > maximum)) {
    throw new Error(`Informe ${count} canais entre 0 e ${maximum}.`);
  }
  return values;
}

export function hexToRgb(value) {
  let hex = String(value).trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = [...hex].map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error('HEX inválido. Use #RRGGBB ou #RGB.');
  return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
}

export function rgbToHex(rgb) {
  return '#' + rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function rgbToHsl(rgb) {
  const [r, g, b] = rgb.map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  if (d) {
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return [h, d ? d / (1 - Math.abs(2 * l - 1)) * 100 : 0, l * 100];
}

// CIEDE2000, kL=kC=kH=1. Both Lab arrays must have the same white point.
export function deltaE00(lab1, lab2) {
  const [l1, a1, b1] = lab1, [l2, a2, b2] = lab2;
  const rad = x => x * Math.PI / 180;
  const deg = x => x * 180 / Math.PI;
  const c1 = Math.hypot(a1, b1), c2 = Math.hypot(a2, b2), cbar = (c1 + c2) / 2;
  const g = 0.5 * (1 - Math.sqrt(cbar ** 7 / (cbar ** 7 + 25 ** 7)));
  const ap1 = (1 + g) * a1, ap2 = (1 + g) * a2;
  const cp1 = Math.hypot(ap1, b1), cp2 = Math.hypot(ap2, b2);
  const hue = (a, b) => a === 0 && b === 0 ? 0 : (deg(Math.atan2(b, a)) + 360) % 360;
  const hp1 = hue(ap1, b1), hp2 = hue(ap2, b2);
  const dl = l2 - l1, dc = cp2 - cp1;
  let dh = hp2 - hp1;
  if (cp1 * cp2 === 0) dh = 0;
  else if (dh > 180) dh -= 360;
  else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(cp1 * cp2) * Math.sin(rad(dh / 2));
  const lp = (l1 + l2) / 2, cp = (cp1 + cp2) / 2;
  let hp;
  if (cp1 * cp2 === 0) hp = hp1 + hp2;
  else if (Math.abs(hp1 - hp2) <= 180) hp = (hp1 + hp2) / 2;
  else hp = (hp1 + hp2 + (hp1 + hp2 < 360 ? 360 : -360)) / 2;
  const t = 1 - 0.17 * Math.cos(rad(hp - 30)) + 0.24 * Math.cos(rad(2 * hp)) + 0.32 * Math.cos(rad(3 * hp + 6)) - 0.20 * Math.cos(rad(4 * hp - 63));
  const sl = 1 + 0.015 * (lp - 50) ** 2 / Math.sqrt(20 + (lp - 50) ** 2);
  const sc = 1 + 0.045 * cp, sh = 1 + 0.015 * cp * t;
  const rt = -2 * Math.sqrt(cp ** 7 / (cp ** 7 + 25 ** 7)) * Math.sin(rad(60 * Math.exp(-(((hp - 275) / 25) ** 2))));
  return Math.sqrt(Math.max(0, (dl / sl) ** 2 + (dc / sc) ** 2 + (dH / sh) ** 2 + rt * (dc / sc) * (dH / sh)));
}

export function quality(delta) {
  return delta < 1 ? 'Muito próxima' : delta < 2 ? 'Próxima' : delta < 5 ? 'Diferença perceptível' : 'Diferença elevada';
}
