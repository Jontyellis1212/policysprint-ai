// app/api/email/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body } = (await req.json().catch(() => ({}))) as {
      to?: string;
      subject?: string;
      body?: string;
    };

    if (!to || typeof to !== "string" || !to.includes("@")) {
      return NextResponse.json(
        { error: "A valid recipient email address is required." },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { error: "Email subject is required." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "string") {
      return NextResponse.json(
        { error: "Email body is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    // Debug log so we can see if env vars are actually present
    console.log("[/api/email] env check:", {
      hasApiKey: !!apiKey,
      hasFrom: !!from,
      from,
    });

    if (!apiKey || !from) {
      return NextResponse.json(
        {
          error:
            "Email service is not configured. Please set RESEND_API_KEY and RESEND_FROM_EMAIL.",
        },
        { status: 500 }
      );
    }

    // If you're using the sandbox sender, Resend prefers plain address
    const cleanFrom = from.includes("onboarding@resend.dev")
      ? "onboarding@resend.dev"
      : from;

    const payload = {
      from: cleanFrom,
      to: [to],
      subject,
      text: body,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({} as any));
    console.log("[/api/email] Resend response:", {
      status: response.status,
      ok: response.ok,
      data,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to send email via Resend." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[/api/email] Unexpected error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}
