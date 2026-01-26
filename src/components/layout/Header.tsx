'use client'

import { useUIStore } from '@/hooks/useUIStore'
import { Menu, Bell, Sun, Moon, RefreshCw } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function Header() {
    const { toggleSidebar } = useUIStore()
    const { theme, setTheme } = useTheme()
    const queryClient = useQueryClient()
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await queryClient.invalidateQueries()
        setTimeout(() => setIsRefreshing(false), 1000)
    }

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center"
                >
                    <div className="relative w-5 h-5">
                        <Sun className="absolute inset-0 h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                        <Moon className="absolute inset-0 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-500" />
                    </div>
                </button>
                <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                </button>
            </div>
        </header>
    )
}
