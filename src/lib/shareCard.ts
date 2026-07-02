import type { NilongType } from '../data/types';

export async function downloadShareCard(type: NilongType, tags: readonly string[], imageSrc?: string): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, 900, 1400);
  gradient.addColorStop(0, '#211300');
  gradient.addColorStop(0.45, '#facc15');
  gradient.addColorStop(1, '#ef4444');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 900, 1400);

  ctx.fillStyle = 'rgba(0,0,0,.72)';
  roundRect(ctx, 60, 70, 780, 1260, 48);
  ctx.fill();

  ctx.fillStyle = '#fef3c7';
  ctx.font = '900 70px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('奶龙TI人格判决书', 450, 170);

  ctx.fillStyle = '#fde047';
  ctx.font = '900 96px system-ui, sans-serif';
  ctx.fillText(type['奶龙TI类型名'], 450, 315);

  ctx.fillStyle = '#fff';
  ctx.font = '700 42px system-ui, sans-serif';
  wrapText(ctx, type['一句话判词'], 450, 410, 680, 58);

  if (imageSrc) {
    try {
      const image = await loadImage(imageSrc);
      ctx.save();
      roundRect(ctx, 230, 465, 440, 440, 44);
      ctx.clip();
      ctx.drawImage(image, 230, 465, 440, 440);
      ctx.restore();
    } catch {
      // If loading fails, text-only share card still works.
    }
  }

  ctx.fillStyle = '#fff7ed';
  ctx.font = '600 34px system-ui, sans-serif';
  wrapText(ctx, type.description, 450, 965, 700, 42, 5);

  ctx.fillStyle = '#111827';
  roundRect(ctx, 145, 1120, 610, 86, 40);
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.font = '800 32px system-ui, sans-serif';
  ctx.fillText(tags.join(' · ') || '抽象 · 奶味 · 变异', 450, 1175);

  ctx.fillStyle = '#fff';
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.fillText('测测你是哪种离谱奶龙', 450, 1265);

  const link = document.createElement('a');
  link.download = `NailongTI-${type['奶龙TI_code']}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 4): void {
  const chars = Array.from(text);
  let line = '';
  let lines = 0;
  for (const char of chars) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = char;
      y += lineHeight;
      lines += 1;
      if (lines >= maxLines - 1) break;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
