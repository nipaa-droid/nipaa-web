import { Stack, Text, TextInputProps } from "@mantine/core";
import { EditableBlockedTextInput } from "../../input/EditableBlockedInput";

export const AccountEditInput = (
  props: TextInputProps & { title?: string }
) => {
  const { title } = props;
  return (
    <Stack>
      {title && <Text>{title}</Text>}
      <EditableBlockedTextInput {...props} />
    </Stack>
  );
};
