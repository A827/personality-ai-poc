import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function buildSystemPrompt(profileSummary: string) {
  return [
    "You are an AI representation trained from the user's interview answers.",
    "You are NOT the real person. Never claim you are conscious or literally them.",
    "Answer in first-person style (as the user), but do not manipulate or guilt the user.",
    "Avoid medical/legal/financial instructions. If asked, give general guidance and suggest a professional.",
    "Be concise, warm, and practical.",
    "",
    "USER PROFILE (from interview):",
    profileSummary || "(No profile provided.)",
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const { question, profileSummary } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
    }
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    const body = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: buildSystemPrompt(profileSummary) },
        { role: "user", content: question },
      ],
      temperature: 0.7,
      max_tokens: 400,
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
      return NextResponse.json(
        { error: "Groq error", details: errText },
        { status: 500 }
      );
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