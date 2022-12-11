import { Button, Center, PasswordInput, Stack, Text } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { UseFormInput, UseFormReturnType } from "@mantine/form/lib/use-form";
import { ReactNode, useEffect, useState } from "react";
import { z, ZodRawShape } from "zod";
import { shapeWithConfirmationPassword } from "../../../server/shapes";
import { AnyReactQueryError } from "../../../utils/trpc";
import { AccountEditBox, AccountEditBoxProps } from "./AccountEditBox";

type AccountEditItemData<T> = T &
	z.infer<z.ZodObject<typeof shapeWithConfirmationPassword>>;

export const AccountEditItem = <T extends { [key: string]: any }>({
	                                                                  children,
	                                                                  formProps,
	                                                                  boxProps,
	                                                                  onSubmit,
	                                                                  schema,
                                                                  }: {
	schema: ZodRawShape;
	boxProps: AccountEditBoxProps;
	formProps: Omit<UseFormInput<T>, "schema">;
	onSubmit: (data: AccountEditItemData<T>) => Promise<void>;
	children: (form: UseFormReturnType<AccountEditItemData<T>>) => ReactNode;
}) => {
	const initialValues: UseFormInput<AccountEditItemData<T>>["initialValues"] = {
		...formProps.initialValues,
		...{ confirmationPassword: "" },
	};
	
	const form = useForm<AccountEditItemData<T>>({
		...formProps,
		initialValues,
		schema: zodResolver(
			z.object({
				...schema,
				...shapeWithConfirmationPassword,
			})
		),
	});
	
	const [errorMessage, setErrorMessage] = useState("");
	const [success, setSuccess] = useState(false);
	
	const timeout = 2500;
	
	useEffect(() => {
		if (success) {
			setTimeout(() => setSuccess(false), timeout);
		}
	}, [success]);
	
	useEffect(() => {
		if (errorMessage) {
			setTimeout(() => setErrorMessage(""), timeout);
		}
	}, [errorMessage]);
	
	return (
		<AccountEditBox {...boxProps}>
			<div>
				<form
					onSubmit={form.onSubmit(async (data) => {
						try {
							await onSubmit(data);
							setSuccess(true);
							form.setValues(() => initialValues);
						} catch (e) {
							setErrorMessage((e as AnyReactQueryError).message);
						}
					})}
				>
					<Stack>
						{children(form)}
						<PasswordInput
							placeholder="Your current password"
							{...form.getInputProps("confirmationPassword")}
						/>
						<Button type="submit">Update details</Button>
						<Center>
							{success ? (
								<Text color="green">SUCCESS</Text>
							) : (
								errorMessage && <Text color="red">{errorMessage}</Text>
							)}
						</Center>
					</Stack>
				</form>
			</div>
		</AccountEditBox>
	);
};
