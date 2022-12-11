export class AccuracyUtils {
  static smallPercentTo100(accPercent: number) {
    return accPercent * 100;
  }
  
  static acc100toDroid(acc100: number) {
    return Math.round(acc100 * 1000);
  }
  
  static accDroidToAcc100(accDroid: number) {
    return accDroid / 1000;
  }
}
