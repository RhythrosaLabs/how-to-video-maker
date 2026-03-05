// LLM-powered and local script generation
import { secondsToTimestamp } from "/utils.js";

function pickEmojisForTopic(topic) {
  const map = [
    [/coffee|brew|espresso|pour[- ]?over/i, "☕️"],
    [/video|filmmak|camera/i, "🎥"],
    [/code|program|javascript|html|css/i, "💻"],
    [/fitness|workout|exercise/i, "💪"],
    [/bake|cook|kitchen|recipe/i, "🍳"],
    [/garden|plant|soil/i, "🌱"],
    [/clean|organize/i, "🧽"],
    [/paint|draw|art/i, "🎨"],
    [/music|guitar|piano/i, "🎵"],
    [/photo|edit/i, "📷"],
  ];
  for (const [re, emo] of map) if (re.test(topic)) return emo;
  return "🛠️";
}

function autoSteps(topic, count) {
  const verbs = [
    ["Get set", "🔧"],
    ["Prepare", "🧰"],
    ["Set up", "⚙️"],
    ["Do the main action", "✅"],
    ["Refine", "✨"],
    ["Check", "🔍"],
    ["Test", "🧪"],
    ["Finish", "🏁"],
    ["Share", "📤"],
  ];
  const pairs = [];
  for (let i = 0; i < count; i++) {
    const [phrase, emoji] = verbs[i % verbs.length];
    pairs.push(`${emoji} ${phrase} for ${topic.toLowerCase()}`);
  }
  return pairs;
}

// New: dynamic intro/outro helper to keep pacing tight
function introOutroFor(total) {
  const intro = Math.max(1.6, Math.min(2.4, total * 0.12));
  const outro = Math.max(1.6, Math.min(2.2, total * 0.10));
  return { introDur: intro, outroDur: outro };
}

export async function generateScriptAI(opts) {
  const { topicInput, audience, tone, stepsUser, stepsCount, emojiMode, duration } = opts;

  const topic = topicInput || "your task";
  const targetCount = stepsCount || 5;

  const system = `You are a seasoned instructional video writer and motion designer.
Return JSON only, matching this schema exactly:
{
  topic: string;
  voiceLine: string; // short hook line in the chosen tone
  segments: Array<{
    type: "intro"|"step"|"outro";
    title?: string;
    subtitle?: string;
    text?: string;
    narration?: string;
    imagePrompt?: string;
    start?: number;
    end?: number;
  }>;
}
Constraints:
- Total duration must be ${duration} seconds with 3-6 steps.
- Keep text punchy, 6-10 words per step for on-screen copy.
- Narration should be natural and helpful.
- If user provided step list, respect content but improve wording.
- For each step, create an \`imagePrompt\` that is HYPER-SPECIFIC to the action or elements in that step's \`text\`. The prompt should describe a clean, focused, photorealistic or cinematic shot.
- DO NOT include text, words, or watermarks in the image prompts.`;

  const user = [
    {
      type: "text",
      text: `Topic: ${topic}
Audience: ${audience || "general"}
Tone: ${tone}
Duration: ${duration} seconds
${
  (stepsUser && stepsUser.length)
    ? `User-provided steps:\n- ${stepsUser.join("\n- ")}`
    : `No steps provided; create exactly ${targetCount} steps.`
}
`,
    },
  ];

  let data;
  try {
    const ai = await websim.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      json: true,
    });
    data = JSON.parse(ai.content);
  } catch (e) {
    return null;
  }

  // Timing assignment (dynamic)
  const total = duration;
  const { introDur, outroDur } = introOutroFor(total);
  const steps = data.segments.filter((s) => s.type === "step");
  const stepDur = (total - introDur - outroDur) / steps.length;
  let t = 0;
  const segments = [];

  const intro =
    data.segments.find((s) => s.type === "intro") || {
      type: "intro",
      title: `How to ${data.topic || topic}`,
      subtitle: audience ? `For ${audience}` : data.voiceLine || "",
    };
  intro.start = t;
  intro.end = t + introDur;
  t += introDur;
  segments.push(intro);

  steps.forEach((s) => {
    s.start = t;
    s.end = t + stepDur;
    t += stepDur;
    segments.push(s);
  });

  const outro =
    data.segments.find((s) => s.type === "outro") || {
      type: "outro",
      title: "You did it!",
      subtitle: `How to ${data.topic || topic}`,
    };
  outro.start = t;
  outro.end = t + outroDur;
  segments.push(outro);

  const emojiBase = pickEmojisForTopic(topic);
  const useEmoji = emojiMode !== "off";

  return {
    topic: data.topic || topic,
    audience,
    tone,
    totalDuration: total,
    segments: segments.map((s, i, arr) => {
      if (s.type === "intro")
        return { ...s, emoji: useEmoji ? emojiBase : "" };
      if (s.type === "outro")
        return {
          ...s,
          emoji: useEmoji ? "🎉" : "",
          subtitle: `${s.subtitle || ""} • ${secondsToTimestamp(total)}`.trim(),
        };
      const idx = arr.filter((x) => x.type === "step").indexOf(s) + 1;
      const totalSteps = arr.filter((x) => x.type === "step").length;
      return {
        ...s,
        index: idx,
        total: totalSteps,
        text: s.text || s.narration || "Do the key action",
      };
    }),
  };
}

export function generateScriptLocal(opts) {
  const { topicInput, audience, tone, stepsText, stepsCount, emojiMode, duration } = opts;
  const topic = topicInput || "your task";
  const stepLines = stepsText?.trim().length
    ? stepsText
        .split("\n")
        .map((s) => s.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean)
    : autoSteps(topic, stepsCount || 5);

  const steps = stepLines.slice(0, 8).slice(0, stepsCount || 5);
  const total = duration;
  const { introDur: intro, outroDur: outro } = introOutroFor(total);
  const mid = total - intro - outro;
  const perStep = mid / steps.length;

  const emojiBase = pickEmojisForTopic(topic);
  const useEmoji = emojiMode !== "off";

  const voiceLine = (t) => {
    switch (t) {
      case "friendly":
        return "Let's do this together!";
      case "energetic":
        return "Ready? Let's go!";
      case "calm":
        return "Follow along at your own pace.";
      default:
        return "Here's how it works.";
    }
  };

  const segments = [];
  let t = 0;

  segments.push({
    type: "intro",
    start: t,
    end: t + intro,
    title: `How to ${topic}`,
    subtitle: audience ? `For ${audience}` : voiceLine(tone),
    imagePrompt: `${topic} clean studio background, soft lighting, depth of field, no text`,
    emoji: useEmoji ? emojiBase : "",
  });
  t += intro;

  steps.forEach((line, i) => {
    segments.push({
      type: "step",
      start: t,
      end: t + perStep,
      index: i + 1,
      total: steps.length,
      text:
        useEmoji && emojiMode !== "off"
          ? line
          : line.replace(/^[^\w\s]/, "").trim(),
      narration: line.replace(/^[^\w\s]/, "").trim(),
      imagePrompt: `${topic}, step ${i + 1}, close-up, practical action, clean composition, no text`,
      emoji: "",
    });
    t += perStep;
  });

  segments.push({
    type: "outro",
    start: t,
    end: t + outro,
    title: "You did it!",
    subtitle: `How to ${topic} • ${secondsToTimestamp(total)}`,
    imagePrompt: `celebration confetti bokeh, abstract, tasteful, no text`,
    emoji: useEmoji ? "🎉" : "",
  });

  return {
    topic,
    audience,
    tone,
    totalDuration: total,
    segments,
    stepsCount: steps.length,
  };
}