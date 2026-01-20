import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- response helpers ----------
function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

function fail(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

async function requireUserId() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return { ok: false as const, res: fail("UNAUTHORIZED", "Unauthorized", 401) };
  return { ok: true as const, userId };
}

type Body = {
  organisationName?: string;
  audienceDescription?: string;
  policyText?: string;
};

export async function POST(req: NextRequest) {
  // 1) Must be signed in
  const u = await requireUserId();
  if (!u.ok) return u.res;

  // 2) Validate body
  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    return fail("BAD_REQUEST", "Invalid JSON body", 400);
  }

  const { organisationName, audienceDescription, policyText } = body ?? {};
  if (!policyText || typeof policyText !== "string") {
    return fail("BAD_REQUEST", "Missing or invalid policyText", 400);
  }

  // 3) Env
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fail("SERVER_MISCONFIG", "OPENAI_API_KEY is not configured on the server.", 500);
  }

  const orgName = organisationName || "the organisation";
  const audience =
    audienceDescription || "Non-technical staff who use AI tools as part of their work";

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

  // 4) Call OpenAI
  try {
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
      console.error("[staff-guide] OpenAI error", error);
      return fail("OPENAI_ERROR", "Failed to generate staff guide", 500, { upstream: error });
    }

    const data = await response.json();
    const guide =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a staff guide.";

    return ok({ guide });
  } catch (err: any) {
    console.error("[staff-guide] Unexpected error", err);
    return fail("INTERNAL_ERROR", "Unexpected error generating staff guide", 500, {
      detail: err?.message ?? String(err),
    });
  }
}

export async function GET() {
  return fail("METHOD_NOT_ALLOWED", "Method Not Allowed", 405);
}
