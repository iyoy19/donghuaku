import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  prisma,
  setCorsHeaders,
  handleOptions,
} from "../../lib";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  res.setHeader("Content-Type", "application/json");
  if (handleOptions(req, res)) return;

  const { id } = req.query;
  const idNum = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);

  try {
    const episodes = await prisma.episode.findMany({
      where: { donghuaId: idNum },
      orderBy: { episodeNumber: "asc" },
    });

    res.status(200).json(episodes);
  } catch (error) {
    console.error("❌ Error fetching episodes:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
