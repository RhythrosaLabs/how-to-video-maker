// Utilities shared across modules

export const $ = (sel) => document.querySelector(sel);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function secondsToTimestamp(s) {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(Math.floor(s % 60)).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function aspectFromResolution(val) {
  const [w, h] = val.split("x").map((n) => parseInt(n, 10));
  const r = w / h;
  if (Math.abs(r - 16 / 9) < 0.02) return "16:9";
  if (Math.abs(r - 9 / 16) < 0.02) return "9:16";
  if (Math.abs(r - 1) < 0.02) return "1:1";
  return "16:9";
}

export function parseRes(val) {
  const [w, h] = val.split("x").map((n) => parseInt(n, 10));
  return { w, h };
}

export function wrapLines(ctx, text, maxWidth, maxLines = 3) {
  const words = (text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth) {
      if (line) lines.push(line);
      if (lines.length >= maxLines) break;
      line = w;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines.slice(0, maxLines);
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawImageCover(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const ir = iw / ih,
    r = w / h;
  let dw, dh, dx, dy;
  if (ir > r) {
    dh = h;
    dw = dh * ir;
    dx = x + (w - dw) / 2;
    dy = y;
  } else {
    dw = w;
    dh = dw / ir;
    dx = x;
    dy = y + (h - dh) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}