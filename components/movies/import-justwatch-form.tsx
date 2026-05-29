"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, CheckSquare, Square, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface JwMovie {
  jwId:          string;
  imdbId:        string | null;
  title:         string;
  originalTitle: string | null;
  year:          number | null;
  seenAt:        string;
  exists:        boolean;
}

interface ImportResult {
  imported: number;
  skipped:  number;
  errors:   { imdbId: string; error: string }[];
}

export function ImportJustwatchForm() {
  const router = useRouter();
  const [token,    setToken]    = useState("");
  const [country,  setCountry]  = useState("ES");
  const [movies,   setMovies]   = useState<JwMovie[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading,  setLoading]  = useState(false);
  const [importing, setImporting] = useState(false);
  const [error,    setError]    = useState("");
  const [result,   setResult]   = useState<ImportResult | null>(null);
  const [step,     setStep]     = useState<"token" | "preview" | "done">("token");

  // ── Cargar lista de JustWatch ──
  async function handlePreview() {
    if (!token.trim()) return;
    setLoading(true);
    setError("");
    setMovies([]);

    try {
      const res = await fetch("/api/import-justwatch", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token: token.trim(), country, preview: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al conectar con JustWatch");

      const list: JwMovie[] = data.movies ?? [];
      setMovies(list);
      // Pre-seleccionar las que no existen y tienen IMDb ID
      setSelected(new Set(list.filter((m) => !m.exists && m.imdbId).map((m) => m.jwId)));
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // ── Importar seleccionadas ──
  async function handleImport() {
    if (!selected.size) return;
    setImporting(true);
    setError("");

    try {
      const res = await fetch("/api/import-justwatch", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          token:   token.trim(),
          country,
          preview: false,
          ids:     Array.from(selected),
        }),
      });
      const data: ImportResult = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Error al importar");
      setResult(data);
      setStep("done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setImporting(false);
    }
  }

  function toggle(jwId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(jwId) ? next.delete(jwId) : next.add(jwId);
      return next;
    });
  }

  function selectAll(v: boolean) {
    setSelected(
      v ? new Set(movies.filter((m) => !m.exists && m.imdbId).map((m) => m.jwId)) : new Set()
    );
  }

  const newMovies  = movies.filter((m) => !m.exists);
  const noImdbId   = newMovies.filter((m) => !m.imdbId);
  const importable = newMovies.filter((m) => !!m.imdbId);

  const inputCls = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-[6px] px-3 py-2.5 text-[15px] text-text placeholder:text-text-faint focus:outline-none focus:border-[var(--border-focus)] transition-colors";

  // ── Paso 1: Token ─────────────────────────────────────────────────────────
  if (step === "token") {
    return (
      <div className="max-w-xl space-y-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-md p-5 space-y-3 text-sm text-text-mid">
          <p className="font-medium text-text">Cómo obtener el token de JustWatch:</p>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Ve a <a href="https://www.justwatch.com" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline inline-flex items-center gap-1">justwatch.com <ExternalLink size={11}/></a> e inicia sesión</li>
            <li>Abre las DevTools del navegador <span className="font-mono text-xs bg-[var(--surface-hi)] px-1.5 py-0.5 rounded">F12</span></li>
            <li>Ve a la pestaña <span className="font-mono text-xs bg-[var(--surface-hi)] px-1.5 py-0.5 rounded">Network</span></li>
            <li>Filtra por <span className="font-mono text-xs bg-[var(--surface-hi)] px-1.5 py-0.5 rounded">graphql</span> y recarga la página</li>
            <li>Click en cualquier request a <span className="font-mono text-xs">apis.justwatch.com</span></li>
            <li>En <span className="font-mono text-xs bg-[var(--surface-hi)] px-1.5 py-0.5 rounded">Headers → Authorization</span>, copia el valor después de <span className="font-mono text-xs">Bearer </span></li>
          </ol>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] uppercase tracking-[0.1em] text-text-faint">Token de JustWatch</label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="eyJhbGciOiJSUzI1NiIsIn..."
            rows={3}
            className={cn(inputCls, "resize-none font-mono text-xs")}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] uppercase tracking-[0.1em] text-text-faint">País</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={cn(inputCls, "w-auto")}
          >
            <option value="ES">España</option>
            <option value="NL">Países Bajos</option>
            <option value="US">Estados Unidos</option>
            <option value="GB">Reino Unido</option>
            <option value="DE">Alemania</option>
            <option value="FR">Francia</option>
          </select>
        </div>

        {error && <p className="text-sm text-[var(--error)] flex items-center gap-1.5"><AlertCircle size={14}/>{error}</p>}

        <button
          onClick={handlePreview}
          disabled={loading || !token.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-bg text-sm font-medium rounded-[6px] transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 size={14} className="animate-spin"/>}
          {loading ? "Conectando con JustWatch…" : "Cargar películas vistas"}
        </button>
      </div>
    );
  }

  // ── Paso 3: Resultado ─────────────────────────────────────────────────────
  if (step === "done" && result) {
    return (
      <div className="max-w-xl space-y-4">
        <div className="flex items-start gap-3 p-5 rounded-md border border-[var(--success)] bg-[var(--green-dim)]">
          <CheckCircle size={18} className="text-[var(--success)] flex-shrink-0 mt-0.5"/>
          <div>
            <p className="font-medium text-text">{result.imported} películas importadas correctamente.</p>
            {result.skipped > 0 && <p className="text-sm text-text-mid mt-1">{result.skipped} ya existían y se omitieron.</p>}
            {result.errors.length > 0 && (
              <ul className="mt-2 space-y-1">
                {result.errors.map((e) => (
                  <li key={e.imdbId} className="text-xs text-[var(--error)] flex items-center gap-1.5">
                    <AlertCircle size={11}/>{e.imdbId}: {e.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <a href="/peliculas" className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline">
          Ver mis películas →
        </a>
      </div>
    );
  }

  // ── Paso 2: Preview ───────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-sm text-text-mid">
          <span><span className="font-mono text-text">{movies.length}</span> vistas en JustWatch</span>
          <span><span className="font-mono text-[var(--success)]">{movies.filter((m) => m.exists).length}</span> ya importadas</span>
          <span><span className="font-mono text-[var(--accent)]">{importable.length}</span> nuevas</span>
          {noImdbId.length > 0 && (
            <span className="text-text-faint text-xs">{noImdbId.length} sin ID de IMDb (no importables)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => selectAll(true)} className="text-xs text-text-faint hover:text-text transition-colors px-2 py-1 rounded hover:bg-[var(--surface-hi)]">Seleccionar todo</button>
          <button onClick={() => selectAll(false)} className="text-xs text-text-faint hover:text-text transition-colors px-2 py-1 rounded hover:bg-[var(--surface-hi)]">Ninguna</button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[var(--border)] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                <th className="w-10 px-3 py-2.5"/>
                <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-widest text-text-faint font-medium">Película</th>
                <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-widest text-text-faint font-medium w-16">Año</th>
                <th className="px-3 py-2.5 text-left text-[11px] uppercase tracking-widest text-text-faint font-medium w-28">Vista el</th>
                <th className="px-3 py-2.5 text-center text-[11px] uppercase tracking-widest text-text-faint font-medium w-28">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {movies.map((m) => {
                const canSelect = !m.exists && !!m.imdbId;
                const isSel     = selected.has(m.jwId);
                return (
                  <tr
                    key={m.jwId}
                    className={cn(
                      "transition-colors",
                      m.exists        ? "opacity-40" :
                      !m.imdbId       ? "opacity-60" :
                      isSel           ? "bg-[var(--accent-dim)]" :
                                        "hover:bg-[var(--surface-hi)]"
                    )}
                  >
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => canSelect && toggle(m.jwId)}
                        disabled={!canSelect}
                        className="text-text-faint hover:text-text disabled:cursor-default transition-colors"
                      >
                        {isSel && canSelect
                          ? <CheckSquare size={16} className="text-[var(--accent)]"/>
                          : <Square size={16}/>}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-display italic font-semibold text-[15px] text-text truncate max-w-[280px]">{m.title}</p>
                      {m.imdbId && <p className="text-[10px] text-text-faint font-mono mt-0.5">{m.imdbId}</p>}
                      {!m.imdbId && <p className="text-[10px] text-[var(--warning)]">Sin IMDb ID — no importable</p>}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-text-faint">{m.year ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-text-faint font-mono">
                      {m.seenAt ? new Date(m.seenAt).toLocaleDateString("es-ES") : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {m.exists
                        ? <span className="text-[11px] px-2 py-0.5 rounded-sm bg-[var(--surface-hi)] text-text-faint">Existente</span>
                        : m.imdbId
                          ? <span className="text-[11px] px-2 py-0.5 rounded-sm bg-[var(--green-dim)] text-[var(--success)]">Nueva</span>
                          : <span className="text-[11px] px-2 py-0.5 rounded-sm bg-[var(--surface-hi)] text-[var(--warning)]">Sin ID</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--error)] flex items-center gap-1.5"><AlertCircle size={14}/>{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-text-faint">{selected.size} película{selected.size !== 1 ? "s" : ""} seleccionada{selected.size !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-3">
          <button onClick={() => { setStep("token"); setMovies([]); }} className="text-sm text-text-faint hover:text-text transition-colors">← Cambiar token</button>
          <button
            onClick={handleImport}
            disabled={importing || selected.size === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-bg text-sm font-medium rounded-[6px] transition-colors disabled:opacity-50"
          >
            {importing && <Loader2 size={14} className="animate-spin"/>}
            {importing ? "Importando…" : `Importar ${selected.size} película${selected.size !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
