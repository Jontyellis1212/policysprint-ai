import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      businessName,
      country,
      industry,
      teamSize,
      aiUsageNotes,
      aiUsageTags,
      riskLevel,
      riskPosture,
      whoCanUse,
      approvedToolsText,
      mainConcerns,
    } = body || {};

    const safeBusinessName = businessName || "the organisation";
    const safeIndustry = industry || "general business";
    const safeCountry = country || "the relevant jurisdiction";

    const usageTagsText =
      Array.isArray(aiUsageTags) && aiUsageTags.length > 0
        ? aiUsageTags.join(", ")
        : "not specifically described";

    const concernsText =
      Array.isArray(mainConcerns) && mainConcerns.length > 0
        ? mainConcerns.join(", ")
        : "general misuse, confidentiality and accuracy";

    const whoCanUseLabel =
      whoCanUse === "approvedRoles"
        ? "Only nominated and approved roles may use AI tools for work purposes."
        : whoCanUse === "companyToolsOnly"
        ? "Staff may only use AI tools provided or approved by the organisation."
        : "All staff may use AI tools for work purposes, as long as they follow this policy.";

    const riskLevelLabel =
      riskLevel === "high"
        ? "We handle high-risk or sensitive information (for example: health records, financial data, identification documents or other personal information)."
        : riskLevel === "low"
        ? "We mostly work with public or low-sensitivity information."
        : "We work with a mix of public and moderately sensitive information.";

    const postureLabel =
      riskPosture === "strict"
        ? "The organisation takes a conservative, risk-averse approach to AI use."
        : riskPosture === "open"
        ? "The organisation is generally open to the use of AI tools, within sensible guardrails."
        : "The organisation aims for a balanced approach – encouraging useful AI adoption while managing key risks.";

    const toolsText =
      approvedToolsText && approvedToolsText.trim().length > 0
        ? approvedToolsText.trim()
        : "The organisation may approve specific AI tools from time to time. Staff must only use tools that have been explicitly approved.";

    const contextSummary = `
Organisation name: ${safeBusinessName}
Country / region: ${safeCountry}
Industry: ${safeIndustry}
Team size: ${teamSize || "not specified"}
Current AI use (tags): ${usageTagsText}
Current AI use (notes): ${aiUsageNotes || "not described"}
Overall data sensitivity: ${riskLevelLabel}
Overall AI posture: ${postureLabel}
Who can use AI: ${whoCanUseLabel}
Approved tools description: ${toolsText}
Main concerns: ${concernsText}
    `.trim();

    const userPrompt = `
Using the organisation details below, draft a clear, practical **AI Use Policy** for staff.

The policy is for: ${safeBusinessName} (${safeIndustry}) in ${safeCountry}.

CONTEXT
${contextSummary}

REQUIREMENTS FOR THE POLICY TEXT

- Write in plain English that a non-technical staff member can understand.
- Assume this is an internal policy for staff, not for customers.
- The organisation is small to medium sized (SME style), not a large enterprise.
- The policy must be a SINGLE coherent document, ready to paste into a Word / Google Docs template.

STRUCTURE
Use clear numbered headings like:

1. Purpose
2. Scope and who this policy applies to
3. Approved AI tools and use cases
4. Prohibited uses of AI
5. Data privacy, confidentiality and security
6. Accuracy, review and human oversight
7. Intellectual property and copyright
8. Transparency and communication
9. Roles, responsibilities and reporting concerns
10. Training, review and updates

You can rename or slightly adjust headings if needed, but keep it around 8–12 sections.

TONE AND STRICTNESS

- If data sensitivity is HIGH, be stricter about:
  - NO entry of personal, health, financial or identifying information into public AI tools.
  - Requiring approval for new tools.
  - Extra care with regulatory / legal obligations.
- If data sensitivity is LOW, you can be a little more flexible, but still insist on:
  - No confidential or commercially sensitive information in public tools.
  - Human review of any AI-generated content before it is sent externally.
- If posture is STRICT, emphasise limits, approvals and compliance.
- If posture is OPEN, emphasise experimentation WITH guardrails.
- If posture is BALANCED, keep it in the middle.

TAILORING TO THIS BUSINESS

- Mention the industry (${safeIndustry}) in examples.
- Refer to the size (e.g. “our clinic”, “our practice”, “our team”) rather than “the corporation”.
- If the concerns include privacy or sensitive data, include strong sections about not entering personal or patient / client information into AI tools.
- If approved tools are described, mention them as examples (without endorsing any specific vendor).

LEGAL DISCLAIMER (IMPORTANT)

- At the END of the document, include a short disclaimer paragraph that clearly states:
  - This policy is a general template generated with the help of AI.
  - It is NOT legal advice.
  - The organisation must have the policy reviewed and adapted by a qualified lawyer or compliance professional in ${safeCountry} before relying on it.

FORMATTING

- Return ONLY the policy text.
- Do NOT include markdown formatting, asterisks or bullet syntax like "- " or "* " – instead, just use plain text paragraphs and numbered / lettered lists.
- Make the policy sound like a real document a manager would hand to staff.
    `.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are a specialist in workplace AI governance for small and medium organisations. You draft clear, practical AI Use Policies as general templates. You are NOT a lawyer and you do NOT provide legal advice.",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const fullText =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "AI Use Policy draft could not be generated.";

    return NextResponse.json({
      success: true,
      fullText,
    });
  } catch (error) {
    console.error("Error in /api/generate:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error generating policy draft.",
      },
      { status: 500 }
    );
  }
}
