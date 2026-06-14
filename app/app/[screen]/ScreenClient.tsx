"use client";
import { Screen } from "@/components/AppShell";

export default function ScreenClient({ screen }: { screen: string }) {
  return <Screen id={screen} go={(id: string) => { window.location.href = `/app/${id}`; }} />;
}
