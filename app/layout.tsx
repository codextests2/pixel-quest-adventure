import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixel Quest｜你的像素冒险",
  description: "化身固定少年侠客，吃糖葫芦变大，闯过皇城郊野抵达金瓦皇宫。",
  openGraph: {
    title: "Pixel Quest｜你的像素冒险",
    description: "跳、吃、变大，抵达皇宫。",
    images: [{ url: "/og.png", width: 1536, height: 1024 }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
