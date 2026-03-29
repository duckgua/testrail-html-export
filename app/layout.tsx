import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { CredentialsProvider } from '@/contexts/CredentialsContext'
import CredentialsGate from '@/components/CredentialsGate'
import Header from '@/components/layout/Header'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TestRail Dashboard',
  description: '公司測試進度唯讀 Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={`${geist.className} bg-gray-50 text-gray-900 antialiased`}>
        <CredentialsProvider>
          <CredentialsGate>
            <Header />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </CredentialsGate>
        </CredentialsProvider>
      </body>
    </html>
  )
}
