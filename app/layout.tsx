import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simplest Todo",
  description: "Minimal local todo app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
