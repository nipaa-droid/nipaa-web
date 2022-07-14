import { GrayPlaceHolderImage } from "./GrayLazyImage";

export const AppLogo = () => {
  return (
    <GrayPlaceHolderImage
      alt="App logo"
      src="/icon-512x512.webp"
      width={32}
      height={32}
    />
  );
};
