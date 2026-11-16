import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oneerp.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CANDRON OneERP",
    template: "%s",
  },
  description:
    "One platform managing the complete lifecycle of an electrical infrastructure project — from first inquiry to warranty.",
  applicationName: "CANDRON OneERP",
  // Authenticated application: keep the app out of search indexes by default.
  // The public login/register pages re-enable indexing via their own metadata.
  robots: { index: false, follow: false },
  openGraph: {
    title: "CANDRON OneERP",
    description:
      "The project lifecycle platform for electrical equipment manufacturers — inquiry to warranty, on one spine.",
    siteName: "CANDRON OneERP",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
