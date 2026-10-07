import { TOOL_PAGES } from "@/content/tools";
import { ToolPageLayout } from "@/components/Tools/ToolPageLayout";
import { toolMetadata } from "@/lib/toolMetadata";

export const metadata = toolMetadata("gst-calculator");

export default function Page() {
	return <ToolPageLayout config={TOOL_PAGES["gst-calculator"]} />;
}
