// Orchestrator wiring modules together
import { aspectFromResolution, parseRes } from "/utils.js";
import { themeFrom } from "/theme.js";
import { ui, setProgress, enableRenderButtons, disableControlsDuringRender, renderScriptView, prepareCanvas } from "/ui.js";
import { generateScriptAI, generateScriptLocal } from "/ai.js";
import { prepareVisuals, getImageForSegment } from "/visuals.js";
import { prepareNarration, makeMusic } from "/audio.js";
import { makeRenderer } from "/renderer.js";

let script = null;
let previewState = { playing: false };
let recorderState = { recording: false };
let narrationAssets = { enabled: false, urls: [] };

ui.generateBtn.addEventListener("click", async () => {
  await prepareCanvas(ui.resolution.value);
  setProgress(0.02, "Generating script…");

  const stepsUser = ui.steps.value.trim()
    ? ui.steps.value.split("\n").map((s) => s.replace(/^[-*]\s*/, "").trim()).filter(Boolean)
    : [];

  const aiOpts = {
    topicInput: ui.topic.value.trim(),
    audience: ui.audience.value.trim(),
    tone: ui.tone.value,
    stepsUser,
    stepsCount: parseInt(ui.stepsCount.value, 10) || 5,
    emojiMode: ui.emojiMode.value,
    duration: parseInt(ui.duration.value, 10),
  };

  const localOpts = {
    topicInput: ui.topic.value.trim(),
    audience: ui.audience.value.trim(),
    tone: ui.tone.value,
    stepsText: ui.steps.value,
    stepsCount: parseInt(ui.stepsCount.value, 10) || 5,
    emojiMode: ui.emojiMode.value,
    duration: parseInt(ui.duration.value, 10),
  };

  let s = await generateScriptAI(aiOpts);
  if (!s) s = generateScriptLocal(localOpts);

  script = s;
  renderScriptView(script);

  setProgress(0.18, "Preparing visuals…");
  await prepareVisuals(script, ui.resolution.value, ui.visuals.value, (p, msg) => {
    setProgress(0.18 + p * 0.32, msg || `Preparing visuals… ${Math.round(p * 100)}%`);
  });

  setProgress(0.50, "Generating narration…");
  narrationAssets = await prepareNarration(script, ui.narration.value);

  enableRenderButtons();
  setProgress(0.72, "Script ready. Preview generated.");

  const theme = themeFrom(ui.themeColor.value, ui.accentColor.value);
  const renderer = makeRenderer(ui.canvas, script, theme, getImageForSegment);
  renderer.render(0.02);
  setProgress(0.75, "Ready to render.");
});

ui.playPreview.addEventListener("click", () => {
  if (!script) return;
  previewPlay();
});
ui.stopPreview.addEventListener("click", () => {
  previewStop();
});

async function previewPlay() {
  if (previewState.playing) return;
  const theme = themeFrom(ui.themeColor.value, ui.accentColor.value);
  const renderer = makeRenderer(ui.canvas, script, theme, getImageForSegment);
  const start = performance.now();
  previewState.playing = true;

  let last = 0;
  const frameInterval = 1000 / 30;

  function frame(now) {
    if (!previewState.playing) return;
    if (now - last >= frameInterval) {
      last = now;
      const t = (now - start) / 1000;
      const T = script.totalDuration;
      const tt = t % T;
      renderer.render(tt);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
function previewStop() {
  previewState.playing = false;
}

ui.renderBtn.addEventListener("click", async () => {
  if (!script) return;
  await renderVideo();
});

async function renderVideo() {
  disableControlsDuringRender(true);
  setProgress(0.78, "Initializing renderer…");
  ui.downloadLink.style.display = "none";

  const { w, h } = parseRes(ui.resolution.value);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  ui.canvas.width = Math.round(w * dpr);
  ui.canvas.height = Math.round(h * dpr);
  ui.canvas.style.width = `${w}px`;
  ui.canvas.style.height = `${h}px`;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  setProgress(0.80, "Preparing audio…");
  let narrationBuffers = [];
  if (narrationAssets.enabled && narrationAssets.urls?.length) {
    for (let i = 0; i < narrationAssets.urls.length; i++) {
      const url = narrationAssets.urls[i];
      if (!url) {
        narrationBuffers.push(null);
        continue;
      }
      try {
        const ab = await fetch(url).then((r) => r.arrayBuffer());
        const buf = await audioContext.decodeAudioData(ab);
        narrationBuffers.push(buf);
      } catch {
        narrationBuffers.push(null);
      }
    }
  }

  const music = await makeMusic(audioContext, ui.musicStyle.value, script.totalDuration);

  const narrGain = audioContext.createGain();
  narrGain.gain.value = 0.9;
  narrGain.connect(music.master);

  const startAt = audioContext.currentTime + 0.1;
  if (narrationAssets.enabled) {
    script.segments.forEach((seg, i) => {
      const buf = narrationBuffers[i];
      if (!buf) return;
      const src = audioContext.createBufferSource();
      src.buffer = buf;

      try {
        const mg = music.master.gain;
        const base = 0.22; // slightly lower for clarity
        mg.setValueAtTime(base, startAt + seg.start);
        mg.linearRampToValueAtTime(base * 0.6, startAt + seg.start + 0.05);
        mg.linearRampToValueAtTime(base, startAt + Math.max(seg.end - 0.05, seg.start + 0.2));
      } catch {}

      src.connect(narrGain);
      src.start(startAt + seg.start + 0.05);
    });
  }

  music.start();

  const canvasStream = ui.canvas.captureStream(60);
  const mixedStream = new MediaStream();
  const [videoTrack] = canvasStream.getVideoTracks();
  mixedStream.addTrack(videoTrack);
  const audioTrack = music.destinationNode.stream.getAudioTracks()[0];
  if (audioTrack) mixedStream.addTrack(audioTrack);

  let recorder;
  const options = { mimeType: "video/webm;codecs=vp9,opus" };
  try {
    recorder = new MediaRecorder(mixedStream, options);
  } catch {
    recorder = new MediaRecorder(mixedStream);
  }

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };

  const theme = themeFrom(ui.themeColor.value, ui.accentColor.value);
  const renderer = makeRenderer(ui.canvas, script, theme, getImageForSegment);

  let start = null;
  let rafId = 0;
  let stopped = false;

  function drawLoop() {
    const t = Math.min(Math.max(audioContext.currentTime - startAt, 0), script.totalDuration);
    const p = t / script.totalDuration;
    renderer.render(t);
    setProgress(0.80 + p * 0.18, `Rendering… ${Math.round(p * 100)}%`);
    if (t < script.totalDuration && !stopped) {
      rafId = requestAnimationFrame(drawLoop);
    } else {
      stopped = true;
      try { recorder.stop(); } catch {}
      try { music.stop(); } catch {}
      setProgress(0.99, "Finalizing video…");
    }
  }

  recorder.onstart = () => {
    recorderState.recording = true;
    requestAnimationFrame(drawLoop);
  };

  recorder.onstop = async () => {
    recorderState.recording = false;
    cancelAnimationFrame(rafId);
    try {
      await audioContext.close();
    } catch {}
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    ui.downloadLink.href = url;
    ui.downloadLink.style.display = "inline-block";
    ui.downloadLink.textContent = `Download ${script.totalDuration}s Video (WEBM)`;
    setProgress(1, "Done. Video ready to download.");
    disableControlsDuringRender(false);
  };

  recorder.start(250);
  setTimeout(() => {
    if (recorderState.recording) {
      try {
        recorder.stop();
      } catch {}
    }
  }, (script.totalDuration + 3) * 1000);
}

// Live preview update on theme/resolution/visuals change
["themeColor", "accentColor", "resolution", "visuals"].forEach((id) => {
  const el = ui[id];
  if (!el) return;
  el.addEventListener("change", async () => {
    if (!script) return;
    if (id === "resolution") await prepareCanvas(ui.resolution.value);
    const theme = themeFrom(ui.themeColor.value, ui.accentColor.value);
    const renderer = makeRenderer(ui.canvas, script, theme, getImageForSegment);
    renderer.render(0.02);
  });
});