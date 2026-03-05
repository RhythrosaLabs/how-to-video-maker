// Canvas renderer
import { drawImageCover, roundRect, wrapLines, clamp } from "/utils.js";
import { tinycolor } from "/theme.js";

export function makeRenderer(canvas, script, theme, getImageForSegment) {
  const ctx = canvas.getContext("2d");
  const { width: W, height: H } = canvas;

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }
  function easeInOut(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function drawBackground(t) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    const shift = (Math.sin(t * 0.2) + 1) / 2;
    const col1 = tinycolor.mix(theme.bg1, theme.glow, shift * 20).toHexString();
    const col2 = tinycolor.mix(theme.bg2, theme.accent, (1 - shift) * 20).toHexString();
    g.addColorStop(0, col1);
    g.addColorStop(1, col2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Subtle background pattern (lighter to reduce noise)
    ctx.globalAlpha = 0.035;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    const step = Math.round(Math.min(W, H) / 20);
    ctx.beginPath();
    for (let x = 0; x <= W; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = 0; y <= H; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // subtle vignette to focus content
    ctx.save();
    const rad = Math.hypot(W, H);
    const vg = ctx.createRadialGradient(W / 2, H / 2, rad * 0.35, W / 2, H / 2, rad * 0.6);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawIntro(seg, localT, img) {
    if (img) {
      const s = 1.03;
      drawImageCover(ctx, img, -(W * (s - 1)) / 2, -(H * (s - 1)) / 2, W * s, H * s);
      ctx.fillStyle = "rgba(5,8,20,0.40)";
      ctx.fillRect(0, 0, W, H);
    }
    const pIn = easeOutCubic(clamp(localT / 0.6, 0, 1));
    const pSub = easeOutCubic(clamp((localT - 0.25) / 0.6, 0, 1));

    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    if (seg.emoji) {
      ctx.font = `${Math.floor(H * 0.12)}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
      ctx.globalAlpha = pIn;
      ctx.fillText(seg.emoji, W / 2, H * 0.28);
      ctx.globalAlpha = 1;
    }
    ctx.font = `bold ${Math.floor(H * 0.086)}px Inter, system-ui, sans-serif`;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 20 * pIn;
    ctx.fillText(seg.title, W / 2, H * 0.45 - (1 - pIn) * 16);

    const pill = seg.subtitle || "";
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.9 * Math.max(0, pSub);
    ctx.fillStyle = "rgba(0,0,0,.25)";
    const padX = 18, padY = 10;
    ctx.font = `500 ${Math.floor(H * 0.034)}px Inter, system-ui, sans-serif`;
    const m = ctx.measureText(pill);
    const bw = m.width + padX * 2, bh = Math.floor(H * 0.06);
    const bx = W / 2 - bw / 2, by = H * 0.57 - bh / 2;
    roundRect(ctx, bx, by, bw, bh, Math.min(16, bh / 2));
    ctx.fill();
    ctx.globalAlpha = Math.max(0, pSub);
    ctx.fillStyle = theme.accent;
    ctx.fillText(pill, W / 2, H * 0.57 + Math.floor(H * 0.012));
    ctx.globalAlpha = 1;
  }

  function drawStep(seg, localT, img) {
    const dur = seg.end - seg.start;
    // Tighter in/out
    const inT = clamp(localT / 0.4, 0, 1);
    const outT = clamp((localT - (dur - 0.5)) / 0.5, 0, 1);
    const pIn = easeOutCubic(inT);
    const pOut = easeOutCubic(outT);
    const p = Math.min(pIn, 1 - pOut * 0.95);

    if (img) {
        ctx.save();
        const imgW = W * 0.45;
        const imgH = H * 0.7;
        const imgX = W * 0.94 - imgW;
        const imgY = (H - imgH) / 2;
        ctx.globalAlpha = p;
        roundRect(ctx, imgX, imgY, imgW, imgH, 30);
        ctx.clip();
        const panX = Math.sin(localT * 0.5) * imgW * 0.035;
        const panY = Math.cos(localT * 0.45) * imgH * 0.028;
        const scale = 1 + (1 - pIn) * 0.08;
        const dW = imgW * scale, dH = imgH * scale;
        const dX = imgX - (dW - imgW) / 2 + panX;
        const dY = imgY - (dH - imgH) / 2 + panY;
        drawImageCover(ctx, img, dX, dY, dW, dH);
        ctx.restore();
    }
    
    const textMaxWidth = img ? W * 0.38 : W * 0.84;
    const textX = W * 0.06;

    const countStr = `Step ${seg.index}/${seg.total}`;
    ctx.textAlign = "left";
    ctx.font = `600 ${Math.floor(H * 0.036)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = p;
    ctx.fillText(countStr, textX, H * 0.16 - (1 - p) * 8);
    ctx.globalAlpha = 1;

    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = `800 ${Math.floor(H * 0.060)}px Inter, system-ui, sans-serif`;
    const wrapped = wrapLines(ctx, seg.text, textMaxWidth, 3);
    const baseY = H * 0.35;
    wrapped.forEach((line, i) => {
      const y = baseY + i * H * 0.085;
      ctx.globalAlpha = clamp(p - i * 0.1, 0, 1);
      ctx.fillText(line, textX, y);
    });
    ctx.globalAlpha = 1;

    const blocks = 5;
    for (let i = 0; i < blocks; i++) {
      const tt = (i / blocks) * Math.PI * 2 + localT * 0.8;
      const x = W * 0.08 + (i / (blocks - 1)) * W * 0.84;
      const y = H * 0.75 + Math.sin(tt) * 10;
      ctx.globalAlpha = 0.15 + 0.1 * Math.sin(tt * 2);
      ctx.fillStyle = theme.accent;
      ctx.fillRect(x - 4, y - 4, 8, 8);
    }
    ctx.globalAlpha = 1;
  }

  function drawOutro(seg, localT, img) {
    if (img) {
      const s = 1.03;
      drawImageCover(ctx, img, -(W * (s - 1)) / 2, -(H * (s - 1)) / 2, W * s, H * s);
      ctx.fillStyle = "rgba(5,8,20,0.50)";
      ctx.fillRect(0, 0, W, H);
    }
    const pIn = clamp(localT / 0.5, 0, 1);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${Math.floor(H * 0.09)}px Inter, system-ui, sans-serif`;
    ctx.globalAlpha = pIn;
    ctx.fillText(seg.title, W / 2, H * 0.45);

    ctx.globalAlpha = clamp((localT - 0.2) / 0.5, 0, 1);
    ctx.font = `600 ${Math.floor(H * 0.036)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = theme.accent;
    ctx.fillText(seg.subtitle, W / 2, H * 0.60);

    ctx.globalAlpha = 1;
    if (seg.emoji) {
      ctx.font = `${Math.floor(H * 0.12)}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
      ctx.fillText(seg.emoji, W / 2, H * 0.28);
    }
  }

  function render(t) {
    const segIdx = script.segments.findIndex((s) => t >= s.start && t < s.end);
    const seg = segIdx >= 0 ? script.segments[segIdx] : script.segments.at(-1);
    const localT = t - seg.start;
    const img = getImageForSegment?.(Math.max(0, segIdx));

    drawBackground(t);
    if (seg.type === "intro") drawIntro(seg, localT, img);
    else if (seg.type === "step") drawStep(seg, localT, img);
    else drawOutro(seg, localT, img);

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#cdd2ff";
    ctx.font = `600 ${Math.floor(H * 0.022)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText(`How-To Video Maker • ${script.totalDuration}s`, W - 18, H - 18);
    ctx.globalAlpha = 1;
  }

  return { render };
}