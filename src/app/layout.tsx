import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSession } from "@/actions/auth";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: process.env.NODE_ENV === 'development' ? "Eventos-Dev" : "GestorEventos",
  description: "Aplicación de tesorería y gestión para eventos",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: process.env.NODE_ENV === 'development' ? "Eventos-Dev" : "GestorEventos",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  
  return (
    <html lang="es">
      <head>
        {process.env.NODE_ENV === 'development' && (
          <>
            <link rel="icon" href="/dev-icon.jpg" type="image/jpeg" sizes="any" />
            <link rel="apple-touch-icon" href="/dev-icon.jpg" />
          </>
        )}
      </head>
      <body className={inter.className}>
        <Navbar session={session} />
        <main style={{ padding: '0 1rem 2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
