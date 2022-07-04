import { Metrics } from "./Metrics";

export class DatabaseSetup {
  static metric = Metrics.pp;
}

export type ActiveMetric = typeof DatabaseSetup.metric extends Metrics.pp
  ? Metrics.pp
  : typeof DatabaseSetup.metric extends Metrics.rankedScore
  ? Metrics.rankedScore
  : Metrics.totalScore;
