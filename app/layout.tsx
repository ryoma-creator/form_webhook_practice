import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Form Webhook Practice",
  description: "Simple lead capture form with webhook integration",
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

