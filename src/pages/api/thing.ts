import { chunk } from "lodash";
import { NextApiHandler } from "next";
import { prisma } from "../../../lib/prisma";
import { OsuModUtils } from "../../osu/OsuModUtils";

const handler: NextApiHandler = async () => {
	const allScores = await prisma.osuDroidScore.findMany({
		select: {
			id: true,
			mods: true,
		},
	});
	
	const chunked = chunk(allScores, 32);
	
	for (const [i, chunk] of chunked.entries()) {
		console.log(`Chunk ${i + 1} of ${chunked.length}`);
		await prisma.$transaction(
			chunk.map((score) => {
				const stats = OsuModUtils.droidStatsFromDroidString(score.mods);
				const droidstring = OsuModUtils.modsToDroidString(stats.mods, {
					customSpeed: stats.customSpeed === 1 ? undefined : stats.customSpeed,
				});
				
				return prisma.osuDroidScore.update({
					where: {
						id: score.id,
					},
					data: {
						mods: droidstring,
					},
				});
			})
		);
	}
};
export default handler;
