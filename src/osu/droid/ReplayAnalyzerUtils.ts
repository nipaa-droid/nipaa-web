import { Beatmap, Mod, ModRelax, Slider, SliderTick } from "@rian8337/osu-base";
import { hitResult, ReplayAnalyzer } from "@rian8337/osu-droid-replay-analyzer";
import { MustHave } from "../../utils/types";
import { OsuModUtils } from "../OsuModUtils";

export type BeatmapReplayAnalyzerWithData = MustHave<ReplayAnalyzer, "data"> & {
  beatmap: Beatmap;
};

export class ReplayAnalyzerUtils {
  static estimateScore(
    analyzer: BeatmapReplayAnalyzerWithData,
    customScoreMultiplier: (mod: Mod) => number | undefined = (m) => {
      switch (m.constructor.prototype) {
        case ModRelax:
          return 0.8;
      }
    }
  ) {
    // Get raw OD, HP, and CS
    const difficultyMultiplier =
      1 +
      analyzer.beatmap.difficulty.od / 10 +
      analyzer.beatmap.difficulty.hp / 10 +
      (analyzer.beatmap.difficulty.cs - 3) / 4;

    const mods = analyzer.data.convertedMods;

    let scoreMultiplier = 1;

    scoreMultiplier = OsuModUtils.isModRanked(mods)
      ? mods.reduce((a, m) => {
          const scoreMultiplier = customScoreMultiplier(m) ?? m.scoreMultiplier;
          return a * scoreMultiplier;
        }, 1)
      : 0;

    // Custom score multiplier from speed modifier
    let speedScoreMultiplier = 1;
    const speedMultiplier = analyzer.data.speedModification;

    if (speedMultiplier > 1) {
      speedScoreMultiplier += (speedMultiplier - 1) * 0.24;
    } else if (speedMultiplier < 1) {
      speedScoreMultiplier = Math.pow(0.3, (1 - speedMultiplier) * 4);
    }

    scoreMultiplier *= speedScoreMultiplier;

    let currentCombo = 0;
    let score = 0;

    const miss = () => {
      currentCombo = 0;
    };

    const hitReal = (hitValue: number) => {
      score += hitValue;
      ++currentCombo;
    };

    const hit = (hitValue: number) => {
      hitReal(
        hitValue +
          (hitValue * currentCombo * difficultyMultiplier * scoreMultiplier) /
            25
      );
    };

    analyzer.data.hitObjectData.forEach((hitData, i) => {
      const currentObject = analyzer.beatmap.hitObjects.objects[i];

      if (currentObject instanceof Slider) {
        for (let j = 1; j < currentObject.nestedHitObjects.length; ++j) {
          if (hitData.tickset[j - 1]) {
            const currentNested = currentObject.nestedHitObjects[j];
            if (currentNested instanceof SliderTick) {
              hitReal(10);
            } else {
              hitReal(30);
            }
          } else {
            miss();
          }
        }
        return;
      }

      switch (hitData.result) {
        case hitResult.RESULT_0:
          miss();
          break;
        case hitResult.RESULT_50:
          hit(50);
          break;
        case hitResult.RESULT_100:
          hit(100);
          break;
        case hitResult.RESULT_300:
          hit(300);
          break;
      }
    });

    return score;
  }
}
