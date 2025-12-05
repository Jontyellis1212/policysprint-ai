import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// If your other routes use "edge", you can change this to "edge".
// "nodejs" is fine for this route.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const policyText = (body.policyText as string | undefined) ?? "";
    const numQuestionsRaw = body.numQuestions;

    if (!policyText.trim()) {
      return NextResponse.json(
        { error: "Missing policyText in request body." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    // Make sure numQuestions is between 3 and 10
    const parsedNum =
      typeof numQuestionsRaw === "number"
        ? numQuestionsRaw
        : Number(numQuestionsRaw || 5);

    const safeNumQuestions = Math.min(Math.max(parsedNum, 3), 10);

    const prompt = `
You are helping an organisation train staff on its AI Use Policy.

Given the policy text below, create a short multiple-choice quiz to check staff have read and understood the key rules.

Requirements:
- Create exactly ${safeNumQuestions} questions.
- Mix of:
  - "What is allowed?" / "What is not allowed?"
  - Data privacy / confidentiality
  - Use of specific tools (if mentioned)
  - Escalation / who to ask for help
- Each question must have:
  - A question text
  - 3–4 answer options labelled A), B), C), (and D) if needed)
  - Exactly ONE clearly correct answer
- After each question, show the correct answer in a "Correct answer:" line so admins can mark it easily.

Format it in plain text, for example:

Q1. [question...]
A) ...
B) ...
C) ...
Correct answer: B)

Q2. ...

Here is the AI Use Policy:

"""${policyText}"""
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that writes clear, practical training quizzes based on company policies.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textOutput = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!textOutput) {
      return NextResponse.json(
        { error: "No quiz text returned from model." },
        { status: 500 }
      );
    }

    return NextResponse.json({ quiz: textOutput });
  } catch (err: any) {
    console.error("Error in /api/quiz:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Unexpected error while generating quiz. Please try again.",
      },
      { status: 500 }
    );
  }
}

