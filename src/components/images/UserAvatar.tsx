import Image, { ImageProps } from "next/image";
import { ServerConstants } from "../../constants";

export const UserAvatar = (
  props: Omit<ImageProps, "src"> & { userAvatar: string | null }
) => {
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
        src={props.userAvatar ?? ServerConstants.DEFAULT_AVATAR_PATH}
        alt="User avatar"
        width={width}
        height={height}
        {...props}
      />
    </div>
  );
};
