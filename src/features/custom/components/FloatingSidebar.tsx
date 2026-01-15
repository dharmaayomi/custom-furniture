import React from "react";
import { Card } from "../../../components/ui/card";
import { Home, PaintBucket } from "lucide-react";

export const FloatingSidebar = () => {
	return (
		<div className="fixed right-10 top-1/2 z-50 flex flex-col items-center gap-4">
			{/* Home */}
			<Card className="flex items-center justify-center p-3">
				<Home />
			</Card>

			{/* Spacer */}
			<div className="h-4" />

			{/* Paint tools */}
			<Card className="flex flex-col items-center gap-6 p-3">
				<PaintBucket />
				<PaintBucket />
				<PaintBucket />
				<PaintBucket />
				<PaintBucket />
			</Card>
		</div>
	);
};
