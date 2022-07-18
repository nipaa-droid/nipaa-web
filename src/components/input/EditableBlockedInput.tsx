import { ActionIcon, TextInput, TextInputProps } from "@mantine/core";
import { useState } from "react";
import { EditCircle } from "tabler-icons-react";

export const EditableBlockedTextInput = (props: TextInputProps) => {
  const [disabled, setDisabled] = useState(true);

  return (
    <TextInput
      {...props}
      disabled={disabled}
      rightSection={
        <ActionIcon onClick={() => setDisabled(!disabled)}>
          <EditCircle />
        </ActionIcon>
      }
    />
  );
};
