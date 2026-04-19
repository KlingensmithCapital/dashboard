import type { Metadata } from "next"
import { Cormorant_Garamond, Manrope } from "next/font/google"
import "./globals.css"

const uiFont = Manrope({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
})

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Klingensmith Capital | PM Cockpit",
  description: "Portfolio Manager Cockpit for Klingensmith Capital's personal capital operating system.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${uiFont.variable} ${displayFont.variable} min-h-screen antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
