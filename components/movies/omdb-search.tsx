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
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<OmdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function search() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setResults([]);

    try {
      // Detecta si es un IMDb ID
      const isId = /^tt\d+$/.test(q);
      if (isId) {
        const res  = await fetch(`/api/omdb/${q}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onSelect(data.parsed as Partial<MovieCreateInput>);
        setQuery("");
        return;
      }

      const res  = await fetch(`/api/omdb/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!Array.isArray(data) || data.length === 0) {
        setError("Sin resultados. Prueba otro título o un IMDb ID (tt…).");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar película");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
            placeholder="Título de la película o IMDb ID (tt…)"
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[6px] pl-9 pr-4 py-2.5 text-[15px] text-text placeholder:text-text-faint focus:outline-none focus:border-[var(--border-focus)] transition-colors"
          />
        </div>
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

      {/* Results */}
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
                  <p className="text-sm font-medium text-text truncate">{r.Title}</p>
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
