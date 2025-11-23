import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient, Status } from "@prisma/client";

dotenv.config();

// IMPORTANT: Make sure your Prisma schema has the following Status enum:
/*
enum Status {
  upcoming
  ongoing
  complete
  canceled
  released
  rumored
  planned
  in_production
  post_production
  pilot
  unknown
}
*/

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT version()`;
    res.json({
      success: true,
      message: "Database connection successful",
      version: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Helper function to check if donghua is Kids category
// Kids = genre ID 10762 (Kids) or genre name contains "Kids"/"Family"
async function isKidsDonghua(donghua: any): Promise<boolean> {
  // Check category field first
  if (donghua.category === "Kids") {
    return true;
  }

  // Check genre IDs (10762 = Kids, 16 = Animation might be kids)
  const genreIds = donghua.genreIds || [];
  if (genreIds.includes(10762)) {
    return true;
  }

  // Check genre names
  if (donghua.genres && Array.isArray(donghua.genres)) {
    const hasKidsGenre = donghua.genres.some(
      (g: any) =>
        g.name &&
        (g.name.toLowerCase().includes("kids") ||
          g.name.toLowerCase().includes("family"))
    );
    if (hasKidsGenre) {
      return true;
    }
  }

  // Check title/overview for kids keywords
  const title = (donghua.title || "").toLowerCase();
  const overview = (donghua.overview || "").toLowerCase();
  const kidsKeywords = ["kids", "children", "child", "family", "preschool"];
  if (
    kidsKeywords.some(
      (keyword) => title.includes(keyword) || overview.includes(keyword)
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Helper function to determine accurate status from TMDB data
 * Prioritizes release dates and TMDB status to determine if content is released
 */
function determineAccurateStatus(
  mediaType: "movie" | "tv",
  tmdbStatus: string | null,
  releaseDate: string | null,
  firstAirDate: string | null,
  numberOfEpisodes?: number,
  numberOfSeasons?: number
): Status {
  const now = new Date();

  // For Movies
  if (mediaType === "movie") {
    // Check release date first
    if (releaseDate) {
      const release = new Date(releaseDate);
      if (release > now) {
        return Status.upcoming; // Movie hasn't been released yet
      } else {
        // Movie has been released, check TMDB status
        const statusLower = (tmdbStatus || "").toLowerCase();
        if (statusLower === "released") {
          return Status.released;
        } else if (statusLower === "canceled" || statusLower === "cancelled") {
          return Status.canceled;
        } else if (statusLower === "post production") {
          return Status.post_production;
        } else if (statusLower === "in production") {
          return Status.in_production;
        } else {
          // Default to released if date has passed
          return Status.released;
        }
      }
    }

    // No release date, check TMDB status
    const statusLower = (tmdbStatus || "").toLowerCase();
    if (statusLower === "released") {
      return Status.released;
    } else if (statusLower === "canceled" || statusLower === "cancelled") {
      return Status.canceled;
    } else if (statusLower === "post production") {
      return Status.post_production;
    } else if (statusLower === "in production") {
      return Status.in_production;
    } else if (statusLower === "rumored") {
      return Status.rumored;
    } else if (statusLower === "planned") {
      return Status.planned;
    }

    return Status.upcoming; // Default for movies without clear status
  }

  // For TV Series
  if (mediaType === "tv") {
    const statusLower = (tmdbStatus || "").toLowerCase();

    // Check if series has started airing
    if (firstAirDate) {
      const airDate = new Date(firstAirDate);

      if (airDate > now) {
        // Series hasn't started yet
        return Status.upcoming;
      }

      // Series has started airing, check TMDB status
      if (statusLower === "returning series" || statusLower === "returning") {
        return Status.ongoing; // Currently airing with more episodes coming
      } else if (statusLower === "ended") {
        return Status.complete; // Series has finished
      } else if (statusLower === "canceled" || statusLower === "cancelled") {
        return Status.canceled;
      } else if (statusLower === "in production") {
        // If first air date has passed but still in production, it's ongoing
        return Status.ongoing;
      } else if (statusLower === "pilot") {
        return Status.pilot;
      } else if (statusLower === "planned") {
        return Status.upcoming;
      }

      // Default: if it has aired and has episodes, consider it ongoing
      if (numberOfEpisodes && numberOfEpisodes > 0) {
        return Status.ongoing;
      }

      // Has aired but no clear status
      return Status.ongoing;
    }

    // No air date yet, check TMDB status
    if (statusLower === "planned" || statusLower === "in production") {
      return Status.upcoming;
    } else if (statusLower === "ended") {
      return Status.complete;
    } else if (statusLower === "canceled" || statusLower === "cancelled") {
      return Status.canceled;
    } else if (
      statusLower === "returning series" ||
      statusLower === "returning"
    ) {
      return Status.ongoing;
    }

    return Status.upcoming; // Default for TV without clear status
  }

  return Status.unknown;
}

/**
 * Enhanced status mapping that respects TMDB data and release dates
 */
function getStatusFromTMDB(mediaType: "movie" | "tv", tmdbData: any): Status {
  return determineAccurateStatus(
    mediaType,
    tmdbData.status || null,
    tmdbData.release_date || null,
    tmdbData.first_air_date || null,
    tmdbData.number_of_episodes || 0,
    tmdbData.number_of_seasons || 0
  );
}

/**
 * Map TMDB numeric status IDs to IMDB status strings for Movies and TV Shows
 * For TV Shows:
 * 0 Returning Series -> "returning"
 * 1 Planned -> "planned"
 * 2 In Production -> "in_production"
 * 3 Ended -> "ended"
 * 4 Canceled -> "canceled"
 * 5 Pilot -> "pilot"
 *
 * For Movies:
 * 0 Rumored -> "rumored"
 * 1 Planned -> "planned"
 * 2 In Production -> "in_production"
 * 3 Post Production -> "post_production"
 * 4 Released -> "released"
 * 5 Canceled -> "canceled"
 *
 * @param mediaType "movie" or "tv"
 * @param tmdbStatusId number status from TMDB
 * @returns string mapped status to store in DB
 */
function mapTmdbStatusIdToStatus(
  mediaType: "movie" | "tv",
  tmdbStatusId: number | null | undefined
): string {
  if (mediaType === "tv") {
    switch (tmdbStatusId) {
      case 0:
        return "returning";
      case 1:
        return "planned";
      case 2:
        return "in_production";
      case 3:
        return "ended";
      case 4:
        return "canceled";
      case 5:
        return "pilot";
      default:
        return "unknown";
    }
  } else if (mediaType === "movie") {
    switch (tmdbStatusId) {
      case 0:
        return "rumored";
      case 1:
        return "planned";
      case 2:
        return "in_production";
      case 3:
        return "post_production";
      case 4:
        return "released";
      case 5:
        return "canceled";
      default:
        return "unknown";
    }
  }
  return "unknown";
}

async function enrichDonghuaData(
  donghua: any,
  updateDb: boolean = false
): Promise<any> {
  const releasedEpisodesCount = donghua.episodes?.length || 0;

  // Use status from database, don't auto-calculate
  // Status should be set manually or during import
  const status = donghua.status || null;

  return {
    ...donghua,
    status,
    released_episodes_count: releasedEpisodesCount,
  };
}

/**
 * Map TMDB string status to numeric TMDB status ID for movie or tv
 * @param statusStr string TMDB status string
 * @param mediaType "movie" or "tv"
 * @returns TMDB numeric status ID or null if unknown
 */
function mapTmdbStatusStringToId(
  statusStr: string | null | undefined,
  mediaType: "movie" | "tv"
): number | null {
  if (!statusStr) return null;
  const s = statusStr.toLowerCase();
  if (mediaType === "tv") {
    switch (s) {
      case "returning series":
        return 0;
      case "planned":
        return 1;
      case "in production":
        return 2;
      case "ended":
        return 3;
      case "canceled":
      case "cancelled":
        return 4;
      case "pilot":
        return 5;
      default:
        return null;
    }
  } else if (mediaType === "movie") {
    switch (s) {
      case "rumored":
        return 0;
      case "planned":
        return 1;
      case "in production":
        return 2;
      case "post production":
        return 3;
      case "released":
        return 4;
      case "canceled":
      case "cancelled":
        return 5;
      default:
        return null;
    }
  }
  return null;
}

// Get all donghua
app.get("/api/donghua", async (req, res) => {
  try {
    const donghuas = await prisma.donghua.findMany({
      include: {
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
        genres: true, // Include genres relation
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert enum values to strings for Prisma Client error avoidance
    const donghuasWithStringStatus = donghuas.map((item: any) => {
      if (item.status && typeof item.status !== "string") {
        item.status = String(item.status);
      }
      return item;
    });

    // Enrich each donghua with status and released episodes count
    // Update status in database if needed
    const enrichedDonghuas = await Promise.all(
      donghuasWithStringStatus.map((donghua) =>
        enrichDonghuaData(donghua, true)
      )
    );

    console.log(`✅ Fetched ${enrichedDonghuas.length} donghua from database`);
    res.json(enrichedDonghuas);
  } catch (error) {
    console.error("❌ Error fetching all donghua:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// IMPORTANT: Specific routes MUST be defined BEFORE parameterized routes
// Get Ongoing Donghua (from Database)
// Include both TV series and Movies
app.get("/api/donghua/ongoing", async (req, res) => {
  try {
    const donghuas = await prisma.donghua.findMany({
      where: {
        status: "ongoing",
        OR: [{ mediaType: "tv" }, { mediaType: "movie" }],
      },
      include: {
        genres: true,
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
      },
      orderBy: {
        voteAverage: "desc",
      },
      take: 12,
    });

    const enrichedDonghuas = await Promise.all(
      donghuas.map((donghua) => enrichDonghuaData(donghua, false))
    );

    console.log("✅ Ongoing donghua from DB:", enrichedDonghuas.length);
    res.json({ results: enrichedDonghuas });
  } catch (error) {
    console.error("❌ Error fetching ongoing donghua:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      results: [],
    });
  }
});

// Get Latest Release Donghua (from Database)
// EXCLUDE Kids category
// Include both TV series and Movies
app.get("/api/donghua/latest", async (req, res) => {
  try {
    const where: any = {
      OR: [
        {
          mediaType: "tv",
          firstAirDate: {
            not: null,
          },
        },
        {
          mediaType: "movie",
          releaseDate: {
            not: null,
          },
        },
      ],
      voteCount: {
        gte: 5,
      },
    };

    // Exclude Kids by genre (category field may not exist yet)
    const kidsGenre = await prisma.genre.findFirst({
      where: {
        OR: [
          { id: 10762 }, // Kids
          { name: { contains: "Kids", mode: "insensitive" } },
        ],
      },
    });

    if (kidsGenre) {
      where.NOT = {
        genreIds: {
          has: kidsGenre.id,
        },
      };
    }

    const donghuas = await prisma.donghua.findMany({
      where,
      include: {
        genres: true,
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20, // Fetch more to account for filtering
    });

    // Filter out Kids donghua that might have passed through (double check by genre)
    const filteredDonghuas: any[] = [];
    for (const donghua of donghuas) {
      const isKids = await isKidsDonghua(donghua);
      if (!isKids) {
        filteredDonghuas.push(donghua);
      }
    }

    // Sort by date (firstAirDate for TV, releaseDate for movies) and take top 12
    filteredDonghuas.sort((a: any, b: any) => {
      const dateA = a.firstAirDate || a.releaseDate;
      const dateB = b.firstAirDate || b.releaseDate;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    const finalDonghuas = filteredDonghuas.slice(0, 12);

    const enrichedDonghuas = await Promise.all(
      finalDonghuas.map((donghua) => enrichDonghuaData(donghua, false))
    );

    console.log(
      "✅ Latest donghua from DB (excluded Kids):",
      enrichedDonghuas.length
    );
    res.json({ results: enrichedDonghuas });
  } catch (error) {
    console.error("❌ Error fetching latest donghua:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      results: [],
    });
  }
});

// Get Trending Donghua (from Database - sorted by popularity/vote count)
// EXCLUDE Kids category
// Include both TV series and Movies
app.get("/api/donghua/trending", async (req, res) => {
  try {
    // Get Kids genre ID for exclusion
    const kidsGenre = await prisma.genre.findFirst({
      where: {
        OR: [
          { id: 10762 }, // Kids
          { name: { contains: "Kids", mode: "insensitive" } },
        ],
      },
    });

    const where: any = {
      OR: [{ mediaType: "tv" }, { mediaType: "movie" }],
      voteCount: {
        gt: 0,
      },
    };

    // Exclude Kids by genre (category field may not exist yet)
    if (kidsGenre) {
      where.NOT = {
        genreIds: {
          has: kidsGenre.id,
        },
      };
    }

    const donghuas = await prisma.donghua.findMany({
      where,
      include: {
        genres: true,
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
      },
      orderBy: [
        { voteAverage: "desc" },
        { voteCount: "desc" },
        { createdAt: "desc" },
      ],
      take: 10,
    });

    // Filter out Kids donghua that might have passed through (double check)
    const filteredDonghuas: any[] = [];
    for (const donghua of donghuas) {
      const isKids = await isKidsDonghua(donghua);
      if (!isKids) {
        filteredDonghuas.push(donghua);
      }
    }

    const enrichedDonghuas = await Promise.all(
      filteredDonghuas.map((donghua: any) => enrichDonghuaData(donghua, false))
    );

    console.log(
      "✅ Trending donghua from DB (excluded Kids):",
      enrichedDonghuas.length
    );
    res.json({ results: enrichedDonghuas });
  } catch (error) {
    console.error("❌ Error fetching trending donghua:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      results: [],
    });
  }
});

// Get Top Rated Donghua (from Database)
// EXCLUDE Kids category
// Include both TV series and Movies
app.get("/api/donghua/top-rated", async (req, res) => {
  try {
    const where: any = {
      OR: [{ mediaType: "tv" }, { mediaType: "movie" }],
      voteCount: {
        gte: 100,
      },
    };

    // Exclude Kids by genre (category field may not exist yet)
    const kidsGenre = await prisma.genre.findFirst({
      where: {
        OR: [
          { id: 10762 }, // Kids
          { name: { contains: "Kids", mode: "insensitive" } },
        ],
      },
    });

    if (kidsGenre) {
      where.NOT = {
        genreIds: {
          has: kidsGenre.id,
        },
      };
    }

    const donghuas = await prisma.donghua.findMany({
      where,
      include: {
        genres: true,
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
      },
      orderBy: {
        voteAverage: "desc",
      },
      take: 12,
    });

    // Filter out Kids donghua that might have passed through (double check by genre)
    const filteredDonghuas: any[] = [];
    for (const donghua of donghuas) {
      const isKids = await isKidsDonghua(donghua);
      if (!isKids) {
        filteredDonghuas.push(donghua);
      }
    }

    const enrichedDonghuas = await Promise.all(
      filteredDonghuas.map((donghua: any) => enrichDonghuaData(donghua, false))
    );

    console.log(
      "✅ Top rated donghua from DB (excluded Kids):",
      enrichedDonghuas.length
    );
    res.json({ results: enrichedDonghuas });
  } catch (error) {
    console.error("❌ Error fetching top rated donghua:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      results: [],
    });
  }
});

// Get Recommendations for a Donghua (from Database - based on genres)
// EXCLUDE Kids category
app.get("/api/donghua/recommend/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid donghua ID", results: [] });
    }

    // Get the base donghua to find similar ones
    const baseDonghua = await prisma.donghua.findUnique({
      where: { id },
      include: {
        genres: true,
      },
    });

    if (!baseDonghua) {
      return res.status(404).json({ error: "Donghua not found", results: [] });
    }

    // Get Kids genre ID for exclusion
    const kidsGenre = await prisma.genre.findFirst({
      where: {
        OR: [
          { id: 10762 }, // Kids
          { name: { contains: "Kids", mode: "insensitive" } },
        ],
      },
    });

    // Get genre IDs from base donghua
    const genreIds = baseDonghua.genreIds || [];

    const where: any = {
      id: { not: id },
      OR: [{ mediaType: "tv" }, { mediaType: "movie" }],
      genreIds: {
        hasSome: genreIds.length > 0 ? genreIds : [],
      },
    };

    // Exclude Kids by genre (category field may not exist yet)
    if (kidsGenre) {
      where.NOT = {
        genreIds: {
          has: kidsGenre.id,
        },
      };
    }

    // Find similar donghua based on shared genres
    const recommendations = await prisma.donghua.findMany({
      where,
      include: {
        genres: true,
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
      },
      orderBy: [{ voteAverage: "desc" }, { voteCount: "desc" }],
      take: 12,
    });

    // Filter out Kids donghua that might have passed through
    const filteredRecommendations: any[] = [];
    for (const donghua of recommendations) {
      const isKids = await isKidsDonghua(donghua);
      if (!isKids) {
        filteredRecommendations.push(donghua);
      }
    }

    const enrichedRecommendations = await Promise.all(
      filteredRecommendations.map((donghua: any) =>
        enrichDonghuaData(donghua, false)
      )
    );

    console.log(
      "✅ Recommendations from DB (excluded Kids):",
      enrichedRecommendations.length
    );
    res.json({ results: enrichedRecommendations });
  } catch (error) {
    console.error("❌ Error fetching recommendations:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      results: [],
    });
  }
});

// Get Donghua by Genre (from Database)
// Genre names: xianxia, cultivation, fantasy-chinese, wuxia, action
// EXCLUDE Kids category
app.get("/api/donghua/genre/:genreName", async (req, res) => {
  try {
    const { genreName } = req.params;

    // Get Kids genre ID for exclusion
    const kidsGenre = await prisma.genre.findFirst({
      where: {
        OR: [
          { id: 10762 }, // Kids
          { name: { contains: "Kids", mode: "insensitive" } },
        ],
      },
    });

    // Map genre names to search terms
    const searchTerms: Record<string, string[]> = {
      xianxia: ["xianxia", "immortal", "cultivation"],
      cultivation: ["cultivation", "cultivator", "cultivating"],
      "fantasy-chinese": ["fantasy", "chinese fantasy", "fantasy chinese"],
      wuxia: ["wuxia", "martial arts", "martial"],
      action: ["action", "adventure"],
    };

    const searchKeywords = searchTerms[genreName] || [genreName];

    // Find genre by name first
    let genreId: number | null = null;
    const orConditions: any[] = [
      { name: { contains: genreName, mode: "insensitive" } },
    ];

    searchKeywords.forEach((term) => {
      orConditions.push({
        name: { contains: term, mode: "insensitive" },
      });
    });

    const genre = await prisma.genre.findFirst({
      where: {
        OR: orConditions,
      },
    });

    if (genre) {
      genreId = genre.id;
    }

    const where: any = {
      OR: [{ mediaType: "tv" }, { mediaType: "movie" }],
    };

    // Build OR conditions for search
    const searchConditions: any[] = [];

    // If we found a genre, filter by it
    if (genreId) {
      searchConditions.push({
        genreIds: {
          has: genreId,
        },
      });
    }

    // Also search by keywords in database (if stored)
    // And search by title/overview containing genre name
    searchKeywords.forEach((keyword) => {
      searchConditions.push(
        { title: { contains: keyword, mode: "insensitive" } },
        { overview: { contains: keyword, mode: "insensitive" } },
        { chineseTitle: { contains: keyword, mode: "insensitive" } }
      );
    });

    if (searchConditions.length > 0) {
      where.OR = searchConditions;
    }

    // Exclude Kids by genre (kidsGenre already declared above)
    if (kidsGenre) {
      where.NOT = {
        genreIds: {
          has: kidsGenre.id,
        },
      };
    }

    const donghuas = await prisma.donghua.findMany({
      where,
      include: {
        genres: true,
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
      },
      orderBy: {
        voteAverage: "desc",
      },
      take: 12,
    });

    // Filter out Kids donghua that might have passed through
    const filteredDonghuas: any[] = [];
    for (const donghua of donghuas) {
      const isKids = await isKidsDonghua(donghua);
      if (!isKids) {
        filteredDonghuas.push(donghua);
      }
    }

    const enrichedDonghuas = await Promise.all(
      filteredDonghuas.map((donghua: any) => enrichDonghuaData(donghua, false))
    );

    console.log(
      `✅ ${genreName} donghua from DB (excluded Kids):`,
      enrichedDonghuas.length
    );
    res.json({ results: enrichedDonghuas });
  } catch (error) {
    console.error(`❌ Error fetching ${req.params.genreName} donghua:`, error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      results: [],
    });
  }
});

// Get Kids Corner Donghua (from Database)
// ONLY Kids category - this is the ONLY place Kids should appear
app.get("/api/donghua/kids", async (req, res) => {
  try {
    // Find Kids genre (ID: 10762)
    const kidsGenre = await prisma.genre.findFirst({
      where: {
        OR: [
          { id: 10762 }, // Kids
          { name: { contains: "Kids", mode: "insensitive" } },
          { name: { contains: "Family", mode: "insensitive" } },
        ],
      },
    });

    const where: any = {
      mediaType: "tv",
      // Only Kids category
      category: "Kids",
    };

    // Also include by genre if Kids genre exists
    if (kidsGenre) {
      where.OR = [{ category: "Kids" }, { genreIds: { has: kidsGenre.id } }];
    } else {
      // Fallback: search by title containing "kids" or "children"
      where.OR = [
        { category: "Kids" },
        { title: { contains: "kids", mode: "insensitive" } },
        { title: { contains: "children", mode: "insensitive" } },
        { overview: { contains: "kids", mode: "insensitive" } },
      ];
    }

    const donghuas = await prisma.donghua.findMany({
      where,
      include: {
        genres: true,
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
      },
      orderBy: {
        voteAverage: "desc",
      },
      take: 20,
    });

    // Double-check: only include confirmed Kids donghua
    const confirmedKids: any[] = [];
    for (const donghua of donghuas) {
      const isKids = await isKidsDonghua(donghua);
      if (isKids) {
        confirmedKids.push(donghua);
      }
    }

    const enrichedDonghuas = await Promise.all(
      confirmedKids.map((donghua: any) => enrichDonghuaData(donghua, false))
    );

    console.log("✅ Kids donghua from DB:", enrichedDonghuas.length);
    res.json({ results: enrichedDonghuas });
  } catch (error) {
    console.error("❌ Error fetching kids donghua:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      results: [],
    });
  }
});

// Get donghua by ID (MUST be after specific routes)
app.get("/api/donghua/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validate that id is a valid number
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid donghua ID" });
    }

    const donghua = await prisma.donghua.findUnique({
      where: { id },
      include: {
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
        genres: true, // Include genres relation
      },
    });

    if (!donghua) {
      return res.status(404).json({ error: "Donghua not found" });
    }

    // Enrich donghua with status and released episodes count
    // Update status in database if needed
    const enrichedDonghua = await enrichDonghuaData(donghua, true);

    res.json(enrichedDonghua);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get episodes by donghua ID
app.get("/api/donghua/:id/episodes", async (req, res) => {
  try {
    const donghuaId = parseInt(req.params.id);

    // Validate that donghuaId is a valid number
    if (isNaN(donghuaId)) {
      return res.status(400).json({ error: "Invalid donghua ID" });
    }

    const episodes = await prisma.episode.findMany({
      where: { donghuaId },
      orderBy: {
        episodeNumber: "asc",
      },
    });
    res.json(episodes);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get episode by ID
app.get("/api/episodes/:id", async (req, res) => {
  try {
    const episode = await prisma.episode.findUnique({
      where: { id: req.params.id },
      include: {
        donghua: {
          include: {
            genres: true, // Include genres relation
          },
        },
      },
    });

    if (!episode) {
      return res.status(404).json({ error: "Episode not found" });
    }

    res.json(episode);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Search donghua
app.get("/api/search", async (req, res) => {
  try {
    const { q, genre, status, sortBy } = req.query;

    const where: any = {};

    if (q) {
      where.OR = [
        { title: { contains: q as string, mode: "insensitive" } },
        { chineseTitle: { contains: q as string, mode: "insensitive" } },
        { overview: { contains: q as string, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (genre) {
      where.genreIds = {
        has: parseInt(genre as string),
      };
    }

    const orderBy: any = {};
    if (sortBy === "latest") {
      orderBy.createdAt = "desc";
    } else if (sortBy === "popularity") {
      orderBy.voteAverage = "desc";
    } else {
      orderBy.title = "asc";
    }

    const donghuas = await prisma.donghua.findMany({
      where,
      include: {
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
        genres: true, // Include genres relation
      },
      orderBy,
    });

    // Enrich each donghua with status and released episodes count
    const enrichedDonghuas = await Promise.all(
      donghuas.map((donghua) => enrichDonghuaData(donghua, false))
    );

    res.json(enrichedDonghuas);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Admin: Create donghua
app.post("/api/admin/donghua", async (req, res) => {
  try {
    const {
      tmdbId,
      title,
      chineseTitle,
      overview,
      synopsis,
      posterPath,
      backdropPath,
      posters,
      releaseDate,
      voteAverage,
      voteCount,
      status,
      episodeCount,
      mediaType,
      genreIds,
    } = req.body;

    // Ensure genres exist and prepare connections
    const genreConnections: Array<{ id: number }> = [];
    if (genreIds && Array.isArray(genreIds) && genreIds.length > 0) {
      for (const genreId of genreIds) {
        // Ensure genre exists
        await prisma.genre.upsert({
          where: { id: genreId },
          update: {},
          create: { id: genreId, name: `Genre ${genreId}` }, // Will be updated if needed
        });
        genreConnections.push({ id: genreId });
      }
    }

    // Normalize status: convert "completed" to "complete" for database compatibility
    const normalizedStatus =
      status === "completed" ? Status.complete : (status as Status);

    const donghua = await prisma.donghua.create({
      data: {
        tmdbId,
        title,
        chineseTitle:
          chineseTitle && chineseTitle.trim() !== ""
            ? chineseTitle.trim()
            : null,
        overview: overview || "",
        synopsis: synopsis && synopsis.trim() !== "" ? synopsis.trim() : null,
        posterPath,
        backdropPath,
        posters: posters || [],
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        voteAverage: voteAverage || 0,
        voteCount: voteCount || 0,
        status: normalizedStatus,
        episodeCount: episodeCount || 0,
        mediaType,
        genreIds: genreIds || [],
        genres: {
          connect: genreConnections, // Connect genres using Prisma relation
        },
      },
      include: {
        genres: true, // Include genres in response
      },
    });

    res.status(201).json(donghua);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Admin: Update donghua
app.put("/api/admin/donghua/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validate that id is a valid number
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid donghua ID" });
    }

    const {
      tmdbId,
      title,
      chineseTitle,
      overview,
      synopsis,
      posterPath,
      backdropPath,
      posters,
      releaseDate,
      firstAirDate,
      voteAverage,
      voteCount,
      status,
      episodeCount,
      mediaType,
      genreIds,
    } = req.body;

    // Prepare genre connections if genreIds provided
    let genreUpdate: any = undefined;
    if (genreIds !== undefined && Array.isArray(genreIds)) {
      const genreConnections: Array<{ id: number }> = [];
      for (const genreId of genreIds) {
        // Ensure genre exists
        await prisma.genre.upsert({
          where: { id: genreId },
          update: {},
          create: { id: genreId, name: `Genre ${genreId}` },
        });
        genreConnections.push({ id: genreId });
      }
      genreUpdate = {
        set: genreConnections, // Replace all genres
      };
    }

    // Normalize status: convert "completed" to "complete" for database compatibility
    const normalizedStatus =
      status === "completed" ? Status.complete : (status as Status);

    const updateData: any = {
      tmdbId: tmdbId !== undefined ? tmdbId : undefined,
      title,
      chineseTitle:
        chineseTitle !== undefined
          ? chineseTitle && chineseTitle.trim() !== ""
            ? chineseTitle.trim()
            : null
          : undefined,
      overview,
      synopsis:
        synopsis !== undefined
          ? synopsis && synopsis.trim() !== ""
            ? synopsis.trim()
            : null
          : undefined,
      posterPath,
      backdropPath,
      posters: posters !== undefined ? posters : undefined,
      releaseDate: releaseDate ? new Date(releaseDate) : undefined,
      firstAirDate: firstAirDate ? new Date(firstAirDate) : undefined,
      voteAverage,
      voteCount,
      status: normalizedStatus,
      episodeCount,
      mediaType,
      genreIds: genreIds !== undefined ? genreIds : undefined,
    };

    if (genreUpdate) {
      updateData.genres = genreUpdate;
    }

    const donghua = await prisma.donghua.update({
      where: { id },
      data: updateData,
      include: {
        genres: true, // Include genres in response
        episodes: true, // Include episodes to calculate status
      },
    });

    // Auto-calculate and update status if not provided
    const enrichedDonghua = await enrichDonghuaData(donghua, true);

    res.json(enrichedDonghua);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Admin: Delete donghua
app.delete("/api/admin/donghua/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validate that id is a valid number
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid donghua ID" });
    }

    // Episodes will be deleted automatically due to cascade
    await prisma.donghua.delete({
      where: { id },
    });

    res.json({ success: true, message: "Donghua deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Admin: Create episode
app.post("/api/admin/episodes", async (req, res) => {
  try {
    const {
      donghuaId,
      episodeNumber,
      title,
      thumbnail,
      duration,
      airDate,
      servers,
      subtitles,
      tmdbEpisodeId,
      overview,
      stillPath,
      crew,
      guestStars,
      voteAverage,
      voteCount,
      productionCode,
      seasonNumber,
    } = req.body;

    const episodeId = `${donghuaId}-${episodeNumber}`;

    // Use upsert to avoid unique constraint error if episode already exists
    const episode = await prisma.episode.upsert({
      where: { id: episodeId },
      update: {
        title,
        thumbnail,
        duration,
        airDate: airDate ? new Date(airDate) : null,
        servers: servers || [],
        subtitles: subtitles || [],
        tmdbEpisodeId: tmdbEpisodeId ? parseInt(tmdbEpisodeId) : null,
        overview,
        stillPath,
        crew: crew || null,
        guestStars: guestStars || null,
        voteAverage: voteAverage ? parseFloat(voteAverage) : null,
        voteCount: voteCount ? parseInt(voteCount) : null,
        productionCode,
        seasonNumber: seasonNumber ? parseInt(seasonNumber) : null,
      },
      create: {
        id: episodeId,
        donghuaId: parseInt(donghuaId as string),
        episodeNumber: parseInt(episodeNumber as string),
        title,
        thumbnail,
        duration,
        airDate: airDate ? new Date(airDate) : null,
        servers: servers || [],
        subtitles: subtitles || [],
        tmdbEpisodeId: tmdbEpisodeId ? parseInt(tmdbEpisodeId) : null,
        overview,
        stillPath,
        crew: crew || null,
        guestStars: guestStars || null,
        voteAverage: voteAverage ? parseFloat(voteAverage) : null,
        voteCount: voteCount ? parseInt(voteCount) : null,
        productionCode,
        seasonNumber: seasonNumber ? parseInt(seasonNumber) : null,
      },
      include: {
        donghua: true,
      },
    });

    res.status(201).json(episode);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Admin: Update episode
app.put("/api/admin/episodes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      donghuaId,
      episodeNumber,
      title,
      thumbnail,
      duration,
      airDate,
      servers,
      subtitles,
      tmdbEpisodeId,
      overview,
      stillPath,
      crew,
      guestStars,
      voteAverage,
      voteCount,
      productionCode,
      seasonNumber,
    } = req.body;

    const episode = await prisma.episode.update({
      where: { id },
      data: {
        donghuaId: donghuaId ? parseInt(donghuaId as string) : undefined,
        episodeNumber: episodeNumber
          ? parseInt(episodeNumber as string)
          : undefined,
        title,
        thumbnail,
        duration,
        airDate: airDate ? new Date(airDate) : undefined,
        servers,
        subtitles,
        tmdbEpisodeId:
          tmdbEpisodeId !== undefined
            ? tmdbEpisodeId
              ? parseInt(tmdbEpisodeId)
              : null
            : undefined,
        overview,
        stillPath,
        crew,
        guestStars,
        voteAverage:
          voteAverage !== undefined
            ? voteAverage
              ? parseFloat(voteAverage)
              : null
            : undefined,
        voteCount:
          voteCount !== undefined
            ? voteCount
              ? parseInt(voteCount)
              : null
            : undefined,
        productionCode,
        seasonNumber:
          seasonNumber !== undefined
            ? seasonNumber
              ? parseInt(seasonNumber)
              : null
            : undefined,
      },
      include: {
        donghua: true,
      },
    });

    res.json(episode);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Admin: Delete episode
app.delete("/api/admin/episodes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.episode.delete({
      where: { id },
    });

    res.json({ success: true, message: "Episode deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Admin: Get statistics
app.get("/api/admin/statistics", async (req, res) => {
  try {
    const [
      totalDonghua,
      totalEpisodes,
      donghuaByStatus,
      donghuaByType,
      totalGenres,
    ] = await Promise.all([
      prisma.donghua.count(),
      prisma.episode.count(),
      prisma.donghua.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.donghua.groupBy({
        by: ["mediaType"],
        _count: true,
      }),
      prisma.genre.count(),
    ]);

    res.json({
      totalDonghua,
      totalEpisodes,
      donghuaByStatus: donghuaByStatus.reduce((acc, item) => {
        acc[item.status || "unknown"] = item._count;
        return acc;
      }, {} as Record<string, number>),
      donghuaByType: donghuaByType.reduce((acc, item) => {
        acc[item.mediaType || "unknown"] = item._count;
        return acc;
      }, {} as Record<string, number>),
      totalGenres,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Admin: Import donghua from TMDB (for admin only)
// This endpoint imports popular donghua from TMDB and saves to database
app.post("/api/admin/import/tmdb", async (req, res) => {
  try {
    const { type = "popular", limit = 20 } = req.body; // type: 'popular', 'trending', 'top_rated'

    console.log(
      `🔍 Admin importing ${type} donghua from TMDB (limit: ${limit})`
    );

    let endpoint = "";
    let mediaType = "tv";
    if (type === "popular") {
      // Use discover endpoint with proper filters for donghua TV series
      // Animation genre (16) + Chinese origin + Chinese language, exclude Family (10751) and Kids (10762)
      endpoint = `/discover/tv?with_genres=16&with_origin_country=CN&with_original_language=zh&without_genres=10751,10762&include_adult=false&sort_by=popularity.desc&page=1&language=zh`;
      mediaType = "tv";
    } else if (type === "trending") {
      // Use discover endpoint for trending donghua TV series
      endpoint = `/discover/tv?with_genres=16&with_origin_country=CN&with_original_language=zh&without_genres=10751,10762&include_adult=false&sort_by=popularity.desc&page=1&language=zh`;
      mediaType = "tv";
    } else if (type === "top_rated") {
      // Use discover endpoint for top rated donghua TV series
      endpoint = `/discover/tv?with_genres=16&with_origin_country=CN&with_original_language=zh&without_genres=10751,10762&include_adult=false&sort_by=vote_average.desc&page=1&language=zh`;
      mediaType = "tv";
    } else if (type === "movie_popular") {
      // Anime movies (Chinese) - Animation genre (16) + Chinese origin
      endpoint = `/discover/movie?with_origin_country=CN&with_original_language=zh&with_genres=16&without_genres=10751,10762&include_adult=false&sort_by=popularity.desc&page=1&language=zh`;
      mediaType = "movie";
    } else if (type === "movie_top_rated") {
      // Anime movies (Chinese) - Animation genre (16) + Chinese origin
      endpoint = `/discover/movie?with_origin_country=CN&with_original_language=zh&with_genres=16&without_genres=10751,10762&include_adult=false&sort_by=vote_average.desc&page=1&language=zh`;
      mediaType = "movie";
    } else if (type === "movie_china_popular") {
      // Chinese movies (non-anime) - NO Animation genre, exclude Family and Kids
      endpoint = `/discover/movie?with_origin_country=CN&with_original_language=zh&without_genres=16,10751,10762&include_adult=false&sort_by=popularity.desc&page=1&language=zh`;
      mediaType = "movie";
    } else if (type === "movie_china_top_rated") {
      // Chinese movies (non-anime) - NO Animation genre, exclude Family and Kids
      endpoint = `/discover/movie?with_origin_country=CN&with_original_language=zh&without_genres=16,10751,10762&include_adult=false&sort_by=vote_average.desc&page=1&language=zh`;
      mediaType = "movie";
    } else {
      return res.status(400).json({
        error:
          "Invalid type. Use: popular, trending, top_rated, movie_popular, movie_top_rated, movie_china_popular, or movie_china_top_rated",
      });
    }

    const data = await fetchFromTMDB(endpoint);
    const results = data.results || [];
    const itemsToImport = results.slice(0, limit);

    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (const item of itemsToImport) {
      try {
        // Only import Chinese origin content
        // origin_country can be an array or string
        const originCountry = Array.isArray(item.origin_country)
          ? item.origin_country
          : item.origin_country
          ? [item.origin_country]
          : [];
        if (!originCountry.includes("CN")) {
          console.log(
            `⏭️ Skipping non-Chinese content: ${
              item.name || item.title
            } (origin: ${JSON.stringify(originCountry)})`
          );
          continue;
        }

        // Check if it's Kids content - skip if it is
        const genreIds = item.genre_ids || [];
        const isKids =
          genreIds.includes(10762) || // Kids genre
          (item.genre_ids &&
            item.genre_ids.some((id: number) => id === 10762)) ||
          (item.title &&
            /kids|children|child|family|preschool/i.test(item.title)) ||
          (item.overview &&
            /kids|children|child|family|preschool/i.test(item.overview));

        if (isKids) {
          console.log(`⏭️ Skipping Kids content: ${item.name || item.title}`);
          continue;
        }

        // Determine media type and fetch details
        const mediaType =
          item.media_type || (type.includes("movie") ? "movie" : "tv");
        const detailEndpoint =
          mediaType === "movie"
            ? `/movie/${item.id}?language=zh`
            : `/tv/${item.id}?language=zh`;
        const detail = await fetchFromTMDB(detailEndpoint);

        // Extract genres and filter out Kids
        const allGenreIds = detail.genres?.map((g: any) => g.id) || [];
        const genreIdsFiltered = allGenreIds.filter(
          (id: number) => id !== 10762
        ); // Exclude Kids genre

        // Check genre names for Kids
        const hasKidsGenre = detail.genres?.some(
          (g: any) =>
            g.name &&
            (g.name.toLowerCase().includes("kids") ||
              g.name.toLowerCase().includes("family"))
        );

        if (hasKidsGenre || genreIdsFiltered.length !== allGenreIds.length) {
          console.log(
            `⏭️ Skipping Kids content (genre check): ${
              detail.name || detail.title
            }`
          );
          continue;
        }

        // Ensure genres exist (excluding Kids)
        const genreConnections: Array<{ id: number }> = [];
        for (const genre of detail.genres || []) {
          if (
            genre.id === 10762 ||
            (genre.name &&
              (genre.name.toLowerCase().includes("kids") ||
                genre.name.toLowerCase().includes("family")))
          ) {
            continue; // Skip Kids genre
          }
          await prisma.genre.upsert({
            where: { id: genre.id },
            update: { name: genre.name },
            create: { id: genre.id, name: genre.name },
          });
          genreConnections.push({ id: genre.id });
        }

        // Use new accurate status function
        const status = getStatusFromTMDB(mediaType as "movie" | "tv", detail);

        // Auto-set synopsis from overview
        const synopsis = detail.overview || "";

        // Auto-set release dates
        const releaseDate =
          mediaType === "movie" && detail.release_date
            ? new Date(detail.release_date)
            : null;
        const firstAirDate =
          mediaType === "tv" && detail.first_air_date
            ? new Date(detail.first_air_date)
            : null;

        // Get images
        const imagesEndpoint =
          mediaType === "movie"
            ? `/movie/${item.id}/images`
            : `/tv/${item.id}/images`;
        const imagesData = await fetchFromTMDB(imagesEndpoint);
        const posters = imagesData.posters?.map((p: any) => p.file_path) || [];
        if (detail.poster_path && !posters.includes(detail.poster_path)) {
          posters.unshift(detail.poster_path);
        }

        // Upsert donghua
        const existing = await prisma.donghua.findUnique({
          where: { tmdbId: item.id },
        });

        await prisma.donghua.upsert({
          where: { tmdbId: item.id },
          update: {
            title: detail.name || detail.title || item.name || item.title,
            chineseTitle:
              detail.original_name ||
              detail.original_title ||
              detail.name ||
              detail.title,
            overview: detail.overview || "",
            synopsis: synopsis, // Auto-set from overview
            posterPath: detail.poster_path || "",
            backdropPath: detail.backdrop_path || "",
            posters: posters,
            releaseDate: releaseDate, // Auto-set from TMDB
            firstAirDate: firstAirDate, // Auto-set from TMDB
            voteAverage: detail.vote_average || 0,
            voteCount: detail.vote_count || 0,
            status: status, // Auto-determined from TMDB
            episodeCount:
              mediaType === "tv" ? detail.number_of_episodes || 0 : 0,
            mediaType: mediaType,
            genreIds: genreIdsFiltered, // Filtered (no Kids)
            genres: {
              set: genreConnections, // Filtered (no Kids)
            },
          },
          create: {
            tmdbId: item.id,
            title: detail.name || detail.title || item.name || item.title,
            chineseTitle:
              detail.original_name ||
              detail.original_title ||
              detail.name ||
              detail.title,
            overview: detail.overview || "",
            synopsis: synopsis, // Auto-set from overview
            posterPath: detail.poster_path || "",
            backdropPath: detail.backdrop_path || "",
            posters: posters,
            releaseDate: releaseDate, // Auto-set from TMDB
            firstAirDate: firstAirDate, // Auto-set from TMDB
            voteAverage: detail.vote_average || 0,
            voteCount: detail.vote_count || 0,
            status: status, // Auto-determined from TMDB
            episodeCount:
              mediaType === "tv" ? detail.number_of_episodes || 0 : 0,
            mediaType: mediaType,
            genreIds: genreIdsFiltered, // Filtered (no Kids)
            genres: {
              connect: genreConnections, // Filtered (no Kids)
            },
          },
        });

        if (existing) {
          updated++;
          console.log(
            `✅ Updated: ${
              detail.name || detail.title
            } (status: ${status}, mediaType: ${mediaType})`
          );
        } else {
          imported++;
          console.log(
            `✅ Imported: ${
              detail.name || detail.title
            } (status: ${status}, mediaType: ${mediaType})`
          );
        }
      } catch (error) {
        console.error(`❌ Error importing donghua ${item.id}:`, error);
        errors++;
      }
    }

    console.log(
      `✅ Import complete: ${imported} imported, ${updated} updated, ${errors} errors`
    );
    res.json({
      success: true,
      message: `Import complete: ${imported} imported, ${updated} updated, ${errors} errors`,
      imported,
      updated,
      errors,
    });
  } catch (error) {
    console.error("❌ Error in TMDB import:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Helper function to fetch from TMDB
async function fetchFromTMDB(endpoint: string) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "") {
    throw new Error(
      "TMDB API Key is not configured. Please set TMDB_API_KEY environment variable."
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
  // Log response structure for debugging
  if (!data.results || data.results.length === 0) {
    console.warn(
      "⚠️ TMDB returned empty results. Response keys:",
      Object.keys(data)
    );
    if (data.total_results !== undefined) {
      console.warn("⚠️ Total results from TMDB:", data.total_results);
    }
  }
  return data;
}

// Search TMDB by query
app.get("/api/tmdb/search", async (req, res) => {
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
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get TMDB data by ID and type
app.get("/api/tmdb/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    if (!["movie", "tv"].includes(type)) {
      return res
        .status(400)
        .json({ error: 'Invalid type. Must be "movie" or "tv"' });
    }

    const data = await fetchFromTMDB(`/${type}/${id}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get TMDB credits (cast & crew)
app.get("/api/tmdb/:type/:id/credits", async (req, res) => {
  try {
    const { type, id } = req.params;
    if (!["movie", "tv"].includes(type)) {
      return res
        .status(400)
        .json({ error: 'Invalid type. Must be "movie" or "tv"' });
    }

    const data = await fetchFromTMDB(`/${type}/${id}/credits`);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get TMDB videos (trailers, teasers, etc)
app.get("/api/tmdb/:type/:id/videos", async (req, res) => {
  try {
    const { type, id } = req.params;
    if (!["movie", "tv"].includes(type)) {
      return res
        .status(400)
        .json({ error: 'Invalid type. Must be "movie" or "tv"' });
    }

    const data = await fetchFromTMDB(`/${type}/${id}/videos`);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get TMDB episode full data
app.get(
  "/api/tmdb/tv/:tvId/season/:season/episode/:episode",
  async (req, res) => {
    try {
      const { tvId, season, episode } = req.params;

      const details = await fetchFromTMDB(
        `/tv/${tvId}/season/${season}/episode/${episode}`
      );
      const credits = await fetchFromTMDB(
        `/tv/${tvId}/season/${season}/episode/${episode}/credits`
      );
      const externalIds = await fetchFromTMDB(
        `/tv/${tvId}/season/${season}/episode/${episode}/external_ids`
      );
      const images = await fetchFromTMDB(
        `/tv/${tvId}/season/${season}/episode/${episode}/images`
      );
      const translations = await fetchFromTMDB(
        `/tv/${tvId}/season/${season}/episode/${episode}/translations`
      );
      const videos = await fetchFromTMDB(
        `/tv/${tvId}/season/${season}/episode/${episode}/videos`
      );
      const accountStates = await fetchFromTMDB(
        `/tv/${tvId}/season/${season}/episode/${episode}/account_states`
      );
      const keywords = await fetchFromTMDB(
        `/tv/${tvId}/season/${season}/episode/${episode}/keywords`
      );

      res.json({
        details,
        credits,
        externalIds,
        images,
        translations,
        videos,
        accountStates,
        keywords,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

app.post("/api/tmdb/sync", async (req, res) => {
  const startTime = Date.now();
  console.log("\n🔵 ========== SYNC REQUEST START ==========");
  console.log("📥 SYNC REQUEST BODY:", JSON.stringify(req.body, null, 2));

  try {
    const {
      tmdbId,
      type,
      status,
      chineseTitle,
      synopsis,
      voteAverage,
      voteCount,
      episodeCount,
      releaseDate,
      firstAirDate,
    } = req.body;

    // Validate required fields
    if (!tmdbId || !type) {
      console.error("❌ Missing required fields: tmdbId or type");
      return res.status(400).json({ error: "tmdbId and type are required" });
    }

    if (!["movie", "tv"].includes(type)) {
      console.error(`❌ Invalid type: "${type}". Must be "movie" or "tv"`);
      return res
        .status(400)
        .json({ error: 'Invalid type. Must be "movie" or "tv"' });
    }

    console.log(`✅ Validated: tmdbId=${tmdbId}, type=${type}`);

    // Check if donghua already exists
    const existing = await prisma.donghua.findUnique({
      where: { tmdbId: parseInt(tmdbId) },
    });

    if (existing) {
      console.log(`⚠️ Donghua with TMDB ID ${tmdbId} already exists:`, {
        id: existing.id,
        title: existing.title,
      });
      return res.status(409).json({
        error: "Donghua with this TMDB ID already exists",
        donghua: existing,
      });
    }

    console.log(`🔍 Fetching TMDB data for ${type}/${tmdbId}...`);
    // Fetch data from TMDB
    const tmdbData = await fetchFromTMDB(`/${type}/${tmdbId}`);
    console.log("✅ TMDB DETAIL received:", {
      id: tmdbData.id,
      title: tmdbData.title || tmdbData.name,
      status: tmdbData.status,
      release_date: tmdbData.release_date,
      first_air_date: tmdbData.first_air_date,
      vote_average: tmdbData.vote_average,
      vote_count: tmdbData.vote_count,
    });

    // Fetch images from TMDB to get multiple posters
    const imagesData = await fetchFromTMDB(`/${type}/${tmdbId}/images`);
    const posters = imagesData.posters?.map((p: any) => p.file_path) || [];
    // Include main poster if not in posters array
    if (tmdbData.poster_path && !posters.includes(tmdbData.poster_path)) {
      posters.unshift(tmdbData.poster_path);
    }

    // Fetch translations to get Chinese title
    let extractedChineseTitle =
      chineseTitle && chineseTitle.trim() !== "" ? chineseTitle.trim() : null;
    try {
      const translationsData = await fetchFromTMDB(
        `/${type}/${tmdbId}/translations`
      );
      if (translationsData.translations) {
        // Find Chinese translation (zh, zh-CN, zh-TW)
        const chineseTranslation = translationsData.translations.find(
          (t: any) =>
            t.iso_639_1 === "zh" ||
            t.iso_639_1 === "cn" ||
            t.iso_3166_1 === "CN"
        );
        if (chineseTranslation && chineseTranslation.data) {
          // Try to get title from translation data
          const translatedTitle =
            chineseTranslation.data.title || chineseTranslation.data.name;
          if (translatedTitle && translatedTitle.trim() !== "") {
            extractedChineseTitle = translatedTitle.trim();
          }
        }
      }
    } catch (translationError) {
      // If translation fetch fails, continue without it
      console.error("Error fetching translations:", translationError);
    }

    // Try alternative titles if translations didn't work
    if (!extractedChineseTitle) {
      try {
        const altTitlesData = await fetchFromTMDB(
          `/${type}/${tmdbId}/alternative_titles`
        );
        if (altTitlesData.titles || altTitlesData.results) {
          const titles = altTitlesData.titles || altTitlesData.results || [];
          // Find Chinese title
          const chineseAltTitle = titles.find(
            (t: any) =>
              t.iso_3166_1 === "CN" ||
              t.iso_3166_1 === "TW" ||
              t.iso_3166_1 === "HK"
          );
          if (chineseAltTitle && chineseAltTitle.title) {
            extractedChineseTitle = chineseAltTitle.title.trim();
          }
        }
      } catch (altTitleError) {
        // If alternative titles fetch fails, continue without it
        console.error("Error fetching alternative titles:", altTitleError);
      }
    }

    // Extract genres
    const genreIds = tmdbData.genres?.map((g: any) => g.id) || [];

    // Ensure genres exist in database and prepare for connection
    const genreConnections: Array<{ id: number }> = [];
    for (const genre of tmdbData.genres || []) {
      await prisma.genre.upsert({
        where: { id: genre.id },
        update: { name: genre.name },
        create: { id: genre.id, name: genre.name },
      });
      genreConnections.push({ id: genre.id });
    }

    // Fetch keywords from TMDB
    let keywords: any[] = [];
    try {
      // For TV series, use /tv/{id}/keywords endpoint
      // For movies, use /movie/{id}/keywords endpoint
      const keywordsEndpoint =
        type === "tv" ? `/tv/${tmdbId}/keywords` : `/movie/${tmdbId}/keywords`;

      const keywordsData = await fetchFromTMDB(keywordsEndpoint);

      // TV series returns { results: [...] }
      // Movies return { keywords: [...] }
      if (keywordsData.results && Array.isArray(keywordsData.results)) {
        keywords = keywordsData.results.map((k: any) => ({
          id: k.id,
          name: k.name,
        }));
      } else if (
        keywordsData.keywords &&
        Array.isArray(keywordsData.keywords)
      ) {
        keywords = keywordsData.keywords.map((k: any) => ({
          id: k.id,
          name: k.name,
        }));
      }
    } catch (keywordError) {
      // If keywords fetch fails, continue without it
      console.error("Error fetching keywords:", keywordError);
    }

    // Use new accurate status function
    console.log(
      `📊 Determining status for: ${tmdbData.title || tmdbData.name} (${type})`
    );
    console.log(`   TMDB status: "${tmdbData.status}"`);
    console.log(
      `   Release date: ${tmdbData.release_date || releaseDate || "N/A"}`
    );
    console.log(
      `   First air date: ${tmdbData.first_air_date || firstAirDate || "N/A"}`
    );

    let calculatedStatus: Status = status
      ? (status as Status)
      : getStatusFromTMDB(type as "movie" | "tv", tmdbData);
    console.log(`   → Calculated status: "${calculatedStatus}"`);

    const totalEpisodes =
      episodeCount !== undefined
        ? parseInt(episodeCount)
        : tmdbData.number_of_episodes || tmdbData.number_of_seasons || 0;

    console.log(`📦 Preparing donghua data for database...`);
    // Prepare donghua data - use form data if provided, otherwise use TMDB data
    const donghuaData: any = {
      tmdbId: parseInt(tmdbId),
      title: tmdbData.title || tmdbData.name,
      chineseTitle: extractedChineseTitle, // Use extracted Chinese title from TMDB
      overview: tmdbData.overview || "",
      synopsis: synopsis && synopsis.trim() !== "" ? synopsis.trim() : null,
      posterPath: tmdbData.poster_path || "",
      backdropPath: tmdbData.backdrop_path || "",
      posters: posters,
      releaseDate: releaseDate
        ? new Date(releaseDate)
        : tmdbData.release_date
        ? new Date(tmdbData.release_date)
        : null,
      firstAirDate: firstAirDate
        ? new Date(firstAirDate)
        : tmdbData.first_air_date
        ? new Date(tmdbData.first_air_date)
        : null,
      voteAverage:
        voteAverage !== undefined
          ? parseFloat(voteAverage)
          : tmdbData.vote_average || 0,
      voteCount:
        voteCount !== undefined
          ? parseInt(voteCount)
          : tmdbData.vote_count || 0,
      status: calculatedStatus || null,
      episodeCount: totalEpisodes,
      mediaType: type,
      genreIds,
      keywords: keywords, // Store keywords as JSON
      genres: {
        connect: genreConnections, // Connect genres using Prisma relation
      },
    };

    console.log(`💾 Attempting to create donghua in database...`);
    console.log(`   Data preview:`, {
      tmdbId: donghuaData.tmdbId,
      title: donghuaData.title,
      type: donghuaData.mediaType,
      status: donghuaData.status,
      releaseDate: donghuaData.releaseDate,
      firstAirDate: donghuaData.firstAirDate,
      genres: genreConnections.length,
    });

    // Create donghua in database
    let donghua;
    try {
      donghua = await prisma.donghua.create({
        data: donghuaData,
        include: {
          genres: true,
        },
      });
      console.log(`✅ DB CREATE SUCCESS:`, {
        id: donghua.id,
        title: donghua.title,
        tmdbId: donghua.tmdbId,
        type: donghua.mediaType,
        status: donghua.status,
      });
    } catch (dbError: any) {
      console.error(`❌ DB CREATE ERROR:`, {
        error: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
        data: donghuaData,
      });
      throw dbError;
    }

    // If TV series, fetch and create episodes from TMDB
    if (type === "tv" && tmdbData.number_of_seasons) {
      try {
        let totalEpisodesCreated = 0;
        let globalEpisodeNumber = 1;

        // Fetch all seasons
        for (
          let seasonNum = 1;
          seasonNum <= tmdbData.number_of_seasons;
          seasonNum++
        ) {
          try {
            const seasonData = await fetchFromTMDB(
              `/tv/${tmdbId}/season/${seasonNum}`
            );

            if (seasonData.episodes && seasonData.episodes.length > 0) {
              // Create episodes for this season
              for (const episodeData of seasonData.episodes) {
                try {
                  // Use episode_number from TMDB if available, otherwise use global counter
                  const epNumber =
                    episodeData.episode_number || globalEpisodeNumber;
                  const episodeId = `${donghua.id}-${epNumber}`;

                  // Use upsert to avoid unique constraint error
                  await prisma.episode.upsert({
                    where: { id: episodeId },
                    update: {
                      title: episodeData.name || `Episode ${epNumber}`,
                      thumbnail: episodeData.still_path
                        ? `https://image.tmdb.org/t/p/w500${episodeData.still_path}`
                        : null,
                      duration: episodeData.runtime || null,
                      airDate: episodeData.air_date
                        ? new Date(episodeData.air_date)
                        : null,
                      tmdbEpisodeId: episodeData.id || null,
                      overview: episodeData.overview || null,
                      stillPath: episodeData.still_path || null,
                      voteAverage: episodeData.vote_average || null,
                      voteCount: episodeData.vote_count || null,
                      seasonNumber: seasonNum,
                    },
                    create: {
                      id: episodeId,
                      donghuaId: donghua.id,
                      episodeNumber: epNumber,
                      title: episodeData.name || `Episode ${epNumber}`,
                      thumbnail: episodeData.still_path
                        ? `https://image.tmdb.org/t/p/w500${episodeData.still_path}`
                        : null,
                      duration: episodeData.runtime || null,
                      airDate: episodeData.air_date
                        ? new Date(episodeData.air_date)
                        : null,
                      servers: [],
                      subtitles: [],
                      tmdbEpisodeId: episodeData.id || null,
                      overview: episodeData.overview || null,
                      stillPath: episodeData.still_path || null,
                      voteAverage: episodeData.vote_average || null,
                      voteCount: episodeData.vote_count || null,
                      seasonNumber: seasonNum,
                    },
                  });
                  totalEpisodesCreated++;
                  globalEpisodeNumber =
                    Math.max(globalEpisodeNumber, epNumber) + 1;
                } catch (epError: any) {
                  // Log error but continue
                  console.error(
                    `Error creating/updating episode ${
                      episodeData.episode_number || globalEpisodeNumber
                    }:`,
                    epError
                  );
                  // Continue to next episode
                  if (episodeData.episode_number) {
                    globalEpisodeNumber = Math.max(
                      globalEpisodeNumber,
                      episodeData.episode_number + 1
                    );
                  } else {
                    globalEpisodeNumber++;
                  }
                }
              }
            }
          } catch (seasonError) {
            // Skip season if error (e.g., season not available)
            console.error(`Error fetching season ${seasonNum}:`, seasonError);
            continue;
          }
        }

        // Refine status based on episodes and TMDB data
        const finalEpisodeCount = await prisma.episode.count({
          where: { donghuaId: donghua.id },
        });

        // Recalculate status based on current TMDB data and episode count
        let finalStatus: Status = getStatusFromTMDB("tv", tmdbData);

        // Override to upcoming if no episodes synced yet and hasn't aired
        if (finalEpisodeCount === 0 && finalStatus === Status.upcoming) {
          finalStatus = Status.upcoming;
        }
        // If has episodes but TMDB says ended, mark as complete
        else if (finalStatus === Status.complete && finalEpisodeCount > 0) {
          finalStatus = Status.complete;
        }
        // If has episodes and TMDB says ongoing/returning, mark as ongoing
        else if (finalStatus === Status.ongoing && finalEpisodeCount > 0) {
          finalStatus = Status.ongoing;
        }

        // Update status if changed
        if (finalStatus !== donghua.status) {
          await prisma.donghua.update({
            where: { id: donghua.id },
            data: { status: finalStatus },
          });
          console.log(
            `📊 Updated status for ${donghua.title}: ${donghua.status} → ${finalStatus} (${finalEpisodeCount} episodes synced)`
          );
        } else {
          console.log(
            `✅ Episodes synced for ${donghua.title}: ${finalEpisodeCount} episodes (status: ${finalStatus})`
          );
        }
      } catch (episodesError) {
        // Log error but don't fail the request
        console.error("Error creating episodes from TMDB:", episodesError);
      }
    }

    // Get genres for response (using relation)
    const donghuaWithGenres = await prisma.donghua.findUnique({
      where: { id: donghua.id },
      include: {
        genres: true,
        episodes: true,
      },
    });

    // Enrich with status and released episodes count
    const enrichedDonghua = await enrichDonghuaData(donghuaWithGenres!);

    const duration = Date.now() - startTime;
    console.log(`✅ SYNC COMPLETE in ${duration}ms:`, {
      id: enrichedDonghua.id,
      title: enrichedDonghua.title,
      tmdbId: enrichedDonghua.tmdbId,
      type: enrichedDonghua.mediaType,
      status: enrichedDonghua.status,
      genres: enrichedDonghua.genres?.length || 0,
      episodes: enrichedDonghua.episodes?.length || 0,
    });
    console.log("🔵 ========== SYNC REQUEST END ==========\n");

    res.status(201).json({
      ...enrichedDonghua,
      keywords: keywords,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ SYNC ERROR after ${duration}ms:`, {
      error: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      requestBody: req.body,
    });
    console.error("🔴 ========== SYNC REQUEST FAILED ==========\n");

    // Return detailed error in development, generic in production
    const errorResponse: any = {
      error: error instanceof Error ? error.message : "Unknown error",
    };

    if (process.env.NODE_ENV === "development") {
      errorResponse.details = {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
      };
    }

    res.status(500).json(errorResponse);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
