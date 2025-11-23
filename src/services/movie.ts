import { tmdb } from "@/services/tmdb";

type MovieResult = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  popularity: number;
  original_language: string;
  genre_ids: number[];
  media_type?: string;
};

export type ProcessedMovie = {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  popularity: number;
  original_language: string;
  genre_ids: number[];
  status: string;
  type: string;
};

const ANIMATION_GENRE = 16;
const KIDS_GENRES = [10751]; // Family

function buildQueryString(params: Record<string, any>): string {
  return Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&");
}

import {
  mapTmdbStatusStringToId,
  mapTmdbStatusIdToStatus,
} from "@/utils/status";

export async function getChineseMovies(): Promise<ProcessedMovie[]> {
  // 1) Discover Donghua Movie utama
  const discoverParams = {
    with_genres: ANIMATION_GENRE,
    with_original_language: "zh",
    with_origin_country: "CN|HK|TW",
    include_adult: false,
    sort_by: "primary_release_date.desc",
    page: 1,
  };
  const discoverUrl = `/discover/movie?${buildQueryString(discoverParams)}`;
  const discover = await tmdb.fetch(discoverUrl);

  let movies: MovieResult[] = discover.results || [];

  // 2) HAPUS KIDS Movies
  movies = movies.filter(
    (m) => !m.genre_ids.some((id) => KIDS_GENRES.includes(id))
  );

  // 3) Fallback search untuk film yang tidak masuk discover
  const fallbackKeywords = [
    "仙逆",
    "Xianxia",
    "Donghua",
    "Immortal",
    "修仙",
    "玄幻",
    "国漫",
    "Chinese animation",
  ];

  for (const kw of fallbackKeywords) {
    const searchUrl = `/search/multi?${buildQueryString({ query: kw })}`;
    const search = await tmdb.fetch(searchUrl);

    const fallbackItems = (search.results || []).filter(
      (item: any) =>
        item.media_type === "movie" &&
        item.original_language === "zh" &&
        item.genre_ids?.includes(ANIMATION_GENRE) &&
        !item.genre_ids.some((id: number) => KIDS_GENRES.includes(id))
    );

    movies.push(...fallbackItems);
  }

  // 4) Hilangkan duplikat
  const unique = Object.values(
    movies.reduce((map: Record<number, MovieResult>, movie: MovieResult) => {
      map[movie.id] = movie;
      return map;
    }, {})
  );

  // 5) Format output untuk frontend / DB
  return unique.map((m) => {
    // Using new status mapping
    const tmdbStatusId = mapTmdbStatusStringToId("", "movie"); // No status string provided
    const status = mapTmdbStatusIdToStatus("movie", tmdbStatusId);

    return {
      id: m.id,
      title: m.title,
      originalTitle: m.original_title,
      overview: m.overview,
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      release_date: m.release_date,
      vote_average: m.vote_average,
      popularity: m.popularity,
      original_language: m.original_language,
      genre_ids: m.genre_ids,
      status: status,
      type: "movie",
    };
  });
}
