export class NumberUtils {
  /**
   * Verifies if a value of number type is indeed a number (not NaN).
   * @param number the number to verify.
   * @returns wether the value is indeed a number.
   */
  static isNumber(number: number) {
    return !isNaN(number);
  }

  static percentFrom(from: number, to: number) {
    return Math.round((from / to) * 100);
  }

  static maxPagesFor(amount: number, itemsPerPage: number) {
    return Math.max(1, Math.floor(amount / itemsPerPage));
  }
}
