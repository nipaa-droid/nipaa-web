import { Paper, Text } from "@mantine/core";
import { useI18nContext } from "../../i18n/i18n-react";
import { IndexPaperProps, IndexPraperProvidedProps } from "./IndexPaper";

export function ServerAbout({ textStyle }: IndexPraperProvidedProps) {
  const { LL } = useI18nContext();

  return (
    <Paper {...IndexPaperProps()}>
      <Text style={textStyle}>{LL.about()}</Text>
    </Paper>
  );
}
