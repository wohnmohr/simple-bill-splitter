import { Users } from "lucide-react";

interface EmptyGroupStateProps {
	onCreateGroup: () => void;
}

export const EmptyGroupState = ({ onCreateGroup }: EmptyGroupStateProps) => {
	return (
		<div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/50 p-6 sm:p-8 text-center">
			<Users className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-3 text-indigo-500" />
			<p className="text-base sm:text-lg font-semibold text-gray-700 mb-2">
				Create Your First Group
			</p>
			<p className="text-xs sm:text-sm text-gray-500 mb-4 px-2">
				Start by creating a group and adding members
			</p>
			<button
				onClick={onCreateGroup}
				className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 active:from-indigo-800 active:to-purple-800 font-semibold shadow-lg text-sm sm:text-base touch-manipulation"
			>
				Create Group
			</button>
		</div>
	);
};
