import { NextRequest, NextResponse } from "next/server";
import { sendDueRevisionNotifications } from "@/domain/services/notifications";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendDueRevisionNotifications();
    logger.info("notification.cron.completed", { ...result });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("notification.cron.failed", error);
    return NextResponse.json(
      { error: "Erro ao processar lembretes" },
      { status: 500 },
    );
  }
}
