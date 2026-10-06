import { TOOL_PAGES } from "@/content/tools";
import { ToolPageLayout } from "@/components/Tools/ToolPageLayout";
import { toolMetadata } from "@/lib/toolMetadata";

export const metadata = toolMetadata("upi-qr-code-generator");

export default function Page() {
	return <ToolPageLayout config={TOOL_PAGES["upi-qr-code-generator"]} />;
}
