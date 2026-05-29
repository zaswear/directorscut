const OMDB_BASE = "https://www.omdbapi.com";
const API_KEY = process.env.OMDB_API_KEY;

export interface OmdbMovie {
  imdbID: string;
  Title: string;
  Year: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Actors: string;
  Plot: string;
  Poster: string;
  imdbRating: string;
  imdbVotes: string;
  Country: string;
  Language: string;
  Rated: string;
  Response: string;
  Error?: string;
}

export interface OmdbSearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
}

export async function searchOmdb(query: string): Promise<OmdbSearchResult[]> {
  const res = await fetch(
    `${OMDB_BASE}/?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=movie`
  );
  const data = await res.json();
  if (data.Response === "False") return [];
  return (data.Search ?? []) as OmdbSearchResult[];
}

export async function getOmdbById(imdbId: string): Promise<OmdbMovie | null> {
  const res = await fetch(
    `${OMDB_BASE}/?apikey=${API_KEY}&i=${imdbId}&plot=full`
  );
  const data: OmdbMovie = await res.json();
  if (data.Response === "False") return null;
  return data;
}

/** Convierte un OmdbMovie a los campos que guardamos en la base de datos */
export function parseOmdbMovie(m: OmdbMovie) {
  return {
    imdbId:     m.imdbID,
    title:      m.Title,
    year:       parseInt(m.Year) || null,
    durationMin:parseInt(m.Runtime) || null,
    genres:     m.Genre !== "N/A" ? m.Genre.split(", ") : [],
    directors:  m.Director !== "N/A" ? m.Director.split(", ") : [],
    cast:       m.Actors !== "N/A" ? m.Actors.split(", ").slice(0, 5) : [],
    plot:       m.Plot !== "N/A" ? m.Plot : null,
    posterUrl:  m.Poster !== "N/A" ? m.Poster : null,
    imdbRating: m.imdbRating !== "N/A" ? parseFloat(m.imdbRating) : null,
    imdbVotes:  m.imdbVotes !== "N/A" ? parseInt(m.imdbVotes.replace(/,/g, "")) : null,
    country:    m.Country !== "N/A" ? m.Country : null,
    language:   m.Language !== "N/A" ? m.Language : null,
    rated:      m.Rated !== "N/A" ? m.Rated : null,
  };
}
