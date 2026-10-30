import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { MockDataProvider } from "@/context/MockDataContext";
import { AppShell } from "@/components/shell/AppShell";
import { Toaster } from "@/components/ui/sonner";

const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  // Shown as the WhatsApp / Gmail link preview, so it speaks to merchants, not the team.
  title: "Moniebook Lite",
  description: "See how your business did today.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <MockDataProvider>
          <AppShell>{children}</AppShell>
          <Toaster position="bottom-center" />
        </MockDataProvider>
      </body>
    </html>
  );
}
