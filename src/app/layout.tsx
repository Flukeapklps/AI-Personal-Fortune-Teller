import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const sans = Noto_Sans_Thai({ variable: "--font-sans-thai", subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"] });
const serif = Noto_Serif_Thai({ variable: "--font-display-serif", subsets: ["thai", "latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  title: { default: "ดูดวงส่วนตัว · Personal AI Fortune Teller", template: "%s · ดูดวงส่วนตัว" },
  description: "ดูดวงรายวัน รายสัปดาห์ รายเดือน และรายปี จากวันเกิดของคุณ ด้วยราศี นักษัตร และศาสตร์ตัวเลข",
};

export const viewport: Viewport = { themeColor: "#0a1030" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="fortune-bg min-h-full">
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
