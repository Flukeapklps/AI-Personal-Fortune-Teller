import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const sans = Noto_Sans_Thai({ variable: "--font-sans-thai", subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"] });
const serif = Noto_Serif_Thai({ variable: "--font-display-serif", subsets: ["thai", "latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  title: { default: "HSK Learning", template: "%s · HSK Learning" },
  description: "HSK Chinese learning system with a Personal AI Fortune Teller.",
};

export const viewport: Viewport = { themeColor: "#0a1030" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
