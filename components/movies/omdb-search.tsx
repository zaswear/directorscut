"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import type { OmdbSearchResult } from "@/lib/omdb";
import type { MovieCreateInput } from "@/lib/schemas";

interface Props {
  onSelect: (data: Partial<MovieCreateInput>) => void;
}

export function OmdbSearch({ onSelect }: Props) {
  const [query, setQuery]   = useState("");
  const [year, setYear]     = useState("");
  const [results, setResults] = useState<OmdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function search() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setResults([]);

    try {
      // IMDb ID directo — el año no aplica
      if (/^tt\d+$/.test(q)) {
        const res  = await fetch(`/api/omdb/${q}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onSelect(data.parsed as Partial<MovieCreateInput>);
        setQuery("");
        return;
      }

      const params = new URLSearchParams({ q });
      const y = year.trim();
      if (/^\d{4}$/.test(y)) params.set("year", y);

      const res  = await fetch(`/api/omdb/search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!Array.isArray(data) || data.length === 0) {
        setError(
          y
            ? `Sin resultados para "${q}" (${y}). Prueba sin filtrar por año.`
            : "Sin resultados. Prueba otro título o un IMDb ID (tt…)."
        );
      } else {
        setResults(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de búsqueda");
    } finally {
      setLoading(false);
    }
  }

  async function selectResult(result: OmdbSearchResult) {
    setLoading(true);
    setResults([]);
    try {
      const res  = await fetch(`/api/omdb/${result.imdbID}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSelect(data.parsed as Partial<MovieCreateInput>);
      setQuery("");
      setYear("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar película");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "bg-[var(--surface)] border border-[var(--border)] rounded-[6px] text-[15px] text-text placeholder:text-text-faint focus:outline-none focus:border-[var(--border-focus)] transition-colors";

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {/* Título / ID */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
            placeholder="Título o IMDb ID (tt…)"
            className={`${inputCls} w-full pl-9 pr-4 py-2.5`}
          />
        </div>

        {/* Año (opcional) */}
        <input
          type="text"
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
          placeholder="Año"
          maxLength={4}
          className={`${inputCls} w-20 px-3 py-2.5 font-mono text-center`}
        />

        {/* Buscar */}
        <button
          type="button"
          onClick={search}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-bg text-sm font-medium rounded-[6px] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Buscar"}
        </button>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}

      {/* Resultados */}
      {results.length > 0 && (
        <ul className="border border-[var(--border)] rounded-[6px] overflow-hidden divide-y divide-[var(--border)] bg-[var(--surface)]">
          {results.map((r) => (
            <li key={r.imdbID}>
              <button
                type="button"
                onClick={() => selectResult(r)}
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-[var(--surface-hi)] transition-colors text-left"
              >
                {r.Poster && r.Poster !== "N/A" ? (
                  <Image
                    src={r.Poster}
                    alt={r.Title}
                    width={32}
                    height={48}
                    className="object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-12 bg-[var(--surface-hi)] rounded flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-display italic text-[15px] font-semibold text-text truncate">
                    {r.Title}
                  </p>
                  <p className="text-xs text-text-faint font-mono">{r.Year} · {r.imdbID}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
