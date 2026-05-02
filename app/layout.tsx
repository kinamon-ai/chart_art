import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ドルコスト平均法シミュレータ",
  description:
    "積立投資のドルコスト平均法を、価格変動シナリオでシミュレーションします。",
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
