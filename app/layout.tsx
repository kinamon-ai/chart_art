import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "手書きチャートでドルコスト平均法の体験",
  description:
    "チャートを手書きして積立投資のドルコスト平均法を、価格変動シナリオでシミュレーションします。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
