import { ListOrdered, Menu, MoveRight, Save } from "lucide-react";
import React from "react";

export const HeaderCustom = () => {
	return (
		<header className="flex absolute z-5 mx-auto w-full justify-between gap-4 p-8">
			{/* left button */}
			<div className="flex gap-4 items-center">
				<div className="rounded-full bg-gray-200 p-4">
					<Menu />
				</div>
				<div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-gray-200 p-2">
					<Save />
					<div>Save</div>
				</div>
			</div>

			{/* right button */}
			<div className="flex gap-4 items-center">
				<div className="rounded-full  bg-gray-100 p-2">
					<ListOrdered className="h-4 w-4" />
				</div>
				{/* dummy total price */}
				<div className="text-black text-center items-center justify-center">
					Rp.3.000.000,00
				</div>
				<div className="flex gap-2 py-3 px-4 rounded-full bg-gray-600 font-bold text-white">
					SUMMARY{" "}
					<span>
						<MoveRight />
					</span>
				</div>
			</div>
		</header>
	);
};
