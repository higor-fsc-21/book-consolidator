"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { rebuildRevisionQueueForUser } from "@/domain/services/revisionQueue";
import { booksTag } from "@/lib/cache-tags";
import { logger } from "@/lib/logger";
import type { ActionResult } from "@/lib/validators";

export async function rebuildRevisionQueueAction(): Promise<
  ActionResult<
    Array<{
      bookId: string;
      revisionDate: Date;
    }>
  >
> {
  const user = await getCurrentUser();

  try {
    const queue = await rebuildRevisionQueueForUser(user.id);
    logger.info("revision.queue.rebuilt", {
      userId: user.id,
      bookCount: queue.length,
    });
    revalidateTag(booksTag(user.id));
    revalidatePath("/");
    revalidatePath("/biblioteca");
    return { success: true, data: queue };
  } catch (error) {
    logger.error("revision.queue.rebuild_failed", error, {
      userId: user.id,
    });
    return { success: false, error: "Erro ao reorganizar revisões" };
  }
}
