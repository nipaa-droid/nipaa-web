import { HTMLProps, PropsWithChildren } from "react";
import { Container } from "@mantine/core";

export const CenteredTableHead = (
  props: PropsWithChildren<HTMLProps<HTMLTableCellElement>>
) => {
  return (
    <th {...props}>
      <Container
        styles={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        {props.children}
      </Container>
    </th>
  );
};
