import { TOOL_PAGES } from "@/content/tools";
import { ToolPageLayout } from "@/components/Tools/ToolPageLayout";
import { toolMetadata } from "@/lib/toolMetadata";

export const metadata = toolMetadata("upi-charges-above-2000");

export default function Page() {
	return <ToolPageLayout config={TOOL_PAGES["upi-charges-above-2000"]} />;
}
