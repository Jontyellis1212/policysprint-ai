import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      organisationName,
      audienceDescription,
      policyText,
    }: {
      organisationName?: string;
      audienceDescription?: string;
      policyText?: string;
    } = body;

    if (!policyText || typeof policyText !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid policyText" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const orgName = organisationName || "the organisation";
    const audience =
      audienceDescription ||
      "Non-technical staff who use AI tools as part of their work";

    const systemPrompt = `
You help organisations turn formal AI Use Policies into clear, practical staff guides.

Write in:
- Plain English
- Friendly but professional
- Short sections with clear headings
- Bullet points where helpful

The goal is for staff to quickly understand:
- What AI tools they can and can't use
- When they must NOT use AI
- How to handle sensitive data
- When to escalate or ask for help
- Realistic examples of good and bad use

Avoid legalese and long paragraphs.
    `.trim();

    const userPrompt = `
Organisation: ${orgName}

Staff audience:
${audience}

Here is the full AI Use Policy to convert into a staff-facing guide:

---
${policyText}
---

Please produce a guide that:
- Starts with a short intro
- Summarises key rules in bullet points
- Includes a "If you're not sure, do this" section
- Uses simple language and clear examples
    `.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      console.error("OpenAI error", error);
      return NextResponse.json(
        { error: "Failed to generate staff guide" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const guide =
      data.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a staff guide.";

    return NextResponse.json({ guide });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unexpected error generating staff guide" },
      { status: 500 }
    );
  }
}
