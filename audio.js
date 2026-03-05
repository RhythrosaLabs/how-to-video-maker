// Audio: TTS preparation and music synth via WebAudio

export async function prepareNarration(script, voice) {
  const enabled = voice !== "off";
  if (!enabled) return { enabled: false, urls: [] };

  const texts = script.segments.map((seg) => {
    if (seg.type === "intro") return seg.subtitle || `How to ${script.topic}`;
    if (seg.type === "outro") return seg.title || "You did it!";
    return seg.narration || seg.text || "";
  });

  const urls = [];
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    if (!t || !t.trim()) {
      urls.push(null);
      continue;
    }
    try {
      const res = await websim.textToSpeech({ text: t, voice });
      urls.push(res.url);
    } catch (e) {
      console.warn("TTS failed on segment", i, e);
      urls.push(null);
    }
  }

  return { enabled: true, urls };
}

export async function makeMusic(ctx, style, durationSec, bpm = 96) {
  const stockMusic = {
    corporate: "https://cdn.pixabay.com/audio/2022/10/24/audio_965ea0053d.mp3",
    cinematic: "https://cdn.pixabay.com/audio/2023/02/20/audio_25b7a302da.mp3",
    acoustic: "https://cdn.pixabay.com/audio/2022/05/27/audio_180aad536a.mp3",
    lofi: "https://cdn.pixabay.com/audio/2022/03/15/audio_c9f2f3e9a6.mp3",
    uplift: "https://cdn.pixabay.com/audio/2021/11/18/audio_0d1c7a5b37.mp3",
    minimal: "https://cdn.pixabay.com/audio/2022/01/20/audio_3c6d1a0c5e.mp3",
  };

  if (stockMusic[style]) {
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    const dest = ctx.createMediaStreamDestination();
    master.connect(dest);
    master.connect(ctx.destination);

    let source = null;
    try {
      const response = await fetch(stockMusic[style]);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.connect(master);
    } catch (e) {
      console.error("Failed to load stock music:", e);
      style = "none"; // Fallback to no music
    }

    if (source) {
      return {
        start() {
          master.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.6);
          source.start(ctx.currentTime);
        },
        stop() {
          try {
            master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
            source.stop(ctx.currentTime + 0.3);
          } catch {}
        },
        destinationNode: dest,
        master,
      };
    }
  }

  if (style === "none") {
    const silent = ctx.createGain();
    silent.gain.value = 0;
    const dest = ctx.createMediaStreamDestination();
    silent.connect(dest);
    silent.connect(ctx.destination);
    return { start() {}, stop() {}, destinationNode: dest, master: silent };
  }

  const master = ctx.createGain();
  master.gain.value = 0.25;
  master.connect(ctx.destination);

  const mix = ctx.createGain();
  mix.connect(master);

  const dest = ctx.createMediaStreamDestination();
  master.connect(dest);

  const scale = [0, 2, 3, 5, 7, 10]; // minor pentatonic
  const base =
    style === "uplift" ? 261.63 : style === "minimal" ? 220 : 246.94; // C4 / A3 / B3
  const beat = 60 / bpm;

  function scheduleTone(t, length, degree, octave = 0, type = "sine", vol = 0.5) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0;
    const freq =
      base * Math.pow(2, octave) * Math.pow(2, scale[degree % scale.length] / 12);
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(mix);

    const a = 0.005,
      d = 0.08,
      s = 0.15,
      rel = 0.15;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.linearRampToValueAtTime(vol * s, t + a + d);
    g.gain.linearRampToValueAtTime(0.0001, t + length + rel);

    osc.start(t);
    osc.stop(t + length + rel + 0.05);
  }

  function scheduleHiHat(t) {
    const bufferSize = 2 * ctx.sampleRate * 0.05;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "highpass";
    bp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.value = 0.15;
    src.connect(bp);
    bp.connect(g);
    g.connect(mix);
    src.start(t);
  }

  const startTime = ctx.currentTime + 0.05;
  const endTime = startTime + durationSec + 0.5;

  let t = startTime;
  let bar = 0;
  while (t < endTime) {
    if (style !== "minimal") {
      scheduleTone(t, 0.1, 0, -2, "sine", 0.7);
    }
    scheduleHiHat(t + beat * 0.5);
    scheduleTone(t + beat * 0.0, beat * 0.95, bar % 6, 0, "triangle", 0.25);
    scheduleTone(t + beat * 0.5, beat * 0.95, (bar + 3) % 6, 0, "triangle", 0.22);

    t += beat;
    bar++;
  }

  return {
    start() {},
    stop() {
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    },
    destinationNode: dest,
    master,
  };
}