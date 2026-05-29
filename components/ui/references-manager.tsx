"use client";

import { useState } from "react";
import { Plus, Trash2, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReferenceInput } from "@/lib/schemas";

interface Props {
  value?:    ReferenceInput[];
  onChange?: (refs: ReferenceInput[]) => void;
  className?: string;
}

export function ReferencesManager({ value = [], onChange, className }: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl]     = useState("");
  const [error, setError] = useState("");

  function add() {
    if (!title.trim()) { setError("El título es obligatorio"); return; }
    try { new URL(url); } catch { setError("URL inválida"); return; }
    setError("");
    onChange?.([...value, { title: title.trim(), url: url.trim() }]);
    setTitle("");
    setUrl("");
  }

  function remove(i: number) {
    onChange?.(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Existing references */}
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((ref, i) => (
            <li key={i} className="flex items-center gap-2 bg-[var(--surface)] rounded-[6px] px-3 py-2">
              <Link size={12} className="text-text-faint flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-text truncate block">{ref.title}</span>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--accent)] truncate block hover:underline"
                >
                  {ref.url}
                </a>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-text-faint hover:text-[var(--error)] transition-colors p-0.5"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add form */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la referencia"
            className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-[6px] px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-[var(--border-focus)] transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-[6px] px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-[var(--border-focus)] transition-colors"
          />
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[var(--surface-hi)] text-text-mid hover:text-text rounded-[6px] border border-[var(--border)] hover:border-[var(--border-hi)] transition-colors"
          >
            <Plus size={13} /> Añadir
          </button>
        </div>
        {error && <p className="text-xs text-[var(--error)]">{error}</p>}
      </div>
    </div>
  );
}
