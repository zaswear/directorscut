import { db } from "@/lib/db";
import { StatsCharts } from "@/components/stats/stats-charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estadísticas" };

export interface StatsData {
  summary: {
    total:          number;
    watched:        number;
    avgMyRating:    number | null;
    avgImdbRating:  number | null;
    totalWithRating: number;
  };
  byGenre:     { genre: string; count: number }[];
  byMonth:     { month: string; label: string; count: number }[];
  byDirector:  { director: string; count: number }[];
  histogram:   { label: string; count: number }[];
  byYear:      { year: number; count: number }[];
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function buildMonthSeries(entries: { key: string; label: string }[], counts: Record<string, number>) {
  return entries.map(({ key, label }) => ({ month: key, label, count: counts[key] ?? 0 }));
}

function last24Months(): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  const now = new Date();
  const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    result.push({ key, label });
  }
  return result;
}

export default async function StatsPage() {
  const movies = await db.movie.findMany();

  // ── Summary ──
  const watched       = movies.filter((m) => m.status === "vista");
  const myRatings     = movies.map((m) => m.myRating).filter((r): r is number => r !== null);
  const imdbRatings   = movies.map((m) => m.imdbRating).filter((r): r is number => r !== null);

  // ── Géneros ──
  const genreCounts: Record<string, number> = {};
  for (const m of movies) {
    const genres: string[] = JSON.parse(m.genres || "[]");
    for (const g of genres) genreCounts[g] = (genreCounts[g] ?? 0) + 1;
  }
  const byGenre = Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // ── Por mes (últimos 24 meses) ──
  const monthCounts: Record<string, number> = {};
  for (const m of movies) {
    if (!m.watchedAt) continue;
    const d = new Date(m.watchedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthCounts[key] = (monthCounts[key] ?? 0) + 1;
  }
  const byMonth = buildMonthSeries(last24Months(), monthCounts);

  // ── Por año ──
  const yearCounts: Record<number, number> = {};
  for (const m of movies) {
    if (!m.watchedAt) continue;
    const y = new Date(m.watchedAt).getFullYear();
    yearCounts[y] = (yearCounts[y] ?? 0) + 1;
  }
  const byYear = Object.entries(yearCounts)
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => a.year - b.year);

  // ── Directores ──
  const directorCounts: Record<string, number> = {};
  for (const m of movies) {
    const directors: string[] = JSON.parse(m.directors || "[]");
    for (const d of directors) directorCounts[d] = (directorCounts[d] ?? 0) + 1;
  }
  const byDirector = Object.entries(directorCounts)
    .map(([director, count]) => ({ director, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // ── Histograma mis notas ──
  const histogram = Array.from({ length: 10 }, (_, i) => ({
    label: String(i + 1),
    count: 0,
  }));
  for (const r of myRatings) {
    const idx = r === 10 ? 9 : Math.min(9, Math.max(0, Math.floor(r) - 1));
    histogram[idx].count++;
  }

  const data: StatsData = {
    summary: {
      total:           movies.length,
      watched:         watched.length,
      avgMyRating:     avg(myRatings),
      avgImdbRating:   avg(imdbRatings),
      totalWithRating: myRatings.length,
    },
    byGenre,
    byMonth,
    byDirector,
    histogram,
    byYear,
  };

  return (
    <div className="px-8 py-8">
      <h1
        className="text-[38px] italic text-text leading-none mb-8"
        style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 600 }}
      >
        Estadísticas
      </h1>
      <StatsCharts data={data} />
    </div>
  );
}
