import type { Metadata } from "next";
import "./globals.css";
import "./reference-theme.css";
import "./onboarding.css";
import "./health.css";
import "./whoop-connection.css";
import "./water-card.css";
export const metadata: Metadata = {
  title: "Form — Your daily practice",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Form", statusBarStyle: "default" },
  icons: { icon: "/app-icon.svg", apple: "/apple-touch-icon.png" },
  description:
    "A little more intention. A little more progress. Your connected training and wellness journal.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
