# How-To Video Maker — by Rhythrosa Labs

Fully automated kinetic-text how-to video generator that runs entirely in the browser. No plugins, no installs — just open and create.

## Features

- **AI script generation** — describe a topic and get a structured how-to script with steps, narration, and timing
- **Kinetic-text renderer** — animated canvas-based video with smooth transitions
- **AI-generated images** — per-step cinematic background images
- **Text-to-speech narration** — multiple voices and languages
- **Background music** — selectable styles (corporate, lofi, acoustic, cinematic, etc.)
- **Configurable output** — resolution, duration, step count, tone, emoji mode, theme colours
- **In-browser MP4 export** — download the finished video directly

## Running locally

Serve the folder with any static HTTP server (required for ES module imports):

```bash
# Python 3
python3 -m http.server 8787

# Node (npx)
npx serve .
```

Then open `http://localhost:8787` in your browser.

## Platform note

This project was built for the [WebSim](https://websim.ai) platform, which provides the `websim.*` browser globals used for:

| Global | Purpose |
|---|---|
| `websim.chat.completions.create` | LLM script generation |
| `websim.imageGen` | Per-step AI image generation |
| `websim.textToSpeech` | Narration audio |

These features are only available when the page is loaded inside WebSim. When running outside of WebSim, AI generation falls back to a local template-based script generator and visuals fall back to Picsum stock photos. TTS narration will be silently skipped.

## File overview

| File | Role |
|---|---|
| `index.html` | App shell and import map |
| `app.js` | Entry point (delegates to `main.js`) |
| `main.js` | Orchestrator — wires all modules together |
| `ai.js` | Script generation (AI + local fallback) |
| `visuals.js` | Image preparation and cache |
| `audio.js` | TTS narration + background music |
| `renderer.js` | Canvas frame renderer |
| `ui.js` | DOM query helpers and UI utilities |
| `theme.js` | Colour theme derivation |
| `utils.js` | Shared utility functions |
| `styles.css` | App styles |

## License

MIT
