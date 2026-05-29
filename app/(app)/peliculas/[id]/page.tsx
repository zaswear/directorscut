import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Pencil, ExternalLink, Clock, Globe, Tag } from "lucide-react";
import { db } from "@/lib/db";
import { parseMovie } from "@/lib/types";
import { imageUrl } from "@/lib/cloudinary";
import { ImageGallery } from "@/components/ui/image-gallery";
import { DeleteMovieButton } from "@/components/movies/delete-movie-button";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  vista: "Vista", pendiente: "Pendiente", en_progreso: "En progreso", descartada: "Descartada",
};
const STATUS_COLORS: Record<string, string> = {
  vista: "var(--success)", pendiente: "var(--text-faint)",
  en_progreso: "var(--warning)", descartada: "var(--error)",
};
const FORMAT_LABELS: Record<string, string> = {
  cine: "Cine", streaming: "Streaming", bluray: "Blu-ray",
  dvd: "DVD", digital: "Digital", otro: "Otro",
};

export async function generateMetadata({ params }: { params: { id: string } }) {
  const movie = await db.movie.findUnique({ where: { id: parseInt(params.id) } });
  return { title: movie?.title ?? "Película" };
}

export default async function MovieDetailPage({ params }: { params: { id: string } }) {
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
  const gallery   = raw.images.filter((i) => i.type === "gallery");
  const posterAlts = raw.images.filter((i) => i.type === "poster_alt");

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/peliculas" className="text-sm text-text-faint hover:text-text transition-colors">
          ← Películas
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href={`/peliculas/${id}/editar`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-mid hover:text-text rounded-[6px] hover:bg-[var(--surface-hi)] transition-colors"
          >
            <Pencil size={14} /> Editar
          </Link>
          <DeleteMovieButton movieId={id} />
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 mb-10">

        {/* Poster */}
        <div className="flex-shrink-0">
          {movie.posterUrl ? (
            <div className="relative w-full aspect-[2/3] rounded-md overflow-hidden shadow-poster">
              <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-full aspect-[2/3] rounded-md bg-[var(--surface)] flex items-center justify-center p-4">
              <span
                className="font-display text-center italic text-text-faint text-lg leading-tight"
              >
                {movie.title}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          {/* Title */}
          <h1
            className="font-display font-semibold text-[38px] md:text-[48px] italic leading-none text-text mb-1"
          >
            {movie.title}
          </h1>
          {movie.originalTitle && movie.originalTitle !== movie.title && (
            <p className="text-text-faint text-sm mb-3">{movie.originalTitle}</p>
          )}

          {/* Ratings */}
          <div className="flex items-baseline gap-5 mb-5">
            {movie.myRating != null && (
              <div>
                <span
                  className="text-[42px] font-bold leading-none"
                  style={{ fontFamily: "var(--font-space-mono), monospace", color: "var(--accent)" }}
                >
                  {movie.myRating}
                </span>
                <span className="text-text-faint text-xs ml-1">/10</span>
              </div>
            )}
            {movie.imdbRating != null && (
              <div className="flex flex-col">
                <span className="font-mono text-xl text-text-mid">{movie.imdbRating}</span>
                <span className="text-[10px] uppercase tracking-widest text-text-faint">IMDb</span>
              </div>
            )}
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {movie.status && (
              <span
                className="text-[11px] px-2.5 py-1 rounded-sm font-medium"
                style={{ background: "var(--surface-hi)", color: STATUS_COLORS[movie.status] }}
              >
                {STATUS_LABELS[movie.status]}
              </span>
            )}
            {movie.hasImdbReview && (
              <span className="text-[11px] px-2.5 py-1 rounded-sm bg-[var(--surface-hi)] text-text-mid">
                Crítica en IMDb
              </span>
            )}
          </div>

          {/* Details grid */}
          <dl className="space-y-2 text-sm">
            {movie.year && (
              <div className="flex gap-3">
                <dt className="text-text-faint w-28 flex-shrink-0">Año</dt>
                <dd className="font-mono text-text">{movie.year}</dd>
              </div>
            )}
            {movie.durationMin && (
              <div className="flex gap-3">
                <dt className="text-text-faint w-28 flex-shrink-0 flex items-center gap-1"><Clock size={12} /> Duración</dt>
                <dd className="font-mono text-text">{movie.durationMin} min</dd>
              </div>
            )}
            {movie.directors.length > 0 && (
              <div className="flex gap-3">
                <dt className="text-text-faint w-28 flex-shrink-0">Dirección</dt>
                <dd className="text-text">{movie.directors.join(", ")}</dd>
              </div>
            )}
            {movie.cast.length > 0 && (
              <div className="flex gap-3">
                <dt className="text-text-faint w-28 flex-shrink-0">Reparto</dt>
                <dd className="text-text-mid">{movie.cast.join(", ")}</dd>
              </div>
            )}
            {movie.country && (
              <div className="flex gap-3">
                <dt className="text-text-faint w-28 flex-shrink-0 flex items-center gap-1"><Globe size={12} /> País</dt>
                <dd className="text-text-mid">{movie.country}</dd>
              </div>
            )}
            {movie.language && (
              <div className="flex gap-3">
                <dt className="text-text-faint w-28 flex-shrink-0">Idioma</dt>
                <dd className="text-text-mid">{movie.language}</dd>
              </div>
            )}
            {movie.rated && (
              <div className="flex gap-3">
                <dt className="text-text-faint w-28 flex-shrink-0">Clasificación</dt>
                <dd className="font-mono text-text-mid">{movie.rated}</dd>
              </div>
            )}
            {movie.watchedAt && (
              <div className="flex gap-3">
                <dt className="text-text-faint w-28 flex-shrink-0">Vista el</dt>
                <dd className="font-mono text-text">
                  {new Date(movie.watchedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                  {movie.watchFormat && <span className="text-text-faint ml-2">· {FORMAT_LABELS[movie.watchFormat]}</span>}
                </dd>
              </div>
            )}
            {movie.imdbId && (
              <div className="flex gap-3">
                <dt className="text-text-faint w-28 flex-shrink-0">IMDb</dt>
                <dd>
                  <a
                    href={`https://www.imdb.com/title/${movie.imdbId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    {movie.imdbId} <ExternalLink size={11} />
                  </a>
                </dd>
              </div>
            )}
          </dl>

          {/* Genres */}
          {movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {movie.genres.map((g) => (
                <span
                  key={g}
                  className="text-[11px] px-2 py-0.5 rounded-sm bg-[var(--surface-hi)] text-text-mid flex items-center gap-1"
                >
                  <Tag size={9} />{g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sinopsis ── */}
      {movie.plot && (
        <section className="mb-10">
          <h2 className="section-heading mb-3">Sinopsis</h2>
          <p className="text-text-mid text-[15px] leading-relaxed max-w-2xl">{movie.plot}</p>
        </section>
      )}

      {/* ── Mi crítica ── */}
      {movie.review && (
        <section className="mb-10">
          <h2 className="section-heading mb-4">Mi crítica</h2>
          <div
            className="prose-review max-w-2xl"
            dangerouslySetInnerHTML={{ __html: movie.review }}
          />
        </section>
      )}

      {/* ── Notas ── */}
      {movie.notes && (
        <section className="mb-10">
          <h2 className="section-heading mb-3">Notas</h2>
          <p className="text-text-mid text-sm leading-relaxed whitespace-pre-wrap max-w-2xl">{movie.notes}</p>
        </section>
      )}

      {/* ── Galería ── */}
      {gallery.length > 0 && (
        <section className="mb-10">
          <h2 className="section-heading mb-4">Galería</h2>
          <ImageGallery images={gallery} />
        </section>
      )}

      {/* ── Pósteres alternativos ── */}
      {posterAlts.length > 0 && (
        <section className="mb-10">
          <h2 className="section-heading mb-4">Pósteres alternativos</h2>
          <ImageGallery images={posterAlts} />
        </section>
      )}

      {/* ── Referencias ── */}
      {raw.references.length > 0 && (
        <section className="mb-10">
          <h2 className="section-heading mb-3">Referencias</h2>
          <ul className="space-y-2">
            {raw.references.map((ref) => (
              <li key={ref.id}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-text hover:text-[var(--accent)] transition-colors group"
                >
                  <ExternalLink size={12} className="text-text-faint group-hover:text-[var(--accent)]" />
                  {ref.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  );
}
