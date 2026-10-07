import "@mantine/core/styles.css";
import "./mantine-overrides.css";
import { MantineProvider } from "./MantineProvider";

/**
 * Mantine (≈195 KB of CSS plus its runtime) is only needed on the dashboard,
 * shared settlements and feature requests. Wrapping just those routes keeps it
 * off the landing page and every tool page.
 */
export function MantineScope({ children }: { children: React.ReactNode }) {
	return <MantineProvider>{children}</MantineProvider>;
}
