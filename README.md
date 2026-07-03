<div align="center">

# 🎬 How-To Video Maker

**Fully automated kinetic-text how-to video generator — runs entirely in the browser**

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

</div>

---

Describe a topic and get a complete how-to video in minutes — no plugins, no installs. AI writes the script, generates cinematic background images for each step, adds TTS narration, picks background music, and exports an MP4 — all from the browser canvas.

## ✨ Features

- **AI Script Generation** — structured how-to script with steps, narration text, and timing
- **Kinetic-Text Renderer** — animated canvas-based video with smooth transitions
- **AI-Generated Images** — per-step cinematic background images
- **TTS Narration** — multiple voices and languages
- **Background Music** — selectable styles: corporate, lofi, acoustic, cinematic, and more
- **Configurable Output** — resolution, duration, step count, tone, emoji mode, theme colors
- **In-Browser MP4 Export** — download the finished video directly

## 🚀 Quick Start

```bash
git clone https://github.com/RhythrosaLabs/how-to-video-maker.git
cd how-to-video-maker
# Serve with any static server (required for ES modules)
python3 -m http.server 8787
# Open http://localhost:8787
```

> **Note:** AI features (script, images, TTS) require the [WebSim](https://websim.ai) platform. When running locally outside WebSim, script generation falls back to templates and images use Picsum stock photos.

## 🛠️ Tech Stack

- **Vanilla JavaScript (ES Modules)** — no framework
- **HTML5 Canvas** — kinetic text animation and video rendering
- **WebSim API** — LLM script generation, AI image generation, TTS
- **MediaRecorder API** — in-browser MP4 export

## 🤝 Contributing

PRs welcome. Open an issue first for major changes.

## 📄 License

MIT

## 💛 Support

If this saves you video editing time, consider supporting development:

👉 [Donate via PayPal](https://paypal.me/noodlebake) — @noodlebake

---
<div align="center">Made with ❤️ by <a href="https://github.com/RhythrosaLabs">RhythrosaLabs</a></div>
