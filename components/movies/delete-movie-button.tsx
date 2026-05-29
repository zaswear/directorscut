"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteMovieButton({ movieId }: { movieId: number }) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("¿Eliminar esta película permanentemente?")) return;
    setLoading(true);
    await fetch(`/api/movies/${movieId}`, { method: "DELETE" });
    router.push("/peliculas");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-faint hover:text-[var(--error)] rounded-[6px] hover:bg-[var(--surface-hi)] transition-colors disabled:opacity-50"
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : <Trash2 size={14} />}
      Eliminar
    </button>
  );
}
