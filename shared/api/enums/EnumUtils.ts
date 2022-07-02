export class EnumUtils {
  static getValueByKey<T>(enumObject: T, key: string): T[keyof T] | undefined {
    const keys = Object.keys(enumObject);
    const values = Object.values(enumObject);

    if (values.includes(key)) {
      return keys[values.indexOf(key)] as unknown as T[keyof T];
    }
  }
}
