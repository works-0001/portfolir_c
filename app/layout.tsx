import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Isabella Chen — Creative Portfolio",
  description: "Visual designer crafting brand identities, digital experiences, and memorable moments.",
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
