import type { Metadata } from "next"
import { Familjen_Grotesk, Hanken_Grotesk, JetBrains_Mono } from "next/font/google"

import "./globals.css"
import { SiteFooter, SiteHeader, TestnetBanner } from "@/components/ahadi/site-chrome"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const display = Familjen_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] })
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans" })
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: { default: "Ahadi: Every Prize Promise, Kept In Public", template: "%s · Ahadi" },
  description:
    "Ahadi is a SingularityNET Omega agent that pays hackathon winners from a published rule, only with the organiser's approval, and shows every dollar on a public ledger.",
  metadataBase: new URL("https://ahadi.codewitheugene.top"),
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "Ahadi: Every Prize Promise, Kept In Public",
    description: "A published rule, two signatures, and a receipt for every dollar.",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("antialiased", display.variable, sans.variable, mono.variable)}>
      <body className="flex min-h-dvh flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2">
          Skip to content
        </a>
        <TooltipProvider>
          <TestnetBanner />
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </TooltipProvider>
        <Toaster position="bottom-right" theme="light" />
      </body>
    </html>
  )
}
