'use client'

import { useUIStore } from '@/hooks/useUIStore'
import {
    LayoutDashboard,
    Activity,
    Settings,
    Database,
    Search,
    BookOpen,
    Mail
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Corrections', href: '/corrections', icon: BookOpen },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const { sidebarOpen } = useUIStore()

    return (
        <aside
            className={clsx(
                'fixed inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out',
                !sidebarOpen && '-translate-x-full'
            )}
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-gradient-to-br from-violet-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400">
                            MailAI
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                                    isActive
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                )}
                            >
                                <item.icon
                                    className={clsx(
                                        'h-5 w-5 transition-colors',
                                        isActive
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
                                    )}
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer / User Profile placeholder */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                Administrator
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                ops@mailai.dev
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
