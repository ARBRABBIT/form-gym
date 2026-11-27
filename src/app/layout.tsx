import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./reference-theme.css";
import "./onboarding.css";
import "./health.css";
import "./whoop-connection.css";
import "./water-card.css";
import "./mobile-nav.css";
import "./date-strip.css";
import "./recovery-card.css";
import "./blood-health-card.css";
import "./lung-card.css";
import "./icons.css";
import "./water-screen.css";
import "./water-sources.css";
import "./date-picker.css";
import "./home-dashboard.css";
import "./sidebar-menu.css";
import "./journal-detail.css";
import "./profile-screen.css";
import "./reminder-sheet.css";
import "./workout-muscles.css";
import "./interactions.css";
import "./chart-reading-popup.css";
import "./body-composition-card.css";
import "./display-numerals.css";

const urbanist = localFont({
  src: "../../public/fonts/Urbanist-Variable.ttf",
  variable: "--font-urbanist",
  weight: "100 900",
  display: "swap",
});
const matricha = localFont({
  src: "../../public/fonts/Matricha-Regular.woff",
  variable: "--font-matricha",
  weight: "400",
  display: "swap",
});
const robotoCondensed = localFont({
  src: "../../public/fonts/RobotoCondensed-Variable.ttf",
  weight: "100 900",
  style: "normal",
  variable: "--font-roboto-condensed",
  display: "swap",
});
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
    <html lang="en" className={`${urbanist.variable} ${robotoCondensed.variable} ${matricha.variable}`}>
      <body>{children}</body>
    </html>
  );
}
