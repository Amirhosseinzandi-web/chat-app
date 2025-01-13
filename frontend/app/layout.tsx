import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/shared/Navbar/Navbar";
import CustomLayout from "@/components/shared/CustomLayout";



export const metadata: Metadata = {
  title: "Chat App",
  description: "A chat app built with love"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CustomLayout>
          <Navbar />
          {children}
        </CustomLayout>
      </body>
    </html >
  );
}
