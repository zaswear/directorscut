import fs from "fs";
import path from "path";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { db } from "@/lib/db";
import { searchOmdb, getOmdbById, parseOmdbMovie } from "@/lib/omdb";
import { MovieForm } from "@/components/movies/movie-form";
import type { MovieCreateInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

function readTitles(): string[] {
  const csvPath = path.join(process.cwd(), "import_data", "likelist.csv");
  if (!fs.existsSync(csvPath)) return [];
  return fs.readFileSync(csvPath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function generateMetadata({ searchParams }: Props) {
  const titles = readTitles();
  const idx    = Math.max(0, parseInt((await searchParams).idx ?? "0"));
  return { title: titles[idx] ? `Importar: ${titles[idx]}` : "Importar likelist" };
}

interface Props {
  searchParams: Promise<{ idx?: string }>;
}

export default async function ImportLikelistPage({ searchParams }: Props) {
  const titles  = readTitles();
  const total   = titles.length;
  const rawIdx  = parseInt((await searchParams).idx ?? "0");
  const idx     = Math.max(0, Math.min(rawIdx, total));

  // ── Completado ──
  if (idx >= total) {
    return (
      <div className="px-8 py-8 flex flex-col items-center justify-center min-h-[60dvh] text-center">
        <CheckCircle size={48} className="text-[var(--success)] mb-4" />
        <h1 className="font-display font-semibold italic text-[32px] text-text mb-2">
          Lista completada
        </h1>
        <p className="text-text-faint text-sm mb-6">Has revisado las {total} películas de la lista.</p>
        <Link href="/peliculas" className="px-5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-bg text-sm font-medium rounded-[6px] transition-colors">
          Ver mis películas
        </Link>
      </div>
    );
  }

  const title    = titles[idx];
  const nextUrl  = `/admin/import-likelist?idx=${idx + 1}`;
  const prevUrl  = idx > 0 ? `/admin/import-likelist?idx=${idx - 1}` : null;

  // ── Buscar en OMDb ──
  const results   = await searchOmdb(title);
  const best      = results[0] ?? null;
  const omdbDetail = best ? await getOmdbById(best.imdbID) : null;

  // ── Comprobar si ya existe en DB ──
  const existing = omdbDetail
    ? await db.movie.findUnique({ where: { imdbId: omdbDetail.imdbID } })
    : null;

  // ── Datos pre-rellenados ──
  const initial: Partial<MovieCreateInput> = omdbDetail
    ? {
        ...parseOmdbMovie(omdbDetail),
        myRating:  5,
        status:    "vista",
        watchFormat: null,
      }
    : { title, status: "vista", myRating: 5 };

  return (
    <div>
      {/* ── Cabecera del wizard ── */}
      <div className="sticky top-0 z-30 bg-bg border-b border-[var(--border)] px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {prevUrl ? (
            <Link href={prevUrl} className="flex items-center gap-1 text-sm text-text-faint hover:text-text transition-colors flex-shrink-0">
              <ChevronLeft size={16} /> Anterior
            </Link>
          ) : (
            <span className="text-sm text-text-faint opacity-30 flex-shrink-0 flex items-center gap-1">
              <ChevronLeft size={16} /> Anterior
            </span>
          )}

          <div className="min-w-0">
            <p className="text-xs text-text-faint font-mono">
              {idx + 1} / {total}
            </p>
            <p className="text-sm font-medium text-text truncate">{title}</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="flex-1 max-w-xs hidden sm:block">
          <div className="h-1.5 bg-[var(--surface-hi)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all"
              style={{ width: `${((idx + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        <Link
          href={nextUrl}
          className="flex items-center gap-1 text-sm text-text-faint hover:text-text transition-colors flex-shrink-0"
        >
          Omitir <ChevronRight size={16} />
        </Link>
      </div>

      {/* ── Ya existe ── */}
      {existing ? (
        <div className="px-8 py-8 max-w-2xl">
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
          <Link
            href={nextUrl}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-bg text-sm font-medium rounded-[6px] transition-colors"
          >
            Siguiente película <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          {!omdbDetail && (
            <div className="px-8 pt-4">
              <p className="text-sm text-[var(--warning)] bg-[var(--surface)] border border-[var(--warning)]/40 rounded-md px-4 py-2.5">
                OMDb no encontró &ldquo;{title}&rdquo; automáticamente. Búscalo manualmente en el formulario.
              </p>
            </div>
          )}
          <MovieForm
            mode="create"
            initial={initial}
            successUrl={nextUrl}
          />
        </>
      )}
    </div>
  );
}
