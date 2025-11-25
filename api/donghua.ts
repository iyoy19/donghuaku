import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  prisma,
  enrichDonghuaData,
  setCorsHeaders,
  handleOptions,
} from "./lib";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  res.setHeader("Content-Type", "application/json");
  if (handleOptions(req, res)) return;

  try {
    const { id, type } = req.query;

    // Route 1: GET /api/donghua?type=episodes&id=123
    if (type === "episodes" && id) {
      const idNum = Array.isArray(id)
        ? parseInt(id[0])
        : parseInt(id as string);
      const episodes = await prisma.episode.findMany({
        where: { donghuaId: idNum },
        orderBy: { episodeNumber: "asc" },
      });
      return res.status(200).json(episodes);
    }

    // Route 2: GET /api/donghua?type=trending
    if (type === "trending") {
      const donghuas = await prisma.donghua.findMany({
        where: { voteCount: { gte: 5 } },
        include: {
          genres: true,
          episodes: { orderBy: { episodeNumber: "asc" } },
        },
        orderBy: { updatedAt: "desc", voteAverage: "desc" },
        take: 20,
      });
      const enriched = await Promise.all(
        donghuas.map((d: any) => enrichDonghuaData(d))
      );
      return res.json({ results: enriched });
    }

    // Route 3: GET /api/donghua?type=latest
    if (type === "latest") {
      const where: any = {
        OR: [
          { mediaType: "tv", firstAirDate: { not: null } },
          { mediaType: "movie", releaseDate: { not: null } },
        ],
        voteCount: { gte: 5 },
      };
      const kidsGenre = await prisma.genre.findFirst({
        where: {
          OR: [
            { id: 10762 },
            { name: { contains: "Kids", mode: "insensitive" } },
          ],
        },
      });
      if (kidsGenre) {
        where.NOT = { genreIds: { has: kidsGenre.id } };
      }
      const donghuas = await prisma.donghua.findMany({
        where,
        include: {
          genres: true,
          episodes: { orderBy: { episodeNumber: "asc" } },
        },
        orderBy: { releaseDate: "desc", firstAirDate: "desc" },
        take: 20,
      });
      const enriched = await Promise.all(
        donghuas.map((d: any) => enrichDonghuaData(d))
      );
      return res.json({ results: enriched });
    }

    // Route 4: GET /api/donghua?type=toprated
    if (type === "toprated") {
      const donghuas = await prisma.donghua.findMany({
        where: { voteCount: { gte: 10 } },
        include: {
          genres: true,
          episodes: { orderBy: { episodeNumber: "asc" } },
        },
        orderBy: { voteAverage: "desc" },
        take: 20,
      });
      const enriched = await Promise.all(
        donghuas.map((d: any) => enrichDonghuaData(d))
      );
      return res.json({ results: enriched });
    }

    // Route 5: GET /api/donghua?type=ongoing
    if (type === "ongoing") {
      const donghuas = await prisma.donghua.findMany({
        where: {
          status: "ongoing",
          OR: [{ mediaType: "tv" }, { mediaType: "movie" }],
        },
        include: {
          genres: true,
          episodes: { orderBy: { episodeNumber: "asc" } },
        },
        orderBy: { voteAverage: "desc" },
        take: 12,
      });
      const enriched = await Promise.all(
        donghuas.map((d: any) => enrichDonghuaData(d))
      );
      return res.json({ results: enriched });
    }

    // Route 6: GET /api/donghua?id=123 (get by ID)
    if (id && !type) {
      const idNum = Array.isArray(id)
        ? parseInt(id[0])
        : parseInt(id as string);
      const donghua = await prisma.donghua.findUnique({
        where: { id: idNum },
        include: {
          genres: true,
          episodes: { orderBy: { episodeNumber: "asc" } },
        },
      });
      if (!donghua) {
        return res.status(404).json({ error: "Donghua not found" });
      }
      const enriched = await enrichDonghuaData(donghua);
      return res.status(200).json(enriched);
    }

    // Route 7: GET /api/donghua (get all)
    const donghuas = await prisma.donghua.findMany({
      include: {
        episodes: { orderBy: { episodeNumber: "asc" } },
        genres: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const donghuasWithStringStatus = donghuas.map((item: any) => {
      if (item.status && typeof item.status !== "string") {
        item.status = String(item.status);
      }
      return item;
    });
    const enrichedDonghuas = await Promise.all(
      donghuasWithStringStatus.map((d: any) => enrichDonghuaData(d))
    );
    console.log(`✅ Fetched ${enrichedDonghuas.length} donghua from database`);
    res.status(200).json(enrichedDonghuas);
  } catch (error) {
    console.error("❌ Error in donghua endpoint:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
