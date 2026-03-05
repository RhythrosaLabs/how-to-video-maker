// Entry point kept for backward compatibility.
// The app has been refactored into modules under the root.
// See /main.js for the orchestrator.

import "/main.js";

// Tombstones to indicate removed code moved to modules:
// removed const tinycolor = window.tinycolor;
// removed const $ = sel => document.querySelector(sel);
// removed const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
// removed all UI query selectors and state objects
// removed function setProgress(...){...}
// removed function secondsToTimestamp(...){...}
// removed function aspectFromResolution(...){...}
// removed async function generateScriptAI(...){...}
// removed function autoSteps(...){...}
// removed function pickEmojisForTopic(...){...}
// removed function generateScriptLocal(...){...}
// removed function renderScriptView(...){...}
// removed function parseRes(...){...}
// removed function themeFrom(...){...}
// removed function makeMusic(...){...}
// removed async function prepareVisuals(...){...}
// removed async function prepareNarration(...){...}
// removed function loadImage(...){...}
// removed function makeRenderer(...){...}
// removed function drawImageCover(...){...}
// removed function wrapLines(...){...}
// removed function roundRect(...){...}
// removed async function prepareCanvas(...){...}
// removed function enableRenderButtons(...){...}
// removed function disableControlsDuringRender(...){...}
// removed preview/play/stop handlers and renderVideo orchestrator
// removed settings change listeners