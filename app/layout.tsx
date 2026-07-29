import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixel Quest｜你的像素冒险",
  description: "上传个人图案，吃蘑菇变大，闯过青绿原野抵达城堡。",
  openGraph: {
    title: "Pixel Quest｜你的像素冒险",
    description: "跳、吃、变大，抵达城堡。",
    images: [{ url: "/og.png", width: 1536, height: 1024 }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
