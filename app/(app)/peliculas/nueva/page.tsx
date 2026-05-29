import { MovieForm } from "@/components/movies/movie-form";

export const metadata = { title: "Nueva película" };

export default function NuevaPeliculaPage() {
  return (
    <div>
      <div className="px-6 py-6 border-b border-[var(--border)]">
        <h1
          className="font-display font-semibold text-[28px] italic text-text"
        >
          Nueva película
        </h1>
      </div>
      <MovieForm mode="create" />
    </div>
  );
}
