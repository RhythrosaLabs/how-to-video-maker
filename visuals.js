// Visuals preparation and cache
import { aspectFromResolution, parseRes } from "/utils.js";

const visualsCache = { imagesByUrl: new Map(), perSegment: new Map() };

export function getVisualsCache() {
  return visualsCache;
}

export function getImageForSegment(idx) {
  return visualsCache.perSegment.get(idx)?.img || null;
}

export async function prepareVisuals(script, resolutionValue, mode, progressCb) {
  visualsCache.imagesByUrl.clear();
  visualsCache.perSegment.clear();
  if (mode === "abstract") return;

  const progress = (p, msg) => { try { progressCb?.(p, msg); } catch {} };

  const aspect = aspectFromResolution(resolutionValue);
  const { w, h } = parseRes(resolutionValue);

  let done = 0;
  const targets = script.segments.map((seg, idx) => ({ seg, idx }));
  for (const { seg, idx } of targets) {
    const basePrompt = seg.imagePrompt || `${script.topic} — ${seg.text || ""}`;
    const refined = await refineImagePrompt(basePrompt, seg, script).catch(() => basePrompt);
    
    // Add negative prompts for better image generation
    const fullPrompt = `${refined}, photorealistic or cinematic, clean composition, subject-centric, shallow depth of field --no text, words, letters, watermark, logo, signature`;

    try {
      let url;
      if (mode === "ai-images") {
        const result = await websim.imageGen({
          prompt: fullPrompt,
          aspect_ratio: aspect,
        });
        url = result.url;
      } else {
        // CORS-safe stock fallback via Picsum, seeded by topic+idx and sized to canvas
        const seed = encodeURIComponent(`${script.topic}-${idx}`);
        url = `https://picsum.photos/seed/${seed}/${w}/${h}`;
      }
      let img;
      try { img = await loadImage(url); } catch { // one retry
        if (mode === "ai-images") {
          const retry = await websim.imageGen({ prompt: fullPrompt, aspect_ratio: aspect });
          img = await loadImage(retry.url);
        } else {
          // change seed slightly on retry
          const seed2 = encodeURIComponent(`${script.topic}-${idx}-b`);
          const retryUrl = `https://picsum.photos/seed/${seed2}/${w}/${h}`;
          img = await loadImage(retryUrl);
        }
      }
      visualsCache.imagesByUrl.set(url, img);
      visualsCache.perSegment.set(idx, { url, img });
    } catch (e) {
      console.warn("Visual fetch failed for segment", idx, e);
    }
    done++;
    progress(done / targets.length, `Preparing visuals… ${done}/${targets.length}`);
  }
}

async function loadImage(url) {
  // Fetch as CORS-enabled request and use a blob URL to keep canvas origin-clean.
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(objectUrl);
      reject(e);
    };
    img.src = objectUrl;
  });
}

async function refineImagePrompt(base, seg, script) {
  const sys = `You craft hyper-specific, single-shot photo prompts. No text or watermarks. Return only the prompt string.`;
  const user = [{ type: "text", text: `Topic: ${script.topic}\nStep: ${seg.text || ""}\nStyle: clean, focused, photorealistic or cinematic, subject-only, macro/close-up if appropriate.` }];
  const c = await websim.chat.completions.create({ messages: [{ role: "system", content: sys }, { role: "user", content: user }] });
  return (c.content || base).replace(/["']/g, "").trim();
}