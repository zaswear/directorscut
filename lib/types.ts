// ─── Tipos de dominio ─────────────────────────────────────────────────────────

export type WatchFormat =
  | "cine"
  | "streaming"
  | "bluray"
  | "dvd"
  | "digital"
  | "otro";

export type MovieStatus =
  | "vista"
  | "pendiente"
  | "en_progreso"
  | "descartada";

export type ImageType = "gallery" | "poster_alt";

// ─── Labels para UI ───────────────────────────────────────────────────────────

export const WATCH_FORMAT_LABELS: Record<WatchFormat, string> = {
  cine:      "Cine",
  streaming: "Streaming",
  bluray:    "Blu-ray",
  dvd:       "DVD",
  digital:   "Digital",
  otro:      "Otro",
};

export const MOVIE_STATUS_LABELS: Record<MovieStatus, string> = {
  vista:       "Vista",
  pendiente:   "Pendiente",
  en_progreso: "En progreso",
  descartada:  "Descartada",
};

export const WATCH_FORMATS: WatchFormat[] = [
  "cine", "streaming", "bluray", "dvd", "digital", "otro",
];

export const MOVIE_STATUSES: MovieStatus[] = [
  "vista", "pendiente", "en_progreso", "descartada",
];

// ─── Tipos de película con arrays deserializados ───────────────────────────────

import type { Movie, Image, Reference } from "@prisma/client";

/** Movie con arrays parseados desde JSON */
export interface MovieParsed extends Omit<Movie, "genres" | "directors" | "cast"> {
  genres:    string[];
  directors: string[];
  cast:      string[];
  status:    MovieStatus;
  watchFormat: WatchFormat | null;
}

/** Movie completa con relaciones */
export interface MovieFull extends MovieParsed {
  images:     Image[];
  references: Reference[];
}

/** Parsea los campos JSON de un Movie crudo de Prisma */
export function parseMovie(movie: Movie): MovieParsed {
  return {
    ...movie,
    genres:      JSON.parse(movie.genres    || "[]"),
    directors:   JSON.parse(movie.directors || "[]"),
    cast:        JSON.parse(movie.cast      || "[]"),
    status:      movie.status as MovieStatus,
    watchFormat: movie.watchFormat as WatchFormat | null,
  };
}

export function parseMovieFull(
  movie: Movie & { images: Image[]; references: Reference[] }
): MovieFull {
  return {
    ...parseMovie(movie),
    images:     movie.images,
    references: movie.references,
  };
}

/** Serializa arrays para guardar en Prisma */
export function serializeArrays(data: {
  genres?:    string[];
  directors?: string[];
  cast?:      string[];
}) {
  return {
    ...(data.genres    !== undefined && { genres:    JSON.stringify(data.genres) }),
    ...(data.directors !== undefined && { directors: JSON.stringify(data.directors) }),
    ...(data.cast      !== undefined && { cast:      JSON.stringify(data.cast) }),
  };
}
