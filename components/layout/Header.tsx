'use client'

import Link from 'next/link'
import { useCredentials } from '@/contexts/CredentialsContext'

export default function Header() {
  const { clearCredentials } = useCredentials()

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600 transition-colors">
            <span className="text-xl">🧪</span>
            <span className="hidden sm:inline">TestRail Dashboard</span>
            <span className="sm:hidden">TR Dashboard</span>
          </Link>

          <div className="flex items-center gap-1">
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Projects
              </Link>
              <Link
                href="/search"
                className="px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden sm:inline">搜尋</span>
              </Link>
            </nav>

            <div className="flex items-center ml-2 pl-2 border-l border-gray-200">
              <button
                onClick={clearCredentials}
                className="text-xs text-gray-400 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                title="更換 TestRail 憑證"
              >
                更換憑證
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
