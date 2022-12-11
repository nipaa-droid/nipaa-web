import { CSSProperties } from "react";

export type IndexPraperProvidedProps = {
	textStyle: CSSProperties;
};

export const IndexPaperProps = () => {
	return {
		p: "xl",
		shadow: "xs",
		withBorder: true,
	};
};
