import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/shared/Navbar/Navbar";
import CustomLayout from "@/components/shared/CustomLayout";


export const metadata: Metadata = {
  title: "Chatty",
  description: "A fast, private chat app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chatty",
  },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <CustomLayout>
          <Navbar />
          {children}
        </CustomLayout>
      </body>
    </html>
  );
}
