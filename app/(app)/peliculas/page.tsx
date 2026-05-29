import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { parseMovie } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Películas" };

export default async function PeliculasPage() {
  const raw = await db.movie.findMany({
    orderBy: { createdAt: "desc" },
  });
  const movies = raw.map(parseMovie);

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1
            className="text-[38px] leading-none italic text-text"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 600 }}
          >
            Mis películas
          </h1>
          <p className="text-sm text-text-faint mt-1 font-mono">{movies.length} entradas</p>
        </div>
        <Link
          href="/peliculas/nueva"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-bg text-sm font-medium rounded-[6px] transition-colors"
        >
          <Plus size={14} /> Nueva película
        </Link>
      </div>

      {movies.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-text-faint text-sm">
            Aún no hay películas.{" "}
            <Link href="/peliculas/nueva" className="text-[var(--accent)] hover:underline">
              Añade la primera
            </Link>
            {" "}o{" "}
            <Link href="/admin/import" className="text-[var(--accent)] hover:underline">
              importa desde IMDb
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {movies.map((m) => (
            <Link key={m.id} href={`/peliculas/${m.id}`} className="group block">
              {/* Poster */}
              <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-[var(--surface)] shadow-card mb-2.5 transition-shadow group-hover:shadow-raised">
                {m.posterUrl ? (
                  <Image
                    src={m.posterUrl}
                    alt={m.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3">
                    <span
                      className="text-center text-sm italic text-text-faint leading-tight"
                      style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                    >
                      {m.title}
                    </span>
                  </div>
                )}
                {/* My rating badge */}
                {m.myRating != null && (
                  <div className="absolute top-2 right-2 bg-[var(--accent)] text-bg text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-sm leading-none">
                    {m.myRating}
                  </div>
                )}
              </div>

              {/* Info */}
              <p
                className="text-[13px] leading-tight truncate italic text-text group-hover:text-[var(--accent)] transition-colors"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 600 }}
              >
                {m.title}
              </p>
              {m.year && (
                <p className="text-[11px] text-text-faint font-mono mt-0.5">{m.year}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
