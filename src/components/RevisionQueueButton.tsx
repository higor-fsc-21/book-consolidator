"use client";

import { useState, useTransition } from "react";
import { rebuildRevisionQueueAction } from "@/app/actions/revisions";

export function RevisionQueueButton({ bookCount }: { bookCount: number }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleRebuild = () => {
    if (bookCount === 0) {
      setMessage("Nenhum livro concluído está aguardando revisão.");
      return;
    }

    if (!window.confirm("Reorganizar todas as revisões em uma fila diária?")) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await rebuildRevisionQueueAction();
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setMessage(
        result.data?.length === 1
          ? "Sua próxima revisão está organizada."
          : `${result.data?.length ?? 0} revisões foram organizadas em sequência.`,
      );
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleRebuild}
        disabled={isPending}
        className="text-xs px-4 py-2 rounded-lg border border-[#c4c6cd] text-[#43474d] font-[600] hover:bg-white disabled:opacity-50"
      >
        {isPending ? "Organizando..." : "Reorganizar revisões"}
      </button>
      {message && (
        <span className="text-[11px] text-[#74777d]" role="status">
          {message}
        </span>
      )}
    </div>
  );
}
