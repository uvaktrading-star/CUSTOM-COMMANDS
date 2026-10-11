import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata = {
  title: "ZANTA-MINI | Commands",
  description: "ZANTA MINI Custom Commands Creator Tool.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    url: "https://www.commands.zanta-mini.store",
    title: "ZANTA MINI COMMANDS",
    description: "The Powerful WhatsApp bot.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZANTA MINI",
    description: "ZANTA MINI Custom Commands Creator Tool.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
