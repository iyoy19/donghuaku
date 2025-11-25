import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  prisma,
  enrichDonghuaData,
  setCorsHeaders,
  handleOptions,
} from "../lib";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  res.setHeader("Content-Type", "application/json");
  if (handleOptions(req, res)) return;

  const { id } = req.query;
  const idNum = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);

  try {
    const donghua = await prisma.donghua.findUnique({
      where: { id: idNum },
      include: {
        genres: true,
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
      },
    });

    if (!donghua) {
      return res.status(404).json({ error: "Donghua not found" });
    }

    const enriched = await enrichDonghuaData(donghua);
    res.status(200).json(enriched);
  } catch (error) {
    console.error("❌ Error fetching donghua by ID:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
