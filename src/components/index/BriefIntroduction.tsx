import { Paper, Text, Title } from "@mantine/core";
import { ServerConstants } from "../../constants";
import { useI18nContext } from "../../i18n/i18n-react";
import { IndexPaperProps, IndexPaperPropTypes } from "./IndexPaper";

export const BriefIntroduction = ({
  className,
  styles,
}: IndexPaperPropTypes) => {
  const { LL } = useI18nContext();

  return (
    <Paper {...IndexPaperProps} className={className} styles={styles}>
      <div style={styles}>
        <Title>{ServerConstants.SERVER_NAME}</Title>
        <Text>{LL.description()}</Text>
      </div>
    </Paper>
  );
};
