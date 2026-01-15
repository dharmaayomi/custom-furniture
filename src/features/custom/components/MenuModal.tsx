import { X } from "lucide-react";
import React from "react";

interface MenuModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const MenuModal = ({ isOpen, onClose }: MenuModalProps) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			{/* Box Modal */}
			<div className="bg-white p-6 rounded-xl w-[90%] max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
				{/* Tombol Close */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-500 hover:text-black"
				>
					<X />
				</button>

				<h2 className="text-xl font-bold mb-4">Menu</h2>

				<ul className="space-y-3">
					<li className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer">
						New Room
					</li>
					<li className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer">
						Load Design
					</li>
					<li className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer">
						Export
					</li>
					<li className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer text-red-500">
						Exit
					</li>
				</ul>
			</div>
		</div>
	);
};
