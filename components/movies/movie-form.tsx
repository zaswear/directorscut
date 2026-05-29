"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { OmdbSearch } from "./omdb-search";
import { RichEditor } from "@/components/ui/rich-editor";
import { RatingInput } from "@/components/ui/rating-input";
import { ReferencesManager } from "@/components/ui/references-manager";
import { ImageUploader } from "@/components/ui/image-uploader";
import { ImageGallery } from "@/components/ui/image-gallery";
import { cn } from "@/lib/utils";
import {
  WATCH_FORMATS,
  MOVIE_STATUSES,
  type MovieCreateInput,
  type ReferenceInput,
} from "@/lib/schemas";
import type { Image as DBImage } from "@prisma/client";

const FORMAT_LABELS: Record<string, string> = {
  cine: "Cine", streaming: "Streaming", bluray: "Blu-ray",
  dvd: "DVD", digital: "Digital", otro: "Otro",
};
const STATUS_LABELS: Record<string, string> = {
  vista: "Vista", pendiente: "Pendiente", en_progreso: "En progreso", descartada: "Descartada",
};

interface Props {
  mode:        "create" | "edit";
  movieId?:    number;
  initial?:    Partial<MovieCreateInput>;
  initialImages?: DBImage[];
  successUrl?: string;   // URL personalizada tras guardar (ej. wizard de importación)
}

type FormState = MovieCreateInput & { imdbId: string };

const EMPTY: FormState = {
  imdbId: "", title: "", originalTitle: null, year: null, durationMin: null,
  genres: [], directors: [], cast: [], plot: null, posterUrl: null,
  imdbRating: null, imdbVotes: null, country: null, language: null, rated: null,
  myRating: null, watchedAt: null, watchFormat: null,
  review: null, hasImdbReview: false, notes: null,
  status: "pendiente", importedFromImdb: false, references: [],
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] uppercase tracking-[0.1em] text-text-faint mb-1.5">
      {children}
    </label>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full bg-[var(--surface)] border border-[var(--border)] rounded-[6px] px-3 py-2 text-[15px] text-text placeholder:text-text-faint focus:outline-none focus:border-[var(--border-focus)] transition-colors",
        className
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full bg-[var(--surface)] border border-[var(--border)] rounded-[6px] px-3 py-2 text-[15px] text-text placeholder:text-text-faint focus:outline-none focus:border-[var(--border-focus)] transition-colors resize-none",
        className
      )}
      {...props}
    />
  );
}

function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full bg-[var(--surface)] border border-[var(--border)] rounded-[6px] px-3 py-2 text-[15px] text-text focus:outline-none focus:border-[var(--border-focus)] transition-colors",
        className
      )}
      {...props}
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-semibold italic text-[18px] text-text border-b border-[var(--border)] pb-2 mb-5">
      {children}
    </h3>
  );
}

export function MovieForm({ mode, movieId, initial = {}, initialImages = [], successUrl }: Props) {
  const router  = useRouter();
  const [form, setForm]     = useState<FormState>({ ...EMPTY, ...initial });
  const [images, setImages] = useState<DBImage[]>(initialImages);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onOmdbSelect(data: Partial<MovieCreateInput>) {
    setForm((prev) => ({ ...prev, ...data }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      genres:    form.genres.filter(Boolean),
      directors: form.directors.filter(Boolean),
      cast:      form.cast.filter(Boolean),
    };

    try {
      const url    = mode === "create" ? "/api/movies" : `/api/movies/${movieId}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Error al guardar");
      const defaultUrl = mode === "create" ? `/peliculas/${data.id}/editar` : `/peliculas/${movieId}`;
      router.push(successUrl ?? defaultUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  const strTags = (arr: string[]) => arr.join(", ");
  const parseTags = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-8 space-y-10">

      {/* ── Búsqueda OMDb (solo create) ── */}
      {mode === "create" && (
        <section>
          <SectionTitle>Buscar en OMDb</SectionTitle>
          <OmdbSearch onSelect={onOmdbSelect} />
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">

        {/* Columna póster */}
        <div className="space-y-3">
          {form.posterUrl ? (
            <div className="relative w-full aspect-[2/3] rounded-md overflow-hidden shadow-poster bg-[var(--surface)]">
              <Image src={form.posterUrl} alt={form.title} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-full aspect-[2/3] rounded-md bg-[var(--surface)] flex items-center justify-center">
              <span className="text-text-faint text-sm">Sin póster</span>
            </div>
          )}
          <Field label="URL Póster OMDb">
            <Input
              value={form.posterUrl ?? ""}
              onChange={(e) => set("posterUrl", e.target.value || null)}
              placeholder="https://…"
              type="url"
            />
          </Field>
        </div>

        {/* Columna datos */}
        <div className="space-y-5">
          <section>
            <SectionTitle>Ficha técnica</SectionTitle>
            <div className="space-y-4">

              <Field label="IMDb ID *">
                <Input
                  value={form.imdbId}
                  onChange={(e) => set("imdbId", e.target.value)}
                  placeholder="tt1234567"
                  required
                />
              </Field>

              <Field label="Título *">
                <input
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[6px] px-3 py-2 text-[18px] font-display italic text-text placeholder:text-text-faint focus:outline-none focus:border-[var(--border-focus)] transition-colors"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Título de la película"
                  required
                />
              </Field>

              <Field label="Título original">
                <Input
                  value={form.originalTitle ?? ""}
                  onChange={(e) => set("originalTitle", e.target.value || null)}
                  placeholder="Original title"
                />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Año">
                  <Input
                    type="number" min={1880} max={2100}
                    value={form.year ?? ""}
                    onChange={(e) => set("year", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="2024"
                  />
                </Field>
                <Field label="Duración (min)">
                  <Input
                    type="number" min={1}
                    value={form.durationMin ?? ""}
                    onChange={(e) => set("durationMin", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="120"
                  />
                </Field>
                <Field label="Clasificación">
                  <Input
                    value={form.rated ?? ""}
                    onChange={(e) => set("rated", e.target.value || null)}
                    placeholder="R, PG-13…"
                  />
                </Field>
              </div>

              <Field label="Director(es)">
                <Input
                  value={strTags(form.directors)}
                  onChange={(e) => set("directors", parseTags(e.target.value))}
                  placeholder="Denis Villeneuve, Christopher Nolan…"
                />
              </Field>

              <Field label="Reparto (primeros 5)">
                <Input
                  value={strTags(form.cast)}
                  onChange={(e) => set("cast", parseTags(e.target.value))}
                  placeholder="Actor 1, Actor 2…"
                />
              </Field>

              <Field label="Géneros">
                <Input
                  value={strTags(form.genres)}
                  onChange={(e) => set("genres", parseTags(e.target.value))}
                  placeholder="Drama, Ciencia ficción…"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="País">
                  <Input
                    value={form.country ?? ""}
                    onChange={(e) => set("country", e.target.value || null)}
                    placeholder="United States"
                  />
                </Field>
                <Field label="Idioma">
                  <Input
                    value={form.language ?? ""}
                    onChange={(e) => set("language", e.target.value || null)}
                    placeholder="English"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Puntuación IMDb">
                  <Input
                    type="number" min={0} max={10} step={0.1}
                    value={form.imdbRating ?? ""}
                    onChange={(e) => set("imdbRating", e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="8.0"
                  />
                </Field>
                <Field label="Votos IMDb">
                  <Input
                    type="number" min={0}
                    value={form.imdbVotes ?? ""}
                    onChange={(e) => set("imdbVotes", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="500000"
                  />
                </Field>
              </div>

              <Field label="Sinopsis">
                <Textarea
                  value={form.plot ?? ""}
                  onChange={(e) => set("plot", e.target.value || null)}
                  rows={4}
                  placeholder="Sinopsis oficial…"
                />
              </Field>
            </div>
          </section>

          {/* ── Mi registro ── */}
          <section>
            <SectionTitle>Mi registro</SectionTitle>
            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <Field label="Estado">
                  <Select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as MovieCreateInput["status"])}
                  >
                    {MOVIE_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Mi puntuación">
                  <RatingInput
                    value={form.myRating}
                    onChange={(v) => set("myRating", v)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha de visionado">
                  <Input
                    type="date"
                    value={form.watchedAt ? form.watchedAt.slice(0, 10) : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      set("watchedAt", v ? new Date(v).toISOString() : null);
                    }}
                  />
                </Field>
                <Field label="Formato">
                  <Select
                    value={form.watchFormat ?? ""}
                    onChange={(e) => set("watchFormat", (e.target.value || null) as MovieCreateInput["watchFormat"])}
                  >
                    <option value="">— Sin especificar —</option>
                    {WATCH_FORMATS.map((f) => (
                      <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="hasImdbReview"
                  type="checkbox"
                  checked={form.hasImdbReview}
                  onChange={(e) => set("hasImdbReview", e.target.checked)}
                  className="accent-[var(--accent)] w-4 h-4"
                />
                <label htmlFor="hasImdbReview" className="text-sm text-text-mid cursor-pointer">
                  Tengo crítica publicada en IMDb
                </label>
              </div>

              <Field label="Mi crítica">
                <RichEditor
                  value={form.review ?? ""}
                  onChange={(html) => set("review", html || null)}
                />
              </Field>

              <Field label="Notas libres">
                <Textarea
                  value={form.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value || null)}
                  rows={3}
                  placeholder="Apuntes, contexto, ideas…"
                />
              </Field>

              <Field label="Referencias">
                <ReferencesManager
                  value={form.references}
                  onChange={(refs) => set("references", refs as ReferenceInput[])}
                />
              </Field>
            </div>
          </section>

          {/* ── Imágenes (solo en modo edición) ── */}
          {mode === "edit" && movieId && (
            <section>
              <SectionTitle>Galería de fotos</SectionTitle>
              <ImageGallery
                images={images.filter((i) => i.type === "gallery")}
                onDelete={(id) => setImages((prev) => prev.filter((i) => i.id !== id))}
                className="mb-4"
              />
              <ImageUploader
                movieId={movieId}
                type="gallery"
                onUpload={(img) => setImages((prev) => [...prev, img])}
              />

              <div className="mt-8">
                <SectionTitle>Pósteres alternativos</SectionTitle>
                <ImageGallery
                  images={images.filter((i) => i.type === "poster_alt")}
                  onDelete={(id) => setImages((prev) => prev.filter((i) => i.id !== id))}
                  className="mb-4"
                />
                <ImageUploader
                  movieId={movieId}
                  type="poster_alt"
                  onUpload={(img) => setImages((prev) => [...prev, img])}
                />
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── Error + Submit ── */}
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-text-mid hover:text-text rounded-[6px] hover:bg-[var(--surface-hi)] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-bg text-sm font-medium rounded-[6px] transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {mode === "create" ? "Guardar película" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
