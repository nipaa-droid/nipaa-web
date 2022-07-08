import { MapInfo } from "@rian8337/osu-base";
import { EdgeFunctionCache } from "../../collections/EdgeFunctionCache";

export class BeatmapManager {
  static cache = new EdgeFunctionCache<string, MapInfo | null>(32);

  static async fetchBeatmap(
    beatmapIDOrHash: string,
    fetchBeatmaps = async (): Promise<MapInfo> => {
      return await MapInfo.getInformation({
        hash: beatmapIDOrHash,
      });
    }
  ) {
    let selectedBeatmap: MapInfo | null;

    const cacheBeatmap = (selectedBeatmap =
      this.cache.get(beatmapIDOrHash) ?? null);

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
