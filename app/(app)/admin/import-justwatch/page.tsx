import { ImportJustwatchForm } from "@/components/movies/import-justwatch-form";

export const metadata = { title: "Importar desde JustWatch" };

export default function ImportJustwatchPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1
          className="font-display font-semibold text-[38px] italic text-text leading-none"
        >
          Importar desde JustWatch
        </h1>
        <p className="text-text-faint text-sm mt-2">
          Importa las películas marcadas como vistas en tu cuenta de JustWatch.
          Se guardarán con estado <span className="font-mono text-xs bg-[var(--surface)] px-1.5 py-0.5 rounded">vista</span> y enriquecidas con datos de OMDb.
        </p>
      </div>
      <ImportJustwatchForm />
    </div>
  );
}
