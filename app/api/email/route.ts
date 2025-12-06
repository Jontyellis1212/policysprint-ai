// app/api/email/route.ts
import { NextRequest, NextResponse } from "next/server";

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

    if (!apiKey || !from) {
      console.error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL env vars");
      return NextResponse.json(
        {
          error:
            "Email service is not configured. Please set RESEND_API_KEY and RESEND_FROM_EMAIL.",
        },
        { status: 500 }
      );
    }

    const payload = {
      from, // e.g. "PolicySprint <no-reply@yourdomain.com>"
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

    if (!response.ok) {
      console.error("Resend error", response.status, data);
      return NextResponse.json(
        { error: "Failed to send email via Resend." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email route error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
