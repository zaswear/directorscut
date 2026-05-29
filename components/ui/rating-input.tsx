"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value?:    number | null;
  onChange?: (v: number | null) => void;
  className?: string;
}

export function RatingInput({ value, onChange, className }: Props) {
  const [raw, setRaw] = useState(value != null ? String(value) : "");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const s = e.target.value;
    setRaw(s);
    if (s === "" || s === "-") { onChange?.(null); return; }
    const n = parseFloat(s);
    if (!isNaN(n) && n >= 0 && n <= 10) onChange?.(Math.round(n * 10) / 10);
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        type="number"
        min={0}
        max={10}
        step={0.1}
        value={raw}
        onChange={handleChange}
        placeholder="—"
        className="w-20 bg-[var(--surface)] border border-[var(--border)] rounded-[6px] px-3 py-2 text-[15px] font-mono text-[var(--accent)] placeholder:text-text-faint focus:outline-none focus:border-[var(--border-focus)] transition-colors"
      />
      <span className="text-xs text-text-faint">de 10</span>
    </div>
  );
}
