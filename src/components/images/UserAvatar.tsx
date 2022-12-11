import Image, { ImageProps } from "next/image";
import { ServerConstants } from "../../constants";
import { NullableKeys } from "../../utils/types";

export const UserAvatar = (props: NullableKeys<ImageProps, "src">) => {
	const size = 32;
	
	const width = props.width ?? size;
	const height = props.height ?? size;
	
	return (
		<div
			style={{
				borderRadius: "10px",
				overflow: "hidden",
				width,
				height,
			}}
		>
			<Image
				alt="User avatar"
				width={width}
				height={height}
				{...props}
				src={props.src ?? ServerConstants.DEFAULT_AVATAR_PATH}
			/>
		</div>
	);
};
