import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zodスキーマ定義
const leadSchema = z.object({
  name: z.string().min(1, "お名前は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, "")) // 数字以外を削除
    .refine((val) => val.length >= 7, "電話番号は7桁以上である必要があります"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Zodでバリデーション
    const validationResult = leadSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.errors[0]?.message || "バリデーションエラー";
      return NextResponse.json(
        { ok: false, error: errorMessage },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Webhook URLを環境変数から取得
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { ok: false, error: "Webhook URLが設定されていません" },
        { status: 500 }
      );
    }

    // Makeのwebhookに転送
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
          error: `Webhookへの接続に失敗しました: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`,
        },
        { status: 502 }
      );
    }

    // レスポンスボディを取得
    const responseText = await webhookResponse.text().catch(() => "");
    const responseStatus = webhookResponse.status;
    
    console.log("Webhook response status:", responseStatus);
    console.log("Webhook response body:", responseText);

    if (!webhookResponse.ok) {
      const errorPreview = responseText.substring(0, 200);
      const errorMessage = `Webhookへの送信に失敗しました (Status: ${responseStatus})${errorPreview ? ` - ${errorPreview}` : ""}`;
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
      { ok: false, error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

