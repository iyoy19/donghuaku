import { VercelRequest, VercelResponse } from "@vercel/node";
import { setCorsHeaders, handleOptions } from "../lib";

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function fetchFromTMDB(endpoint: string) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "") {
    throw new Error(
      "TMDB API Key is not configured. Please set TMDB_API_KEY or VITE_TMDB_API_KEY environment variable."
    );
  }

  const url = `${TMDB_BASE_URL}${endpoint}${
    endpoint.includes("?") ? "&" : "?"
  }api_key=${TMDB_API_KEY}`;
  console.log("🌐 TMDB Request:", url.replace(TMDB_API_KEY, "***"));

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "❌ TMDB API Error:",
      response.status,
      response.statusText,
      errorText
    );
    throw new Error(
      `TMDB API Error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  res.setHeader("Content-Type", "application/json");
  if (handleOptions(req, res)) return;

  try {
    const { q, type } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // If type is specified, search specific type, otherwise use multi search
    if (type && ["movie", "tv"].includes(type as string)) {
      const data = await fetchFromTMDB(
        `/search/${type}?query=${encodeURIComponent(q)}`
      );
      res.json(data);
    } else {
      // Multi search - returns both movies and TV shows
      const data = await fetchFromTMDB(
        `/search/multi?query=${encodeURIComponent(q)}`
      );
      // Filter to only return movie and tv results
      const filtered = {
        ...data,
        results: data.results.filter(
          (item: any) => item.media_type === "movie" || item.media_type === "tv"
        ),
      };
      res.json(filtered);
    }
  } catch (error) {
    console.error("❌ Error searching TMDB:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
