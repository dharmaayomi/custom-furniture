"use client";
import {
	Armchair,
	BedDouble,
	DoorClosed,
	Grid,
	Home,
	Lamp,
	PaintBucket,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils"; // Pastikan punya utility cn (classnames)
import { Button } from "@/components/ui/button";

// Definisikan tipe tools
type ToolType = "paint" | "lighting" | "grid" | "bed" | "door" | "chair" | null;

interface FloatingSidebarProps {
	activeTool: ToolType;
	onSelectTool: (tool: ToolType) => void;
}

export const FloatingSidebar = ({
	activeTool,
	onSelectTool,
}: FloatingSidebarProps) => {
	const tools = [
		{ id: "paint", icon: PaintBucket, label: "Cat Dinding" },
		{ id: "lighting", icon: Lamp, label: "Pencahayaan" },
		{ id: "grid", icon: Grid, label: "Grid Lantai" },
		{ id: "bed", icon: BedDouble, label: "Furniture Bed" },
		{ id: "door", icon: DoorClosed, label: "Pintu & Jendela" },
		{ id: "chair", icon: Armchair, label: "Furniture Kursi" },
	];

	const handleToolClick = (toolId: string) => {
		const newTool = activeTool === toolId ? null : (toolId as ToolType);
		onSelectTool(newTool);
	};

	return (
		<TooltipProvider>
			{/* Hapus 'fixed right-10' karena layout akan diatur oleh Parent Flexbox */}
			<div className="flex flex-col items-center gap-4 bg-white py-4 w-20 h-full border-l z-50">
				{/* Home */}
				<div className="flex items-center justify-center p-3 border-none shadow-none">
					<Tooltip>
						<TooltipTrigger asChild>
							<Home
								onClick={() => onSelectTool(null)} // Reset/Close panel
								className="cursor-pointer hover:text-primary transition-colors h-6 w-6"
							/>
						</TooltipTrigger>
						<TooltipContent side="left">
							<p>Home</p>
						</TooltipContent>
					</Tooltip>
				</div>

				{/* Spacer */}
				<div className="h-4" />

				{/* Paint tools */}
				<Card className="flex flex-col items-center gap-6 p-3 border-none shadow-none">
					{tools.map((item) => {
						const isActive = activeTool === item.id;

						return (
							<Tooltip key={item.id} delayDuration={100}>
								<TooltipTrigger asChild>
									<Button
										onClick={() => handleToolClick(item.id)}
										className={cn(
											"p-2 rounded-lg transition-all duration-200",
											isActive
												? "bg-slate-200 text-slate-900 hover:bg-slate-100" // Style saat aktif
												: "text-slate-500 hover:text-slate-900 hover:bg-slate-100 bg-slate-50" // Style default
										)}
									>
										<item.icon className="h-6 w-6" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="left">
									<p>{item.label}</p>
								</TooltipContent>
							</Tooltip>
						);
					})}
				</Card>
			</div>
		</TooltipProvider>
	);
};
