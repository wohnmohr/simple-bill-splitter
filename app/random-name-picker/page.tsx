import { TOOL_PAGES } from "@/content/tools";
import { ToolPageLayout } from "@/components/Tools/ToolPageLayout";
import { toolMetadata } from "@/lib/toolMetadata";

export const metadata = toolMetadata("random-name-picker");

export default function Page() {
	return <ToolPageLayout config={TOOL_PAGES["random-name-picker"]} />;
}
