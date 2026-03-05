// UI binding and helpers
import { $, parseRes } from "/utils.js";

export const ui = {
  topic: $("#topic"),
  audience: $("#audience"),
  tone: $("#tone"),
  steps: $("#steps"),
  stepsCount: $("#stepsCount"),
  themeColor: $("#themeColor"),
  accentColor: $("#accentColor"),
  emojiMode: $("#emojiMode"),
  musicStyle: $("#musicStyle"),
  resolution: $("#resolution"),
  duration: $("#duration"),
  visuals: $("#visuals"),
  narration: $("#narration"),
  generateBtn: $("#generateBtn"),
  renderBtn: $("#renderBtn"),
  playPreview: $("#playPreview"),
  stopPreview: $("#stopPreview"),
  progressBar: $("#progressBar"),
  progressLabel: $("#progressLabel"),
  scriptView: $("#scriptView"),
  canvas: $("#stage"),
  downloadLink: $("#downloadLink"),
};

export function setProgress(p, label) {
  ui.progressBar.style.width = `${Math.min(1, Math.max(0, p)) * 100}%`;
  ui.progressLabel.textContent = label;
}

export function enableRenderButtons() {
  ui.renderBtn.disabled = false;
  ui.playPreview.disabled = false;
  ui.stopPreview.disabled = false;
}

export function disableControlsDuringRender(disabled) {
  const inputs = document.querySelectorAll("input, textarea, select, button");
  inputs.forEach((el) => {
    if (el === ui.stopPreview) return;
    if (el === ui.playPreview) return;
    if (el === ui.downloadLink) return;
    if (el === ui.renderBtn || el === ui.generateBtn) {
      el.disabled = disabled ? true : el.disabled;
    } else {
      el.disabled = disabled;
    }
  });
}

export function renderScriptView(s) {
  ui.scriptView.innerHTML = "";
  s.segments.forEach((seg) => {
    const div = document.createElement("div");
    div.className = "item";
    if (seg.type === "step") {
      const narr = seg.narration ? ` — " ${seg.narration} " ` : "";
      div.innerHTML = `<span class="time">[${seg.start.toFixed(
        1
      )}→${seg.end.toFixed(1)}]</span> Step ${seg.index}/${seg.total}: ${seg.text}${narr}`;
    } else if (seg.type === "intro") {
      div.innerHTML = `<span class="time">[${seg.start.toFixed(
        1
      )}→${seg.end.toFixed(1)}]</span> Intro: ${seg.title} — ${seg.subtitle || ""}`;
    } else {
      div.innerHTML = `<span class="time">[${seg.start.toFixed(
        1
      )}→${seg.end.toFixed(1)}]</span> Outro: ${seg.title} — ${seg.subtitle || ""}`;
    }
    ui.scriptView.appendChild(div);
  });
}

export async function prepareCanvas(resolutionValue) {
  const { w, h } = parseRes(resolutionValue);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  ui.canvas.width = Math.round(w * dpr);
  ui.canvas.height = Math.round(h * dpr);
  ui.canvas.style.width = `${w}px`;
  ui.canvas.style.height = `${h}px`;
}