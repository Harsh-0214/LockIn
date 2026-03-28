// /home/user/LockIn/app/layout.tsx
'use client'

import './globals.css'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Syne, DM_Sans } from 'next/font/google'
import Navigation from '@/components/Navigation'
import { useUserStore } from '@/store/useUserStore'

const syne = Syne({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const onboardingComplete = useUserStore((s) => s.onboardingComplete)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (!onboardingComplete && pathname !== '/onboarding') {
      router.replace('/onboarding')
    }
  }, [mounted, onboardingComplete, pathname, router])

  const isOnboarding = pathname === '/onboarding'

  if (!mounted) {
    return (
      <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
        <head>
          <title>Clutch</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body className="bg-bg text-textPrimary font-sans">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <head>
        <title>Clutch</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-bg text-textPrimary font-sans">
        {isOnboarding ? (
          <>{children}</>
        ) : (
          <div className="flex min-h-screen">
            {/* Desktop sidebar */}
            <div className="hidden md:block">
              <Navigation />
            </div>

            {/* Main content */}
            <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen overflow-y-auto">
              {children}
            </main>

            {/* Mobile bottom nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
              <Navigation mobile />
            </div>
          </div>
        )}
      </body>
    </html>
  )
}
