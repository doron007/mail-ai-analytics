import type { Metadata } from 'next'
import './globals.css'
import { Shell } from '@/components/layout/Shell'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'MailAI Analytics',
  description: 'Advanced analytics and control for Outlook Inbox Manager',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-950 min-h-screen font-sans antialiased selection:bg-blue-100 dark:selection:bg-blue-900/30">
        <Providers>
          <Shell>
            {children}
          </Shell>
        </Providers>
      </body>
    </html>
  )
}
