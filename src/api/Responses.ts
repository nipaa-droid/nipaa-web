export enum DroidAPIResponses {
  SUCCESS = "SUCCESS",
  FAIL = "FAIL",
}

export class Responses {
  static INVALID_REQUEST_BODY = "Invalid request body.";
  static USER_NOT_FOUND = "User not found.";
  static UNEXPECTED_BEHAVIOR = "Unexpected server behavior.";

  static #BUILD(type: DroidAPIResponses, ...args: string[]) {
    return `${type}\n${this.ARRAY(...args)}`;
  }

  static PARSE_PARTIAL(string: string) {
    return string.split("\n");
  }

  static PARSE_FULL(string: string) {
    const split = this.PARSE_PARTIAL(string);
    const second = split[1].split(" ");
    return [split[0], ...second];
  }

  static ARRAY(...args: string[]) {
    return args.join(" ");
  }

  static SUCCESS(...args: string[]) {
    return this.#BUILD(DroidAPIResponses.SUCCESS, ...args);
  }

  static FAILED(...args: string[]) {
    return this.#BUILD(DroidAPIResponses.FAIL, ...args);
  }
}
