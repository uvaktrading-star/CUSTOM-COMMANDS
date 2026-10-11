import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",  
});

const BASE_URL = "https://commands.zanta-mini.store";

export const metadata = {
  metadataBase: new URL(BASE_URL),  

  title: {
    default: "ZANTA-MINI | Custom Commands",
    template: "%s | ZANTA-MINI",
  },

  description:
    "Create custom WhatsApp bot commands with ZANTA-MINI — the powerful command builder for your bot.",

  keywords: [
    "ZANTA",
    "ZANTA-MINI",
    "WhatsApp bot",
    "custom commands",
    "bot commands",
    "command builder",
  ],

  authors: [{ name: "ZANTA-MINI" }],
  creator: "ZANTA-MINI",
  publisher: "ZANTA-MINI",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },

  openGraph: {
    type: "website",
    url: BASE_URL,  
    siteName: "ZANTA-MINI",
    title: "ZANTA-MINI | Custom Commands Creator",
    description:
      "The powerful WhatsApp bot command builder — create simple or API-powered commands.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ZANTA-MINI Custom Commands",
      },
    ],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "ZANTA-MINI | Custom Commands",
    description:
      "Create custom WhatsApp bot commands with ZANTA-MINI.",
    images: ["/og.png"],
    creator: "@zanta_mini",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: BASE_URL, 
  },

  category: "technology",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0f",
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
