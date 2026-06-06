import "./globals.css";

export const metadata = {
  title: "Crypto-Agility Monitor",
  description:
    "Find every quantum-vulnerable cryptographic usage across your code and your network, then let an AI agent on Splunk generate and execute the migration plan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
