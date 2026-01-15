"use client";

import React, { useState } from "react";
import { FooterCustom } from "./FooterCustom";
import { FloatingSidebar } from "./FloatingSidebar";
import { RoomCanvas } from "./RoomCanvas";
import { HeaderCustom } from "./HeaderCustom";

export const RoomPage = () => {
	const [activeTool, setActiveTool] = useState<string | null>(null);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	return (
		<div className="flex h-screen w-full overflow-hidden bg-gray-100">
			{/* AREA UTAMA (CANVAS 3D) */}
			<div className="flex-1 relative bg-gray-200">
				<div className="absolute top-0 left-0 w-full z-40 ">
					<HeaderCustom onMenuClick={() => setIsMenuOpen(true)} />
				</div>
				<RoomCanvas />
				<div className="absolute bottom-0 left-0 w-full z-40 ">
					<FooterCustom />
				</div>
			</div>

			{/* SIDEBAR */}
			<div className="h-full z-50">
				<FloatingSidebar
					activeTool={activeTool as any}
					onSelectTool={setActiveTool}
				/>
			</div>
		</div>
	);
};
