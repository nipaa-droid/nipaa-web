import { Paper, Text, Title } from "@mantine/core";
import { ServerConstants } from "../../constants";
import { useI18nContext } from "../../i18n/i18n-react";
import { IndexPaperProps, IndexPraperProvidedProps } from "./IndexPaper";

export const IndexPresentation = ({ textStyle }: IndexPraperProvidedProps) => {
  const { LL } = useI18nContext();

  return (
    <Paper {...IndexPaperProps()}>
      <div style={textStyle}>
        <Title>{ServerConstants.SERVER_NAME}</Title>
        <Text>{LL.description()}</Text>
      </div>
    </Paper>
  );
};
