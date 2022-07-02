export class EnumUtils {
  static #getValueByKey<T>(enumObject: T, key: string): T[keyof T] | undefined {
    const keys = Object.keys(enumObject);
    const values = Object.values(enumObject);

    if (values.includes(key)) {
      return keys[values.indexOf(key)] as unknown as T[keyof T];
    }
  }

  static getValueByKey<T, K extends keyof T & string>(
    enumObject: T,
    key: K
  ): T[K] | undefined {
    return this.#getValueByKey(enumObject, key) as unknown as T[K];
  }

  static getValueByKeyUntyped<T>(
    enumObject: T,
    key: string
  ): T[keyof T] | undefined {
    return this.#getValueByKey(enumObject, key) as unknown as T[keyof T];
  }
}
