import { WithClassname, WithStyles } from "../props/styled";

export type IndexPaperPropTypes = WithStyles<WithClassname<{}>>;

export const IndexPaperProps = () => {
  return {
    p: "xl",
    shadow: "xs",
    withBorder: true,
  };
};
