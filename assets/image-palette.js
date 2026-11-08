// Quantize an sRGB canvas. All processing stays in the renderer, without network.
export function extractPalette(canvas) {
  const context = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height, { colorSpace: 'srgb' });
  const bins = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 220) continue;
    const key = (data[i] >> 4) * 256 + (data[i + 1] >> 4) * 16 + (data[i + 2] >> 4);
    const bin = bins.get(key) || { sum: [0, 0, 0], count: 0, position: 0 };
    for (let ch = 0; ch < 3; ch++) bin.sum[ch] += data[i + ch];
    bin.count++;
    bin.position += i / 4;
    bins.set(key, bin);
  }
  const points = [...bins.values()].map(b => ({ rgb: b.sum.map(v => v / b.count), count: b.count, position: b.position / b.count }));
  if (!points.length) throw new Error('A imagem não contém pixels opacos suficientes.');
  points.sort((a, b) => b.count - a.count);
  const distance = (a, b) => a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0);
  let centers = [points[0].rgb];
  while (centers.length < 8 && centers.length < points.length) {
    let best = null, score = 0;
    for (const point of points) {
      const nearest = Math.min(...centers.map(c => distance(point.rgb, c)));
      if (nearest < 144) continue;
      const candidate = nearest * Math.sqrt(point.count);
      if (candidate > score) { score = candidate; best = point.rgb; }
    }
    if (!best) break;
    centers.push(best);
  }
  let groups;
  for (let iteration = 0; iteration < 14; iteration++) {
    groups = centers.map(() => ({ sum: [0, 0, 0], count: 0, position: 0 }));
    for (const point of points) {
      let nearest = 0;
      for (let i = 1; i < centers.length; i++) if (distance(point.rgb, centers[i]) < distance(point.rgb, centers[nearest])) nearest = i;
      const group = groups[nearest];
      group.count += point.count;
      group.position += point.position * point.count;
      point.rgb.forEach((v, i) => group.sum[i] += v * point.count);
    }
    centers = groups.map((g, i) => g.count ? g.sum.map(v => v / g.count) : centers[i]);
  }
  const total = points.reduce((sum, p) => sum + p.count, 0);
  return groups.map((g, i) => ({ rgb: centers[i].map(Math.round), count: g.count, position: g.position / Math.max(1, g.count) }))
    .filter(g => g.count / total >= 0.015).sort((a, b) => a.position - b.position)
    .map(g => g.rgb).filter((rgb, i, all) => !all.slice(0, i).some(other => distance(rgb, other) < 100)).slice(0, 8);
}

export async function loadImage(canvas, url) {
  const image = new Image();
  await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('Não foi possível ler essa imagem.')); image.src = url; });
  if (image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('Use uma imagem de até 40 megapixels.');
  const scale = Math.min(1, 320 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
}
