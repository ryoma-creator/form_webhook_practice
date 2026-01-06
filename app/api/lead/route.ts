import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zod schema definition
const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, "")) // Remove non-digits
    .refine((val) => val.length >= 7, "Phone number must be at least 7 digits"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validationResult = leadSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.errors[0]?.message || "Validation error";
      return NextResponse.json(
        { ok: false, error: errorMessage },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Get webhook URL from environment variables (server-side only)
    const webhookUrl = process.env.WEBHOOK_URL;

    console.log("process.env.WEBHOOK_URL:", webhookUrl);

    if (!webhookUrl) {
      return NextResponse.json(
        { ok: false, error: "Webhook URL is not configured" },
        { status: 500 }
      );
    }

    // Forward to Make webhook
    const payload = {
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
    };

    console.log("Outgoing webhook URL:", webhookUrl);
    console.log("Payload:", payload);

    let webhookResponse;
    try {
      webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        {
          ok: false,
          error: `Failed to connect to webhook: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`,
        },
        { status: 502 }
      );
    }

    // Get response body
    const responseText = await webhookResponse.text().catch(() => "");
    const responseStatus = webhookResponse.status;

    if (!webhookResponse.ok) {
      console.log("Webhook response status:", responseStatus);
      console.log("Webhook response body:", responseText);

      // Special handling for 410 error with "There is no scenario listening"
      if (responseStatus === 410 && responseText.includes("There is no scenario listening")) {
        return NextResponse.json(
          {
            ok: false,
            error: "Make scenario is not listening. Click Save, then Run once in Make, then retry.",
          },
          { status: 502 }
        );
      }

      const errorPreview = responseText.substring(0, 200);
      const errorMessage = `Failed to send to webhook (Status: ${responseStatus})${errorPreview ? ` - ${errorPreview}` : ""}`;
      console.error("Webhook error:", responseStatus, responseText);
      return NextResponse.json(
        {
          ok: false,
          error: errorMessage,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error occurred" },
      { status: 500 }
    );
  }
}

