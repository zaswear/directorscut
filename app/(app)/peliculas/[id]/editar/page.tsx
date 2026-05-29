import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseMovie } from "@/lib/types";
import { MovieForm } from "@/components/movies/movie-form";
import type { MovieCreateInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const movie = await db.movie.findUnique({ where: { id: parseInt(params.id) } });
  return { title: movie ? `Editar · ${movie.title}` : "Editar" };
}

export default async function EditMoviePage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const raw = await db.movie.findUnique({
    where: { id },
    include: {
      images:     { orderBy: { createdAt: "asc" } },
      references: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!raw) notFound();

  const movie = parseMovie(raw);

  const initial: Partial<MovieCreateInput> = {
    imdbId:          movie.imdbId,
    title:           movie.title,
    originalTitle:   movie.originalTitle ?? null,
    year:            movie.year ?? null,
    durationMin:     movie.durationMin ?? null,
    genres:          movie.genres,
    directors:       movie.directors,
    cast:            movie.cast,
    plot:            movie.plot ?? null,
    posterUrl:       movie.posterUrl ?? null,
    imdbRating:      movie.imdbRating ?? null,
    imdbVotes:       movie.imdbVotes ?? null,
    country:         movie.country ?? null,
    language:        movie.language ?? null,
    rated:           movie.rated ?? null,
    myRating:        movie.myRating ?? null,
    watchedAt:       movie.watchedAt ? (movie.watchedAt as Date).toISOString() : null,
    watchFormat:     movie.watchFormat ?? null,
    review:          movie.review ?? null,
    hasImdbReview:   movie.hasImdbReview,
    notes:           movie.notes ?? null,
    status:          movie.status,
    importedFromImdb: movie.importedFromImdb,
    references:      raw.references.map(({ title, url }) => ({ title, url })),
  };

  return (
    <div>
      <div className="px-6 py-6 border-b border-[var(--border)]">
        <h1
          className="font-display font-semibold text-[28px] italic text-text"
        >
          {movie.title}
        </h1>
        <p className="text-sm text-text-faint mt-0.5">Editando ficha</p>
      </div>
      <MovieForm
        mode="edit"
        movieId={id}
        initial={initial}
        initialImages={raw.images}
      />
    </div>
  );
}
