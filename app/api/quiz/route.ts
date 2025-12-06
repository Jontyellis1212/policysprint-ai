// app/api/quiz/route.ts
import { NextRequest, NextResponse } from "next/server";

const MAX_QUESTIONS = 25;

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);

    if (!json || typeof json !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const { policy, policyText, numQuestions } = json as {
      policy?: unknown;
      policyText?: unknown;
      numQuestions?: unknown;
    };

    const finalPolicy =
      typeof policyText === "string" && policyText.trim()
        ? policyText
        : typeof policy === "string" && policy.trim()
        ? policy
        : "";

    if (!finalPolicy) {
      return NextResponse.json(
        { error: "Missing or empty policy text." },
        { status: 400 },
      );
    }

    if (
      typeof numQuestions !== "number" ||
      !Number.isFinite(numQuestions) ||
      numQuestions <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid 'numQuestions' – must be a positive number.",
        },
        { status: 400 },
      );
    }

    if (numQuestions > MAX_QUESTIONS) {
      return NextResponse.json(
        {
          error: `Too many questions requested. Max is ${MAX_QUESTIONS}.`,
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 },
      );
    }

    const prompt = `
You are helping a company train staff on their AI Use Policy.

The policy is below:

---
${finalPolicy}
---

Create ${numQuestions} multiple-choice questions to test understanding of this policy.
For each question:
- Provide 4 possible answers (A, B, C, D).
- Mark the correct answer at the end in the format: "Correct answer: X".

Number the questions clearly.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI error:", response.status, text);
      return NextResponse.json(
        { error: "Error generating quiz questions." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as any;

    const quizText: string | undefined =
      data.output_text ??
      data.output?.[0]?.content?.[0]?.text ??
      data.choices?.[0]?.message?.content;

    if (!quizText) {
      console.error("Unexpected OpenAI response shape:", data);
      return NextResponse.json(
        { error: "Unexpected response from AI." },
        { status: 502 },
      );
    }

    return NextResponse.json({ quiz: quizText });
  } catch (err) {
    console.error("Quiz route error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
