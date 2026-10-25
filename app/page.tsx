import type { Metadata } from "next";
import { LandingPage } from "@/components/Landing/LandingPage";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Landing() {
	return <LandingPage />;
}
