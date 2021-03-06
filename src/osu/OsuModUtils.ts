import {
  Mod,
  ModAuto,
  ModAutopilot,
  ModRelax,
  ModScoreV2,
  ModUtil,
} from "@rian8337/osu-base";
import { isNumber } from "../utils/number";

type DroidStats = {
  mods: Mod[];
  customSpeed: number;
};

export class OsuModUtils extends ModUtil {
  static #EXTRA_MODS_SEP = "|";

  static #CUSTOM_SPEED_SEP = "x";

  static #NOMOD_STRING = "-";

  static MODS_WITH_CUSTOM_MULTIPLIER = [ModRelax];

  static modsToBitwise(mods: Mod[]): number {
    return mods.reduce((acc, cur) => acc + cur.bitwise, 0);
  }

  static hasMods(mods: Mod[], has: typeof Mod[]) {
    const proto = mods.map((m) => m.constructor);
    return has.every((h) => proto.includes(h));
  }

  static droidStatsFromDroidString(string: string): DroidStats {
    const data = string.split(this.#EXTRA_MODS_SEP);

    const response: DroidStats = {
      customSpeed: 1,
      mods: [],
    };

    const modsData = data[0];
    if (modsData) {
      response.mods.push(...this.droidStringToMods(modsData));
    }

    const extraModInformation = data.filter((_, i) =>
      response.mods.length > 0 ? i !== 0 : true
    );

    extraModInformation.forEach((data) => {
      const omitSeparatorFromData = (sep: string) =>
        data.replace(new RegExp(sep, "g"), "");

      if (data.startsWith(this.#CUSTOM_SPEED_SEP)) {
        const customSpeed = parseFloat(
          omitSeparatorFromData(this.#CUSTOM_SPEED_SEP)
        );
        if (isNumber(customSpeed)) {
          response.customSpeed = customSpeed;
        }
      }
    });

    return response;
  }

  static modsToDroidString(
    mods: Mod[],
    extra?: {
      customSpeed?: number;
    }
  ): string {
    let string = mods.reduce((acc, cur) => acc + cur.droidString, "");

    if (extra) {
      let addedFirstSeparator = false;

      const addExtraRepresentation = (extra: string = "") => {
        if (!addedFirstSeparator) {
          addedFirstSeparator = true;
          addExtraRepresentation();
        }
        string += `${extra}${this.#EXTRA_MODS_SEP}`;
      };

      if (extra.customSpeed) {
        addExtraRepresentation(
          `${this.#CUSTOM_SPEED_SEP}${extra.customSpeed.toFixed(2)}`
        );
      }

      if (addedFirstSeparator) {
        /**
         * We remove the last dangling separator.
         */
        string = string.slice(0, -1);
      }
    }

    if (string === "") {
      string = this.#NOMOD_STRING;
    }

    return string;
  }

  static checkEquality(mods1: Mod[], mods2: Mod[]) {
    const prototypes1 = mods1.map((m) => m.constructor.prototype);
    const prototypes2 = mods2.map((m) => m.constructor.prototype);
    return (
      prototypes1.every((v) => prototypes2.includes(v)) &&
      prototypes2.every((v) => prototypes1.includes(v))
    );
  }

  static get unrankedMods() {
    return [ModAuto, ModAutopilot, ModScoreV2];
  }

  static get rankedMods() {
    return [
      ...OsuModUtils.allMods.filter(
        (m) => !this.unrankedMods.includes(m.constructor.prototype)
      ),
    ];
  }

  static toModAcronymString(mods: Mod[]) {
    return mods.reduce((acc, cur) => acc + cur.acronym, "");
  }

  static isModRanked(mods: Mod[]) {
    return mods.every(
      (m) => !this.unrankedMods.includes(m.constructor.prototype)
    );
  }

  static isCompatible(mods: Mod[]) {
    const prototypes = mods.map((m) => m.constructor.prototype);
    return !this.incompatibleMods.some(
      (arr) =>
        arr.filter((m) => prototypes.includes(m.constructor.prototype)).length >
        1
    );
  }
}
