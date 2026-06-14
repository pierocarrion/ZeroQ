import { notFound } from "next/navigation";
import ScreenClient from "./ScreenClient";

const SCREENS = [
  "dashboard", "inventory", "certs", "repos", "agent", "plan",
  "hndl", "assistant", "roadmap", "compliance", "settings", "architecture",
] as const;

type ScreenId = (typeof SCREENS)[number];

export function generateStaticParams() {
  return SCREENS.map((screen) => ({ screen }));
}

export default function AppScreenPage({ params }: { params: { screen: string } }) {
  const id = params.screen as ScreenId;
  if (!SCREENS.includes(id)) notFound();
  return <ScreenClient screen={id} />;
}
