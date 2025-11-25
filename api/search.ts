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
    const { q, genre, status, sortBy } = req.query;

    const where: any = {};

    if (q && typeof q === "string") {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { chineseTitle: { contains: q, mode: "insensitive" } },
        { overview: { contains: q, mode: "insensitive" } },
      ];
    }

    if (status && typeof status === "string") {
      where.status = status;
    }

    if (genre && typeof genre === "string") {
      where.genreIds = {
        has: parseInt(genre),
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
        genres: true,
      },
      orderBy,
    });

    // Enrich each donghua with status and released episodes count
    const enrichedDonghuas = await Promise.all(
      donghuas.map((donghua: any) => enrichDonghuaData(donghua))
    );

    res.json(enrichedDonghuas);
  } catch (error) {
    console.error("❌ Error searching donghua:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
