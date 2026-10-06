import { TOOL_PAGES } from "@/content/tools";
import { ToolPageLayout } from "@/components/Tools/ToolPageLayout";
import { toolMetadata } from "@/lib/toolMetadata";

export const metadata = toolMetadata("restaurant-bill-splitter");

export default function Page() {
	return <ToolPageLayout config={TOOL_PAGES["restaurant-bill-splitter"]} />;
}
