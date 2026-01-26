'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowRight, CornerDownRight, AlertTriangle } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useState } from 'react'
import { ErrorLog } from '@/components/dashboard/ErrorLog'

export function LiveFeed({ activity, loading }: { activity: any[], loading: boolean }) {
    const [showErrors, setShowErrors] = useState(false)
    const errors = activity?.filter(a => a.status === 'error') || []

    return (
        <>
            <div className="bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm shadow-sm overflow-hidden h-full flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Live Stream
                    </h3>
                    <div className="flex items-center gap-3">
                        {errors.length > 0 && (
                            <button
                                onClick={() => setShowErrors(true)}
                                className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full transition-colors"
                            >
                                <AlertTriangle className="h-3 w-3" />
                                {errors.length} Errors
                            </button>
                        )}
                        <span className="text-xs text-gray-400 font-mono tracking-wider uppercase">Real-time</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800/50 rounded-xl animate-pulse" />)}
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {activity.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="group relative pl-4 pb-4 border-l-2 border-gray-100 dark:border-gray-800 last:border-0 last:pb-0"
                                >
                                    <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white dark:border-gray-950 ${item.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                        }`} />

                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                                                {item.subject || '(No Subject)'}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="capitalize px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                    {item.operation_type}
                                                </span>
                                                <span>•</span>
                                                <span>{formatRelativeTime(item.timestamp)}</span>
                                                {item.duration_ms && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="font-mono">{item.duration_ms}ms</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {item.status === 'error' && (
                                            <button onClick={() => setShowErrors(true)}>
                                                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 hover:text-red-600 transition-colors" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
            <AnimatePresence>
                {showErrors && <ErrorLog errors={errors} onClose={() => setShowErrors(false)} />}
            </AnimatePresence>
        </>
    )
}
