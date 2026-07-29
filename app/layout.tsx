import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://codextests2.github.io/pixel-quest-adventure/"),
  title: "小暴君游戏｜皇城像素冒险",
  description: "化身固定少年侠客，吃糖葫芦变大，闯过皇城郊野抵达金瓦皇宫。",
  openGraph: {
    title: "小暴君游戏｜皇城像素冒险",
    description: "跳、吃、变大，抵达皇宫。",
    images: [{ url: "/pixel-quest-adventure/og.png", width: 1536, height: 1024 }],
  },
  twitter: { card: "summary_large_image", images: ["/pixel-quest-adventure/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
