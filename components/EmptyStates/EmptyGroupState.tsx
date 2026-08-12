import { Users } from "lucide-react";

interface EmptyGroupStateProps {
	onCreateGroup: () => void;
}

export const EmptyGroupState = ({ onCreateGroup }: EmptyGroupStateProps) => {
	return (
		<div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-indigo-100 p-6 sm:p-8 text-center">
			<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
				<Users className="h-7 w-7 text-indigo-600" />
			</div>
			<p className="font-display text-xl font-bold text-gray-900 mb-1">
				Start your first group
			</p>
			<p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto leading-relaxed">
				Add friends, log expenses in ₹, settle with UPI — no signup needed.
			</p>
			<button
				onClick={onCreateGroup}
				className="w-full sm:w-auto min-h-12 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl hover:from-indigo-700 hover:to-violet-700 font-semibold shadow-lg text-sm touch-manipulation"
			>
				Create group
			</button>
		</div>
	);
};
