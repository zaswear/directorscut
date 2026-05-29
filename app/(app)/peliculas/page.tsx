import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { parseMovie } from "@/lib/types";
import { MoviesList } from "@/components/movies/movies-list";
import type { MovieItem } from "@/lib/movie-item";

export const dynamic = "force-dynamic";
export const metadata = { title: "Películas" };

export default async function PeliculasPage() {
  const raw = await db.movie.findMany({ orderBy: { createdAt: "desc" } });

  const movies: MovieItem[] = raw.map((m) => {
    const p = parseMovie(m);
    return {
      id:              p.id,
      imdbId:          p.imdbId,
      title:           p.title,
      originalTitle:   p.originalTitle ?? null,
      year:            p.year ?? null,
      durationMin:     p.durationMin ?? null,
      genres:          p.genres,
      directors:       p.directors,
      cast:            p.cast,
      posterUrl:       p.posterUrl ?? null,
      imdbRating:      p.imdbRating ?? null,
      imdbVotes:       p.imdbVotes ?? null,
      myRating:        p.myRating ?? null,
      watchedAt:       p.watchedAt ? (p.watchedAt as Date).toISOString() : null,
      watchFormat:     p.watchFormat ?? null,
      status:          p.status,
      hasImdbReview:   p.hasImdbReview,
      importedFromImdb: p.importedFromImdb,
      createdAt:       (p.createdAt as Date).toISOString(),
    };
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header fijo */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border)] flex-shrink-0">
        <div>
          <h1 className="font-display font-semibold text-[32px] italic leading-none text-text">
            Mis películas
          </h1>
          <p className="text-xs text-text-faint font-mono mt-1">{movies.length} entradas</p>
        </div>
        <Link
          href="/peliculas/nueva"
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-bg text-sm font-medium rounded-[6px] transition-colors"
        >
          <Plus size={14} /> Nueva
        </Link>
      </div>

      <MoviesList movies={movies} />
    </div>
  );
}
