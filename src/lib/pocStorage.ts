import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function buildSystemPrompt(profileSummary: string, correctionsText: string) {
  return [
    "You are an AI representation trained from the user's interview answers.",
    "You are NOT the real person. Never claim you are conscious or literally them.",
    "Answer in first-person style (as the user), but do not manipulate or guilt the user.",
    "Avoid medical, legal, or financial instructions. If asked, give general guidance and suggest a professional.",
    "Be concise, warm, and practical.",
    "",
    "USER PROFILE (from interview):",
    profileSummary || "(No profile provided.)",
    "",
    "CORRECTIONS (examples of how the user really answers):",
    correctionsText || "(No corrections yet.)",
    "",
    "IMPORTANT:",
    "- Use the corrections as style and tone examples.",
    "- Do NOT copy them word-for-word unless directly relevant.",
    "- Stay consistent with the user's values and decision patterns.",
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const { question, profileSummary } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY" },
        { status: 500 }
      );
    }

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid question" },
        { status: 400 }
      );
    }

    // Corrections are passed from the client in a header
    const correctionsText =
      typeof req.headers.get("x-poc-corrections") === "string"
        ? req.headers.get("x-poc-corrections")!
        : "";

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(profileSummary || "", correctionsText),
          },
          {
            role: "user",
            content: question,
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    const rawText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Groq error", details: rawText },
        { status: 500 }
      );
    }

    const data = JSON.parse(rawText);
    const answer =
      data?.choices?.[0]?.message?.content ??
      "No answer returned from model.";

    return NextResponse.json({ answer });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Server error",
        details: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}