import { VercelRequest, VercelResponse } from "@vercel/node";
import { setCorsHeaders, handleOptions } from "../../../lib";

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
    throw new Error(`TMDB API Error: ${response.status}`);
  }

  return response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  res.setHeader("Content-Type", "application/json");
  if (handleOptions(req, res)) return;

  try {
    const { type, id } = req.query;

    if (!type || !id) {
      return res.status(400).json({ error: "Missing type or id parameter" });
    }

    const typeStr = Array.isArray(type) ? type[0] : type;
    const idStr = Array.isArray(id) ? id[0] : id;

    if (!["movie", "tv"].includes(typeStr)) {
      return res
        .status(400)
        .json({ error: 'Invalid type. Must be "movie" or "tv"' });
    }

    const data = await fetchFromTMDB(`/${typeStr}/${idStr}/credits`);
    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching TMDB credits:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
