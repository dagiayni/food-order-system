import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artisan Kitchen — Microservices & Event-Driven Platform",
  description: "A luxury artisan food ordering frontend designed with UI-UX Pro Max and powered by ASP.NET Core, PostgreSQL, and RabbitMQ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-broken-100 text-espresso-950 antialiased selection:bg-caramel-500/20 selection:text-espresso-950">
        {children}
      </body>
    </html>
  );
}