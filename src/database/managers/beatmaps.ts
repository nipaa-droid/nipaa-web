import { MapInfo } from "@rian8337/osu-base";
import { memoize } from "lodash";

export const fetchBeatmap = memoize(async (beatmapID: string) => await MapInfo.getInformation(beatmapID));

