export enum NipaaResponseHead {
	SUCCESS = "SUCCESS",
	FAIL = "FAIL"
}

type NipaaResponseFunction = (...args: string[]) => string;

const list: NipaaResponseFunction = (...args: string[]) => args.join(" ");
const build = (type: NipaaResponseHead, ...args: string[]) => `${type}\n${list(...args)}`;

const ok: NipaaResponseFunction = (...args: string[]) => build(NipaaResponseHead.SUCCESS, ...args);
const no: NipaaResponseFunction = (...args: string[]) => build(NipaaResponseHead.FAIL, ...args);

export const responses = {
	invalidBody: no("Invalid request body."),
	user404: no("User not found."),
	ok,
	no,
	list,
};

