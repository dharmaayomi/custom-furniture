import { Button } from "@/components/ui/button";
import { CornerUpLeft, CornerUpRight, Ruler } from "lucide-react";
import React from "react";

export const FooterCustom = () => {
	return (
		<footer className="flex absolute z-5 bottom-0 mx-auto w-full  justify-between gap-4 p-8">
			<div className="bg-gray-800 p-3 rounded-full">
				<Ruler className="text-white" />
			</div>

			<div className="flex items-center">
				<div className="rounded-l-xl items-center bg-gray-100 p-2">
					<CornerUpLeft />
				</div>
				<div className="rounded-r-xl items-center bg-gray-100 p-2">
					<CornerUpRight />
				</div>
			</div>
		</footer>
	);
};
