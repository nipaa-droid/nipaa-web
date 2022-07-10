import { MapInfo } from "@rian8337/osu-base";
import { minutesToSeconds } from "date-fns";
import { LimitedCapacityCollection } from "../../collections/LimitedCapacityCollection";

export class BeatmapManager {
  static cache = new LimitedCapacityCollection<string, MapInfo | null>(
    64,
    minutesToSeconds(1)
  );

  static async fetchBeatmap(
    beatmapIDOrHash: string,
    fetchBeatmaps = async (): Promise<MapInfo> => {
      return await MapInfo.getInformation({
        hash: beatmapIDOrHash,
      });
    }
  ) {
    let selectedBeatmap: MapInfo | null;

    const cacheBeatmap = this.cache.get(beatmapIDOrHash);

    selectedBeatmap = cacheBeatmap ?? null;

    /**
     * We also don't want to load cache from maps that we previously couldn't fetch.
     */
    if (!cacheBeatmap && cacheBeatmap !== null) {
      const newBeatmap = await fetchBeatmaps();
      this.cache.set(beatmapIDOrHash, newBeatmap ?? null);
      if (!newBeatmap.title) {
        return undefined;
      }
      selectedBeatmap = newBeatmap;
    }

    return selectedBeatmap;
  }
}
