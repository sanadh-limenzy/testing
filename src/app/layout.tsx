import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { env } from "@/env";
import { Roboto, Figtree, Paprika, EB_Garamond } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
});

const paprika = Paprika({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-paprika",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-eb-garamond",
});

export const metadata: Metadata = {
  title: "TheAugustaRule",
  description: "Professional document management and PDF generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased ${roboto.variable} ${figtree.variable} ${paprika.variable} ${ebGaramond.variable} font-roboto`}>
        <Providers>{children}</Providers>
        <Toaster />
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
