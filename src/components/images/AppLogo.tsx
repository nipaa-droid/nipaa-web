import Image from "next/image";

export const AppLogo = () => {
	return (
		<Image
			alt="App logo"
			src="/icon-512x512.webp"
			width={32}
			height={32}
			priority
		/>
	);
};
