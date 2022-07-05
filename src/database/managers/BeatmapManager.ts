import { MapInfo } from "@rian8337/osu-base";
import { EdgeFunctionCache } from "../../collections/EdgeFunctionCache";

export class BeatmapManager {
  static cache = new EdgeFunctionCache<string, MapInfo>(32);

  static async fetchBeatmap(
    beatmapIDOrHash: string,
    fetchBeatmaps = async (): Promise<MapInfo> => {
      return await MapInfo.getInformation({
        hash: beatmapIDOrHash,
      });
    }
  ): Promise<MapInfo | undefined> {
    let selectedBeatmap: MapInfo | undefined;

    const cacheBeatmap = (selectedBeatmap = this.cache.get(beatmapIDOrHash));

    /**
     * We also don't want to load cache from maps that we previously couldn't fetch.
     */
    if (!cacheBeatmap && cacheBeatmap !== null) {
      const newBeatmap = await fetchBeatmaps();
      this.cache.set(beatmapIDOrHash, newBeatmap ?? undefined);
      if (!newBeatmap.title) {
        return undefined;
      }
      selectedBeatmap = newBeatmap;
    }

    return selectedBeatmap;
  }
}
