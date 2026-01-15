import type { Metadata } from "next";
import { HeaderCustom } from "@/features/custom/components/HeaderCustom";
import { FooterCustom } from "@/features/custom/components/FooterCustom";

export const metadata: Metadata = {
	title: "Custom Furniture",
	description: "BBPersona",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div>
			<HeaderCustom />
			{children}
		</div>
	);
}
