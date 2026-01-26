'use client'

import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatRelativeTime } from '@/lib/utils'

interface ErrorLogProps {
    errors: any[]
    onClose: () => void
}

export function ErrorLog({ errors, onClose }: ErrorLogProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[80vh]"
            >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Error Log ({errors.length})
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {errors.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No errors found in the current feed.
                        </div>
                    ) : (
                        errors.map((error) => (
                            <div key={error.id} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4 space-y-2">
                                <div className="flex items-start justify-between">
                                    <h4 className="font-medium text-red-900 dark:text-red-300">
                                        {error.subject || '(No Subject)'}
                                    </h4>
                                    <span className="text-xs text-red-700 dark:text-red-400 font-mono">
                                        {formatRelativeTime(error.timestamp)}
                                    </span>
                                </div>
                                <div className="text-sm text-red-800 dark:text-red-200 font-mono bg-white dark:bg-black/20 p-2 rounded">
                                    {error.error_message || 'Unknown error occurred'}
                                </div>
                                <div className="flex gap-2 text-xs text-red-600 dark:text-red-400">
                                    <span className="uppercase tracking-wider">{error.operation_type}</span>
                                    <span>•</span>
                                    <span>ID: {error.id.slice(0, 8)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    )
}
