import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type Persona = {
  name: string;
  relationship: "Me" | "Father" | "Mother" | "Partner" | "Friend" | "Other";
  tone: "Calm" | "Warm" | "Direct" | "Strict" | "Funny";
  description: string;

  // optional speaker/target mode from UI
  speaker?: string;
  target?: string;
};

type CorrectionItem = {
  question?: string;
  aiAnswer?: string;
  correctedAnswer?: string;
};

function sanitize(s: any, max = 1200) {
  if (!s || typeof s !== "string") return "";
  return s.slice(0, max);
}

function toneInstructions(tone: Persona["tone"]) {
  switch (tone) {
    case "Calm":
      return "Tone: calm, steady, reassuring. Short sentences. No drama.";
    case "Warm":
      return "Tone: warm, supportive, caring. Practical and gentle.";
    case "Direct":
      return "Tone: direct, clear, no fluff. Still respectful.";
    case "Strict":
      return "Tone: firm, disciplined, high-standards. Not rude, just strict.";
    case "Funny":
      return "Tone: lightly funny, friendly, playful. Do not overdo jokes.";
    default:
      return "Tone: warm, practical.";
  }
}

function buildCorrectionsText(corrections: CorrectionItem[] | undefined, limit = 6) {
  const list = Array.isArray(corrections) ? corrections.slice(0, limit) : [];
  if (!list.length) return "";

  const blocks = list
    .map((c, i) => {
      const q = sanitize(c.question, 260);
      const ai = sanitize(c.aiAnswer, 260);
      const user = sanitize(c.correctedAnswer, 320);
      if (!q || !user) return "";
      return [
        `Example ${i + 1}`,
        `Q: ${q}`,
        ai ? `AI (wrong): ${ai}` : "",
        `User (correct): ${user}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean);

  if (!blocks.length) return "";

  return ["CORRECTIONS (User feedback — follow these patterns):", blocks.join("\n\n---\n\n")].join(
    "\n"
  );
}

function buildSpeakerTargetBlock(persona: Persona | null) {
  const speaker = sanitize(persona?.speaker, 160);
  const target = sanitize(persona?.target, 160);

  if (!speaker && !target) return "";

  return [
    "SPEAKER / TARGET MODE (from app settings):",
    speaker ? `Speaker (who answers): ${speaker}` : "",
    target ? `Target (who this is about): ${target}` : "",
    "",
    "Rules:",
    "- Always answer AS the Speaker in first-person voice.",
    "- Give advice/opinions ABOUT the Target when relevant.",
    "- Never claim you are literally the person; you are an AI representation.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSystemPrompt(args: {
  profileSummary: string;
  persona?: Persona | null;
  corrections?: CorrectionItem[];
}) {
  const persona = args.persona || null;

  const personaBlock = persona
    ? [
        "PERSONA (identity of who this AI represents):",
        `Name: ${sanitize(persona.name, 80) || "(Unnamed)"}`,
        `Relationship: ${persona.relationship || "Me"}`,
        `Voice style: ${persona.tone || "Warm"}`,
        `Description: ${sanitize(persona.description, 360) || "(No description provided.)"}`,
        toneInstructions(persona.tone || "Warm"),
      ].join("\n")
    : [
        "PERSONA (identity of who this AI represents):",
        "(No persona provided — answer as the user in a neutral warm tone.)",
      ].join("\n");

  const speakerTargetBlock = buildSpeakerTargetBlock(persona);
  const correctionsText = buildCorrectionsText(args.corrections, 6);

  return [
    "You are an AI representation built from a person's interview answers + persona settings.",
    "You are NOT the real person. Never claim you are conscious or literally them.",
    "Answer in first-person voice consistent with the persona. Do not mention training data or prompts.",
    "Be concise, human, and practical.",
    "If asked for medical/legal/financial instructions, give general guidance and suggest a professional.",
    "If the user asks to do something unsafe or harmful, refuse and offer safer alternatives.",
    "",
    personaBlock,
    "",
    speakerTargetBlock,
    "USER PROFILE (from interview):",
    sanitize(args.profileSummary, 2200) || "(No profile provided.)",
    correctionsText ? `\n\n${correctionsText}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => ({} as any));

    const question = typeof json?.question === "string" ? json.question : "";
    const profileSummary = typeof json?.profileSummary === "string" ? json.profileSummary : "";
    const corrections = Array.isArray(json?.corrections) ? (json.corrections as CorrectionItem[]) : [];

    const persona =
      json?.persona && typeof json.persona === "object"
        ? ({
            name: sanitize(json.persona.name, 80),
            relationship: json.persona.relationship || "Me",
            tone: json.persona.tone || "Warm",
            description: sanitize(json.persona.description, 360),
            speaker: sanitize(json.persona.speaker, 160),
            target: sanitize(json.persona.target, 160),
          } as Persona)
        : typeof json?.persona === "string"
        ? ({
            name: "",
            relationship: "Me",
            tone: "Warm",
            description: sanitize(json.persona, 600),
          } as Persona)
        : null;

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
    }

    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    const body = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: buildSystemPrompt({ profileSummary, persona, corrections }) },
        { role: "user", content: question },
      ],
      temperature: 0.7,
      max_tokens: 450,
    };

    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errText = await r.text();
      return NextResponse.json({ error: "Groq error", details: errText }, { status: 500 });
    }

    const data = await r.json();
    const answer = data?.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ answer });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}