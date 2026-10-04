import type { Metadata } from "next";
// Fonts are self-hosted from npm so the app works offline and without Google.
import "@fontsource-variable/sora";
import "@fontsource-variable/dm-sans";
import "@fontsource/caveat/600.css";
import "@fontsource/caveat/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BillingEase", template: "%s · BillingEase" },
  description: "Your whole business in three numbers: what's coming in, what's going out, and what's yours to keep.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink">{children}</body>
    </html>
  );
}
