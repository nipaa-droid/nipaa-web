import {
  Mod,
  ModAuto,
  ModAutopilot,
  ModDoubleTime,
  ModNightCore,
  ModRelax,
  ModScoreV2,
  ModUtil,
} from "@rian8337/osu-base";
import { uniqBy } from "lodash";
import { Numbers } from "../utils/number";

type DroidStats = {
  mods: Mod[];
  customSpeed: number;
};

type ModCombinationsCheckOptions = {
  baseMods?: Mod[];
  leftMods?: Mod[];
  shallow?: boolean;
  possible?: Mod[][];
};

export class OsuModUtils extends ModUtil {
  static #EXTRA_MODS_SEP = "|";
  
  static #CUSTOM_SPEED_SEP = "x";
  
  static #NOMOD_STRING = "-";
  
  static MODS_WITH_CUSTOM_MULTIPLIER = [ModRelax];
  
  static readonly unrankedMods = [
    new ModAuto(),
    new ModAutopilot(),
    new ModScoreV2(),
  ];
  
  static readonly rankedMods = this.allMods.filter((m) =>
    this.unrankedMods.every((u) => u.acronym !== m.acronym)
  );
  
  static modsToBitwise(mods: Mod[]): number {
    return mods.reduce((acc, cur) => acc + cur.bitwise, 0);
  }
  
  static allPossibleModCombinations() {
    return this.allMods
      .map((m) => this.allPossibleCombinationsForMod([m]))
      .flat();
  }
  
  static allPossibleCombinationsForMod(
    modsToCheck: Mod[],
    options?: ModCombinationsCheckOptions
  ) {
    const possible = [modsToCheck];
    
    options ??= {};
    
    options.baseMods ??= this.allMods;
    options.baseMods = [...options.baseMods];
    
    if (options.shallow) {
      if (OsuModUtils.modHasAny(modsToCheck, [ModNightCore, ModDoubleTime])) {
        const speedIncreaseMods = [new ModDoubleTime(), new ModNightCore()];
        
        modsToCheck = modsToCheck.filter(
          (checkMod) =>
            /**
             * We will check these later
             */
            !speedIncreaseMods.map((s) => s.acronym).includes(checkMod.acronym)
        );
        
        /**
         * Osu Mod Doubletime and nightcore are pretty much the same.
         */
        for (const speedIncreaseMod of speedIncreaseMods) {
          possible.push(
            ...this.allPossibleCombinationsForMod(
              [speedIncreaseMod, ...modsToCheck],
              {
                baseMods: options.baseMods,
              }
            )
          );
        }
        
        return uniqBy(
          possible.map((m) =>
            this.deepCheckDuplicateMods(this.checkIncompatibleMods(m))
          ),
          (m) => OsuModUtils.toModAcronymString(m)
        );
      }
    }
    
    options.leftMods ??= options.baseMods;
    
    // we don't map to a excludent array excluding duplicates here because this is inconsistent
    // for what we're trying to do with this function which is get all possible combinations
    const newCombinations = options.leftMods.map((left) => [
      left,
      ...modsToCheck.filter((m) => m.acronym !== left.acronym),
    ]);
    
    for (const checkCombination of newCombinations) {
      options.leftMods.shift();
      if (
        this.isCompatible(checkCombination) &&
        !this.modsHasDuplicates(checkCombination)
      ) {
        possible.push(
          ...this.allPossibleCombinationsForMod(checkCombination, {
            ...options,
          })
        );
      }
    }
    
    return possible;
  }
  
  static allPossibleStatsStringsForMods(
    mods: Mod[],
    options?: ModCombinationsCheckOptions
  ) {
    const final: string[] = [];
    const combinations = this.allPossibleCombinationsForMod(mods, options);
    
    const speedValues: number[] = [];
    
    const MAX_SPEED = 2;
    const SPEED_STEP = 0.05;
    
    const maxSpeedValues = Math.floor(MAX_SPEED / SPEED_STEP);
    
    for (let i = 1; i < maxSpeedValues; i++) {
      speedValues.push(Number(((i + 1) * SPEED_STEP).toFixed(2)));
    }
    
    combinations.forEach((combination) => {
      const modsString = this.modsToDroidString(combination);
      
      final.push(modsString);
      
      speedValues.forEach((speedValue) => {
        final.push(
          `${modsString}${this.#EXTRA_MODS_SEP}${
            this.#CUSTOM_SPEED_SEP
          }${speedValue}`
        );
      });
    });
    
    return final;
  }
  
  static deepCheckDuplicateMods(mods: Mod[]) {
    return uniqBy(mods, (m) => m.acronym);
  }
  
  static modsHasDuplicates(mods: Mod[]) {
    const unique = new Set(mods.map((m) => m.acronym));
    return mods.length > unique.size;
  }
  
  static hasMods(mods: Mod[], has: typeof Mod[]) {
    return has.every((h) => mods.some((m) => m.constructor === h));
  }
  
  static modHasAny(mods: Mod[], has: typeof Mod[]) {
    return has.some((h) => mods.some((m) => m.constructor === h));
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
        if (Numbers.isNumber(customSpeed)) {
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
    let string = mods
      .map((m) => m.droidString)
      .sort((a, b) => a.localeCompare(b))
      .join("");
    
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
  
  static toModAcronymString(mods: Mod[]) {
    return mods.reduce((acc, cur) => acc + cur.acronym, "");
  }
  
  static isModRanked(mods: Mod[]) {
    return mods.every((m) =>
      this.rankedMods.some((r) => r.acronym === m.acronym)
    );
  }
  
  static isCompatible(mods: Mod[]) {
    return this.incompatibleMods.every((set) => {
      const possibleIncompatibles = mods.filter((m) =>
        set.some((i) => i.acronym === m.acronym)
      );
      
      return possibleIncompatibles.length <= 1;
    });
  }
}
