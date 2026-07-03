import QRCode from 'qrcode';
import type { NilongType } from '../data/types';
import { SITE_URL } from './share';

export async function createShareCardBlob(type: NilongType, tags: readonly string[], imageSrc?: string): Promise<Blob> {
  const canvas = await drawShareCard(type, tags, imageSrc);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to render share card'));
    }, 'image/png');
  });
}

export async function createShareCardDataUrl(type: NilongType, tags: readonly string[], imageSrc?: string): Promise<string> {
  const canvas = await drawShareCard(type, tags, imageSrc);
  return canvas.toDataURL('image/png');
}

async function drawShareCard(type: NilongType, tags: readonly string[], imageSrc?: string): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');

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
  ctx.font = `900 ${fitFontSize(ctx, type['奶龙TI类型名'], 700, 94, 72)}px system-ui, sans-serif`;
  ctx.fillText(type['奶龙TI类型名'], 450, 315);

  ctx.fillStyle = '#fff';
  ctx.font = '700 38px system-ui, sans-serif';
  wrapText(ctx, type['一句话判词'], 450, 392, 690, 50, 2, true);

  if (imageSrc) {
    try {
      const image = await loadImage(imageSrc);
      ctx.save();
      roundRect(ctx, 250, 470, 400, 400, 40);
      ctx.clip();
      drawCoverImage(ctx, image, 250, 470, 400, 400);
      ctx.restore();
    } catch {
      // If loading fails, text-only share card still works.
    }
  }

  ctx.fillStyle = '#fff7ed';
  ctx.font = '600 31px system-ui, sans-serif';
  wrapText(ctx, type.description, 450, 930, 700, 40, 5, true);

  ctx.fillStyle = '#111827';
  roundRect(ctx, 105, 1144, 505, 86, 40);
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.font = '800 28px system-ui, sans-serif';
  wrapText(ctx, tags.join(' · ') || '抽象 · 奶味 · 变异', 357, 1198, 440, 34, 2, true);

  ctx.fillStyle = '#fff';
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.fillText('测测你是哪种离谱奶龙', 335, 1280);

  await drawQrCode(ctx, 650, 1168, 142);
  return canvas;
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

function drawCoverImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number): void {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;

  if (imageRatio > boxRatio) {
    sw = image.naturalHeight * boxRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = image.naturalWidth / boxRatio;
    sy = (image.naturalHeight - sh) / 2;
  }

  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

async function drawQrCode(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): Promise<void> {
  const dataUrl = await QRCode.toDataURL(SITE_URL, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: size,
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
  });

  const qrImage = await loadImage(dataUrl);
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x - 10, y - 10, size + 20, size + 48, 20);
  ctx.fill();
  ctx.drawImage(qrImage, x, y, size, size);
  ctx.fillStyle = '#111827';
  ctx.font = '800 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('扫码开测', x + size / 2, y + size + 30);
}

function fitFontSize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxSize: number, minSize: number): number {
  for (let size = maxSize; size >= minSize; size -= 2) {
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
  }
  return minSize;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 4, ellipsis = false): void {
  const chars = Array.from(text);
  let line = '';
  let lines = 0;
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      if (ellipsis && lines >= maxLines - 1) {
        ctx.fillText(trimToWidth(ctx, `${line}…`, maxWidth), x, y);
        return;
      }
      ctx.fillText(line, x, y);
      line = char;
      y += lineHeight;
      lines += 1;
      if (lines >= maxLines) return;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

function trimToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  let next = text;
  while (next.length > 1 && ctx.measureText(next).width > maxWidth) {
    next = `${next.slice(0, -2)}…`;
  }
  return next;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
