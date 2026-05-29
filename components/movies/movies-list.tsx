"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MovieItem } from "@/lib/movie-item";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type SortKey   = "createdAt" | "watchedAt" | "myRating" | "imdbRating" | "title" | "year";
type SortOrder = "asc" | "desc";
type ViewMode  = "grid" | "list";

interface Filters {
  search:          string;
  status:          string;
  genre:           string;
  year:            string;
  director:        string;
  hasImdbReview:   string;   // "all" | "yes" | "no"
  importedFromImdb: string;  // "all" | "yes" | "no"
  sortKey:         SortKey;
  sortOrder:       SortOrder;
  view:            ViewMode;
  page:            number;
}

const GRID_PAGE  = 24;
const LIST_PAGE  = 50;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "createdAt",  label: "Fecha de entrada" },
  { value: "watchedAt",  label: "Fecha de visionado" },
  { value: "myRating",   label: "Mi puntuación" },
  { value: "imdbRating", label: "Puntuación IMDb" },
  { value: "title",      label: "Título" },
  { value: "year",       label: "Año" },
];

const STATUS_OPTIONS = [
  { value: "",           label: "Todos los estados" },
  { value: "vista",      label: "Vista" },
  { value: "pendiente",  label: "Pendiente" },
  { value: "en_progreso",label: "En progreso" },
  { value: "descartada", label: "Descartada" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function fmtYear(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).getFullYear().toString();
}

const STATUS_LABEL: Record<string, string> = {
  vista: "Vista", pendiente: "Pendiente", en_progreso: "En progreso", descartada: "Descartada",
};
const STATUS_COLOR: Record<string, string> = {
  vista: "var(--success)", pendiente: "var(--text-faint)", en_progreso: "var(--warning)", descartada: "var(--error)",
};

// ─── Filtrado y ordenación ───────────────────────────────────────────────────

function applyFilters(movies: MovieItem[], f: Filters): MovieItem[] {
  let list = movies;

  if (f.search) {
    const q = f.search.toLowerCase();
    list = list.filter((m) =>
      m.title.toLowerCase().includes(q) ||
      (m.originalTitle ?? "").toLowerCase().includes(q) ||
      m.directors.some((d) => d.toLowerCase().includes(q))
    );
  }
  if (f.status)          list = list.filter((m) => m.status === f.status);
  if (f.genre)           list = list.filter((m) => m.genres.includes(f.genre));
  if (f.year)            list = list.filter((m) => m.year === parseInt(f.year));
  if (f.director)        list = list.filter((m) => m.directors.some((d) => d.toLowerCase().includes(f.director.toLowerCase())));
  if (f.hasImdbReview === "yes") list = list.filter((m) =>  m.hasImdbReview);
  if (f.hasImdbReview === "no")  list = list.filter((m) => !m.hasImdbReview);
  if (f.importedFromImdb === "yes") list = list.filter((m) =>  m.importedFromImdb);
  if (f.importedFromImdb === "no")  list = list.filter((m) => !m.importedFromImdb);

  // Sort
  const mult = f.sortOrder === "asc" ? 1 : -1;
  list = [...list].sort((a, b) => {
    switch (f.sortKey) {
      case "myRating":   return mult * ((a.myRating ?? -1) - (b.myRating ?? -1));
      case "imdbRating": return mult * ((a.imdbRating ?? 0) - (b.imdbRating ?? 0));
      case "year":       return mult * ((a.year ?? 0) - (b.year ?? 0));
      case "title":      return mult * a.title.localeCompare(b.title, "es");
      case "watchedAt":  return mult * ((a.watchedAt ? new Date(a.watchedAt).getTime() : 0) - (b.watchedAt ? new Date(b.watchedAt).getTime() : 0));
      default:           return mult * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  });

  return list;
}

// ─── Componente principal ────────────────────────────────────────────────────

export function MoviesList({ movies }: { movies: MovieItem[] }) {
  const [filters, setFilters] = useState<Filters>({
    search: "", status: "", genre: "", year: "", director: "",
    hasImdbReview: "all", importedFromImdb: "all",
    sortKey: "createdAt", sortOrder: "desc", view: "grid", page: 1,
  });
  const [showFilters, setShowFilters] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Opciones de filtro derivadas del dataset
  const genres = useMemo(() => {
    const seen: Record<string, boolean> = {};
    movies.forEach((m) => m.genres.forEach((g) => { seen[g] = true; }));
    return Object.keys(seen).sort();
  }, [movies]);

  const years = useMemo(() => {
    const seen: Record<number, boolean> = {};
    movies.forEach((m) => { if (m.year) seen[m.year] = true; });
    return Object.keys(seen).map(Number).sort((a, b) => b - a);
  }, [movies]);

  const set = useCallback(<K extends keyof Filters>(key: K, val: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: val, page: 1 }));
  }, []);

  function onSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => set("search", v), 180);
  }

  const filtered  = useMemo(() => applyFilters(movies, filters), [movies, filters]);
  const pageSize  = filters.view === "grid" ? GRID_PAGE : LIST_PAGE;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page      = Math.min(filters.page, pageCount);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const hasActiveFilters =
    filters.status || filters.genre || filters.year || filters.director ||
    filters.hasImdbReview !== "all" || filters.importedFromImdb !== "all";

  function clearFilters() {
    setFilters((prev) => ({
      ...prev,
      status: "", genre: "", year: "", director: "",
      hasImdbReview: "all", importedFromImdb: "all", page: 1,
    }));
  }

  // ── Shared Select style ──
  const selectCls = "bg-[var(--surface)] border border-[var(--border)] rounded-[6px] px-2.5 py-1.5 text-sm text-text focus:outline-none focus:border-[var(--border-focus)] transition-colors";
  const inputCls  = "bg-[var(--surface)] border border-[var(--border)] rounded-[6px] px-3 py-1.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-[var(--border-focus)] transition-colors";

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-[var(--border)] flex-shrink-0 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            type="search"
            defaultValue={filters.search}
            onChange={onSearch}
            placeholder="Buscar título, director…"
            className={cn(inputCls, "pl-8 w-full")}
          />
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-[6px] border transition-colors",
            showFilters || hasActiveFilters
              ? "border-[var(--border-focus)] text-[var(--accent)] bg-[var(--accent-dim)]"
              : "border-[var(--border)] text-text-mid hover:text-text hover:border-[var(--border-hi)]"
          )}
        >
          <SlidersHorizontal size={13} />
          Filtros
          {hasActiveFilters && (
            <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-text-faint hover:text-[var(--error)] transition-colors"
          >
            <X size={11} /> Limpiar
          </button>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Sort */}
          <select
            value={filters.sortKey}
            onChange={(e) => set("sortKey", e.target.value as SortKey)}
            className={selectCls}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Sort direction */}
          <button
            onClick={() => set("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")}
            className="p-1.5 rounded-[6px] border border-[var(--border)] text-text-mid hover:text-text hover:border-[var(--border-hi)] transition-colors"
            title={filters.sortOrder === "asc" ? "Ascendente" : "Descendente"}
          >
            <ArrowUpDown size={14} className={filters.sortOrder === "asc" ? "" : "rotate-180"} />
          </button>

          {/* View toggle */}
          <div className="flex border border-[var(--border)] rounded-[6px] overflow-hidden">
            {(["grid", "list"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => set("view", v)}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium transition-colors",
                  filters.view === v
                    ? "bg-[var(--accent)] text-bg"
                    : "text-text-mid hover:text-text hover:bg-[var(--surface-hi)]"
                )}
              >
                {v === "grid" ? "⊞ Grid" : "☰ Lista"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Advanced Filters ── */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 px-6 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
          <select value={filters.status} onChange={(e) => set("status", e.target.value)} className={selectCls}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={filters.genre} onChange={(e) => set("genre", e.target.value)} className={selectCls}>
            <option value="">Todos los géneros</option>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>

          <select value={filters.year} onChange={(e) => set("year", e.target.value)} className={selectCls}>
            <option value="">Todos los años</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <input
            type="text"
            value={filters.director}
            onChange={(e) => set("director", e.target.value)}
            placeholder="Director…"
            className={cn(inputCls, "w-40")}
          />

          <select value={filters.hasImdbReview} onChange={(e) => set("hasImdbReview", e.target.value)} className={selectCls}>
            <option value="all">Crítica IMDb: todas</option>
            <option value="yes">Con crítica IMDb</option>
            <option value="no">Sin crítica IMDb</option>
          </select>

          <select value={filters.importedFromImdb} onChange={(e) => set("importedFromImdb", e.target.value)} className={selectCls}>
            <option value="all">Origen: todas</option>
            <option value="yes">Importadas de IMDb</option>
            <option value="no">Añadidas manualmente</option>
          </select>
        </div>
      )}

      {/* ── Results count ── */}
      <div className="px-6 py-2 flex-shrink-0">
        <p className="text-xs text-text-faint font-mono">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          {movies.length !== filtered.length && ` de ${movies.length}`}
        </p>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-text-faint text-sm">Sin resultados para los filtros actuales.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-[var(--accent)] text-sm hover:underline">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : filters.view === "grid" ? (
          <GridView movies={paginated} />
        ) : (
          <ListView movies={paginated} />
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => set("page", page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-[6px] border border-[var(--border)] text-text-mid hover:text-text disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 2)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="text-text-faint text-sm px-1">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => set("page", p as number)}
                    className={cn(
                      "w-8 h-8 text-sm rounded-[6px] transition-colors font-mono",
                      p === page
                        ? "bg-[var(--accent)] text-bg"
                        : "border border-[var(--border)] text-text-mid hover:text-text hover:border-[var(--border-hi)]"
                    )}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => set("page", page + 1)}
              disabled={page >= pageCount}
              className="p-1.5 rounded-[6px] border border-[var(--border)] text-text-mid hover:text-text disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Grid view ───────────────────────────────────────────────────────────────

function GridView({ movies }: { movies: MovieItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
      {movies.map((m) => (
        <Link key={m.id} href={`/peliculas/${m.id}`} className="group block">
          <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-[var(--surface)] shadow-card mb-2.5 transition-shadow group-hover:shadow-raised">
            {m.posterUrl ? (
              <Image
                src={m.posterUrl}
                alt={m.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-3">
                <span
                  className="text-center text-sm italic text-text-faint leading-tight"
                >
                  {m.title}
                </span>
              </div>
            )}

            {m.myRating != null && (
              <div className="absolute top-1.5 right-1.5 bg-[var(--accent)] text-bg text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-sm leading-none">
                {m.myRating}
              </div>
            )}

            {m.status && m.status !== "vista" && (
              <div
                className="absolute bottom-0 left-0 right-0 text-[10px] text-center py-0.5 font-medium"
                style={{ background: "oklch(0% 0 0 / 70%)", color: STATUS_COLOR[m.status] }}
              >
                {STATUS_LABEL[m.status]}
              </div>
            )}
          </div>

          <p
            className="font-display text-[13px] leading-tight truncate italic text-text group-hover:text-[var(--accent)] transition-colors"
          >
            {m.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {m.year && <span className="text-[11px] text-text-faint font-mono">{m.year}</span>}
            {m.watchedAt && (
              <span className="text-[10px] text-text-faint">· {fmtYear(m.watchedAt)}</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── List view ───────────────────────────────────────────────────────────────

function ListView({ movies }: { movies: MovieItem[] }) {
  return (
    <div className="border border-[var(--border)] rounded-md overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
            <th className="w-10" />
            <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-widest text-text-faint font-medium">Película</th>
            <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-widest text-text-faint font-medium w-16">Año</th>
            <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-widest text-text-faint font-medium hidden md:table-cell">Director</th>
            <th className="px-3 py-2.5 text-center text-[11px] uppercase tracking-widest text-text-faint font-medium w-20">Mi nota</th>
            <th className="px-3 py-2.5 text-center text-[11px] uppercase tracking-widest text-text-faint font-medium w-20 hidden sm:table-cell">IMDb</th>
            <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-widest text-text-faint font-medium w-32 hidden lg:table-cell">Vista el</th>
            <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-widest text-text-faint font-medium w-28 hidden xl:table-cell">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {movies.map((m) => (
            <tr key={m.id} className="hover:bg-[var(--surface-hi)] transition-colors">
              {/* Thumbnail */}
              <td className="pl-3 py-2">
                <Link href={`/peliculas/${m.id}`}>
                  <div className="w-8 aspect-[2/3] rounded overflow-hidden bg-[var(--surface-hi)] flex-shrink-0">
                    {m.posterUrl && (
                      <Image src={m.posterUrl} alt={m.title} width={32} height={48} className="object-cover w-full h-full" />
                    )}
                  </div>
                </Link>
              </td>

              {/* Title */}
              <td className="px-3 py-2">
                <Link href={`/peliculas/${m.id}`} className="group">
                  <p
                    className="font-display italic text-text group-hover:text-[var(--accent)] transition-colors truncate max-w-[260px]"
                    style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "15px", fontWeight: 600 }}
                  >
                    {m.title}
                  </p>
                </Link>
              </td>

              {/* Year */}
              <td className="px-3 py-2 font-mono text-text-faint text-xs">{m.year ?? "—"}</td>

              {/* Director */}
              <td className="px-3 py-2 text-text-mid text-xs truncate max-w-[160px] hidden md:table-cell">
                {m.directors.slice(0, 2).join(", ") || "—"}
              </td>

              {/* My rating */}
              <td className="px-3 py-2 text-center">
                {m.myRating != null
                  ? <span className="font-mono text-[var(--accent)] font-bold">{m.myRating}</span>
                  : <span className="text-text-faint">—</span>}
              </td>

              {/* IMDb rating */}
              <td className="px-3 py-2 text-center font-mono text-text-faint text-xs hidden sm:table-cell">
                {m.imdbRating ?? "—"}
              </td>

              {/* Watched at */}
              <td className="px-3 py-2 text-xs text-text-faint hidden lg:table-cell">
                {fmtDate(m.watchedAt)}
              </td>

              {/* Status */}
              <td className="px-3 py-2 hidden xl:table-cell">
                <span
                  className="text-[11px] font-medium"
                  style={{ color: STATUS_COLOR[m.status] }}
                >
                  {STATUS_LABEL[m.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
