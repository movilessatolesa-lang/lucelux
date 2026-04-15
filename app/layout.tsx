import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lucelux — Gestión de trabajos",
  description: "Gestión de trabajos para carpinteros de aluminio e instaladores",
};

export const viewport: Viewport = {
  themeColor: "#0d1e6b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
