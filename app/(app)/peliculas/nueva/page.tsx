import { MovieForm } from "@/components/movies/movie-form";

export const metadata = { title: "Nueva película" };

export default function NuevaPeliculaPage() {
  return (
    <div>
      <div className="px-6 py-6 border-b border-[var(--border)]">
        <h1
          className="text-[28px] italic text-text"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 600 }}
        >
          Nueva película
        </h1>
      </div>
      <MovieForm mode="create" />
    </div>
  );
}
