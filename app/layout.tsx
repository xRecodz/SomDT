import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import { Providers } from "@/components/providers"


export const metadata: Metadata = {
    title: "Somnia DevTools - Testnet Faucet & Explorer",
    description: "Get testnet tokens and explore the Somnia blockchain with our developer toolkit",
    generator: "X",
    icons: {
      icon: "/favicon.ico", // path di /app/ atau /public/
    },
  }


export default function RootLayout({
children,
}: Readonly<{
children: React.ReactNode
}>) {
return (
<html lang="en">
<body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
<Suspense fallback={null}>
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
<Providers>
{children}
<Toaster />
</Providers>
</ThemeProvider>
</Suspense>
<Analytics />
</body>
</html>
)
}