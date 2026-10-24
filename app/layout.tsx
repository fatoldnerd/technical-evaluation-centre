import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Technical Evaluation Command Centre",
  description:
    "Evidence, decisions and field practice. Fictional EMEA demonstration.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
