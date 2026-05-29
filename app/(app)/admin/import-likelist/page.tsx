import fs from "fs";
import path from "path";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { searchOmdb, getOmdbById, parseOmdbMovie } from "@/lib/omdb";
import { MovieForm } from "@/components/movies/movie-form";
import type { MovieCreateInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

function readTitles(): string[] {
  // Prueba varias rutas para compatibilidad local/Vercel
  const candidates = [
    path.join(process.cwd(), "import_data", "likelist.csv"),
    path.join(process.cwd(), "..", "import_data", "likelist.csv"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, "utf-8")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    }
  }
  return [];
}

interface Props {
  searchParams: Promise<{ idx?: string }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const sp     = await searchParams;
  const titles = readTitles();
  const idx    = Math.max(0, parseInt(sp.idx ?? "0"));
  return { title: titles[idx] ? `Importar: ${titles[idx]}` : "Importar likelist" };
}

export default async function ImportLikelistPage({ searchParams }: Props) {
  const sp      = await searchParams;
  const titles  = readTitles();
  const total   = titles.length;
  const rawIdx  = parseInt(sp.idx ?? "0");
  const idx     = isNaN(rawIdx) ? 0 : Math.max(0, Math.min(rawIdx, total));

  const nextUrl = `/admin/import-likelist?idx=${idx + 1}`;
  const prevUrl = idx > 0 ? `/admin/import-likelist?idx=${idx - 1}` : null;

  // ── CSV vacío ──────────────────────────────────────────────────────────────
  if (total === 0) {
    return (
      <div className="px-8 py-8 flex flex-col items-center justify-center min-h-[60dvh] text-center">
        <AlertCircle size={40} className="text-[var(--error)] mb-4" />
        <h1 className="font-display font-semibold italic text-[28px] text-text mb-2">
          CSV no encontrado
        </h1>
        <p className="text-text-faint text-sm">
          No se encontró <code className="font-mono text-xs bg-[var(--surface)] px-1.5 py-0.5 rounded">import_data/likelist.csv</code>
        </p>
      </div>
    );
  }

  // ── Completado ─────────────────────────────────────────────────────────────
  if (idx >= total) {
    return (
      <div className="px-8 py-8 flex flex-col items-center justify-center min-h-[60dvh] text-center">
        <CheckCircle size={48} className="text-[var(--success)] mb-4" />
        <h1 className="font-display font-semibold italic text-[32px] text-text mb-2">
          Lista completada
        </h1>
        <p className="text-text-faint text-sm mb-6">Has revisado las {total} películas.</p>
        <Link href="/peliculas" className="px-5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-bg text-sm font-medium rounded-[6px] transition-colors">
          Ver mis películas
        </Link>
      </div>
    );
  }

  const title = titles[idx];

  // ── Buscar en OMDb (con manejo de error) ───────────────────────────────────
  let initial: Partial<MovieCreateInput> = { title, status: "vista", myRating: 5 };
  let omdbImdbId: string | null = null;
  let omdbError = false;

  try {
    const results = await searchOmdb(title);
    const best    = results[0] ?? null;
    if (best) {
      omdbImdbId = best.imdbID;
      const detail = await getOmdbById(best.imdbID);
      if (detail) {
        initial = { ...parseOmdbMovie(detail), myRating: 5, status: "vista", watchFormat: null };
      }
    }
  } catch {
    omdbError = true;
  }

  // ── Comprobar duplicado (con manejo de error) ──────────────────────────────
  let existing: { id: number; title: string } | null = null;
  if (omdbImdbId) {
    try {
      const found = await db.movie.findUnique({
        where:  { imdbId: omdbImdbId },
        select: { id: true, title: true },
      });
      existing = found;
    } catch {
      // Si falla la DB, continuamos sin comprobar duplicados
    }
  }

  const pct = Math.round(((idx + 1) / total) * 100);

  return (
    <div>
      {/* ── Cabecera sticky ── */}
      <div className="sticky top-0 z-30 bg-bg border-b border-[var(--border)] px-6 py-3 flex items-center gap-4">
        {prevUrl ? (
          <Link href={prevUrl} className="flex items-center gap-1 text-sm text-text-faint hover:text-text transition-colors flex-shrink-0">
            <ChevronLeft size={15} /> Anterior
          </Link>
        ) : (
          <span className="text-sm text-text-faint opacity-30 flex-shrink-0 flex items-center gap-1">
            <ChevronLeft size={15} /> Anterior
          </span>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-faint font-mono">{idx + 1} / {total} &nbsp;·&nbsp; {pct}%</p>
          </div>
          <div className="h-1 bg-[var(--surface-hi)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <Link href={nextUrl} className="flex items-center gap-1 text-sm text-text-faint hover:text-text transition-colors flex-shrink-0">
          Omitir <ChevronRight size={15} />
        </Link>
      </div>

      {/* ── Avisos ── */}
      <div className="px-8 pt-5 space-y-3">
        {omdbError && (
          <p className="text-sm text-[var(--warning)] bg-[var(--surface)] border border-[var(--warning)]/40 rounded-md px-4 py-2.5">
            OMDb no respondió para &ldquo;{title}&rdquo;. Búscalo manualmente en el formulario.
          </p>
        )}
        {!omdbError && !omdbImdbId && (
          <p className="text-sm text-[var(--warning)] bg-[var(--surface)] border border-[var(--warning)]/40 rounded-md px-4 py-2.5">
            OMDb no encontró &ldquo;{title}&rdquo; automáticamente. Búscalo manualmente.
          </p>
        )}
      </div>

      {/* ── Ya existe ── */}
      {existing ? (
        <div className="px-8 py-6 max-w-2xl">
          <div className="flex items-start gap-3 p-5 rounded-md border border-[var(--success)] bg-[var(--green-dim)] mb-6">
            <CheckCircle size={18} className="text-[var(--success)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text">Ya está en tu colección</p>
              <p className="text-sm text-text-mid mt-1">
                <Link href={`/peliculas/${existing.id}`} className="text-[var(--accent)] hover:underline">
                  Ver ficha de &ldquo;{existing.title}&rdquo;
                </Link>
              </p>
            </div>
          </div>
          <Link href={nextUrl} className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-bg text-sm font-medium rounded-[6px] transition-colors">
            Siguiente <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <MovieForm mode="create" initial={initial} successUrl={nextUrl} />
      )}
    </div>
  );
}
