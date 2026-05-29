import { readImdbCsvs } from "@/lib/csv";
import { db } from "@/lib/db";
import { ImportTable } from "@/components/movies/import-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Importar desde IMDb" };

export default async function ImportPage() {
  const rows = readImdbCsvs();

  // Comprueba cuáles ya existen en la DB
  const imdbIds = rows.map((r) => r.imdbId);
  const existing = await db.movie.findMany({
    where:  { imdbId: { in: imdbIds } },
    select: { imdbId: true },
  });
  const existingSet = new Set(existing.map((m) => m.imdbId));

  const enriched = rows.map((r) => ({ ...r, exists: existingSet.has(r.imdbId) }));

  const newCount      = enriched.filter((r) => !r.exists).length;
  const existingCount = enriched.filter((r) =>  r.exists).length;

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-[38px] italic text-text leading-none"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 600 }}
        >
          Importar desde IMDb
        </h1>
        <p className="text-text-faint text-sm mt-2">
          {rows.length === 0
            ? "No se encontraron archivos CSV en /export_imdb."
            : `${rows.length} películas encontradas en los archivos CSV · ${newCount} nuevas · ${existingCount} ya importadas`}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-text-faint">
          <p className="text-sm mb-2">Coloca tus exportaciones de IMDb en la carpeta:</p>
          <code className="font-mono text-xs bg-[var(--surface)] px-3 py-1.5 rounded">
            /export_imdb/*.csv
          </code>
        </div>
      ) : (
        <ImportTable rows={enriched} />
      )}
    </div>
  );
}
