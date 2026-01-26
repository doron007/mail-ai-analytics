'use client'

import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useUIStore } from '@/hooks/useUIStore'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export function Shell({ children }: { children: React.ReactNode }) {
    const { sidebarOpen } = useUIStore()

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Sidebar />
            <div
                className={clsx(
                    'transition-all duration-300 ease-in-out min-h-screen flex flex-col',
                    sidebarOpen ? 'pl-64' : 'pl-0'
                )}
            >
                <Header />
                <main className="flex-1 p-6 overflow-x-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    )
}
