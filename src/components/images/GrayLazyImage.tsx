import Image, { ImageProps } from "next/image";

const GRAY_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mO8VA8AAikBU9RsF2cAAAAASUVORK5CYII=";

export const GrayPlaceHolderImage = (props: ImageProps) => {
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image placeholder="blur" blurDataURL={GRAY_DATA_URL} {...props} />;
};
