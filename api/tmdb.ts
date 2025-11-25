import { VercelRequest, VercelResponse } from "@vercel/node";
import { setCorsHeaders, handleOptions } from "./lib";

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function fetchFromTMDB(endpoint: string) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "") {
    throw new Error("TMDB API Key is not configured.");
  }

  const url = `${TMDB_BASE_URL}${endpoint}${
    endpoint.includes("?") ? "&" : "?"
  }api_key=${TMDB_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ TMDB API Error:", response.status, errorText);
    throw new Error(`TMDB API Error: ${response.status}`);
  }

  return response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  res.setHeader("Content-Type", "application/json");
  if (handleOptions(req, res)) return;

  try {
    const { action, type, id, query } = req.query;

    // GET /api/tmdb - search movies/tv
    if (!action) {
      const q = Array.isArray(query) ? query[0] : query;
      if (!q) {
        return res.status(400).json({ error: "Missing query parameter" });
      }
      const data = await fetchFromTMDB(
        `/search/multi?query=${encodeURIComponent(q)}`
      );
      return res.json(data);
    }

    // GET /api/tmdb?action=details&type=movie&id=123
    if (action === "details") {
      const typeStr = Array.isArray(type) ? type[0] : type;
      const idStr = Array.isArray(id) ? id[0] : id;

      if (!typeStr || !idStr) {
        return res.status(400).json({ error: "Missing type or id parameter" });
      }

      if (!["movie", "tv"].includes(typeStr)) {
        return res
          .status(400)
          .json({ error: 'Invalid type. Must be "movie" or "tv"' });
      }

      const data = await fetchFromTMDB(`/${typeStr}/${idStr}`);
      return res.json(data);
    }

    // GET /api/tmdb?action=credits&type=movie&id=123
    if (action === "credits") {
      const typeStr = Array.isArray(type) ? type[0] : type;
      const idStr = Array.isArray(id) ? id[0] : id;

      if (!typeStr || !idStr) {
        return res.status(400).json({ error: "Missing type or id parameter" });
      }

      if (!["movie", "tv"].includes(typeStr)) {
        return res
          .status(400)
          .json({ error: 'Invalid type. Must be "movie" or "tv"' });
      }

      const data = await fetchFromTMDB(`/${typeStr}/${idStr}/credits`);
      return res.json(data);
    }

    // GET /api/tmdb?action=videos&type=movie&id=123
    if (action === "videos") {
      const typeStr = Array.isArray(type) ? type[0] : type;
      const idStr = Array.isArray(id) ? id[0] : id;

      if (!typeStr || !idStr) {
        return res.status(400).json({ error: "Missing type or id parameter" });
      }

      if (!["movie", "tv"].includes(typeStr)) {
        return res
          .status(400)
          .json({ error: 'Invalid type. Must be "movie" or "tv"' });
      }

      const data = await fetchFromTMDB(`/${typeStr}/${idStr}/videos`);
      return res.json(data);
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    console.error("❌ Error fetching TMDB data:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
