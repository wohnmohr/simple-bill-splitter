"use client";

import QRCode from "qrcode";
import { Check, Copy, Download } from "lucide-react";
import { UpiQr } from "@/components/Settlements/UpiQr";
import { useCopy } from "./shared";

/** A UPI QR with the two things people always want next: save it, copy the link. */
export const UpiQrCard = ({
	link,
	label,
	filename,
}: {
	link: string;
	label: string;
	filename: string;
}) => {
	const [copied, copy] = useCopy();

	const download = async () => {
		const url = await QRCode.toDataURL(link, {
			width: 768,
			margin: 2,
			errorCorrectionLevel: "M",
			color: { dark: "#1c1826", light: "#ffffff" },
		});
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
	};

	return (
		<div className="flex flex-col items-center gap-3">
			<UpiQr link={link} label={label} className="h-52 w-52" />
			<div className="grid w-full grid-cols-2 gap-2">
				<button type="button" onClick={download} className="btn-secondary !px-3 whitespace-nowrap">
					<Download className="h-4 w-4" />
					Download PNG
				</button>
				<button type="button" onClick={() => copy(link)} className="btn-secondary !px-3 whitespace-nowrap">
					{copied ? <Check className="h-4 w-4 text-positive" /> : <Copy className="h-4 w-4" />}
					{copied ? "Copied" : "Copy link"}
				</button>
			</div>
		</div>
	);
};
