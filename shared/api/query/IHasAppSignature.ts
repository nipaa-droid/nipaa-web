/**
 * Represents a object which may include an app signature for validation reasons.
 */
export interface IHasAppSignature {
  /**
   * The app signature.
   */
  sign: string;
}
