'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, FolderOpen, AlertCircle, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { searchService, EmailSearchResult, EmailDecisionDetails } from '@/services/api/search.service'
import { DecisionDetailsModal } from '@/components/search/DecisionDetailsModal'
import { formatRelativeTime } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [5, 10, 20]

function useRecentEmails(page: number, pageSize: number) {
    return useQuery({
        queryKey: ['recentEmails', page, pageSize],
        queryFn: () => searchService.getRecentEmails(page, pageSize),
        refetchInterval: 30000, // Refresh every 30s
    })
}

function useEmailDetails(decisionId: string | null) {
    return useQuery({
        queryKey: ['emailDetails', decisionId],
        queryFn: () => decisionId ? searchService.getEmailDetails(decisionId) : null,
        enabled: !!decisionId,
    })
}

export function RecentEmails() {
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)

    const { data, isLoading } = useRecentEmails(page, pageSize)
    const { data: selectedEmailDetails } = useEmailDetails(selectedEmailId)

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize)
        setPage(1) // Reset to first page
    }

    const urgencyColors: Record<string, string> = {
        'Critical': 'bg-red-500',
        'High': 'bg-orange-500',
        'Medium': 'bg-yellow-500',
        'Low': 'bg-green-500',
    }

    return (
        <>
            <div className="bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm shadow-sm overflow-hidden h-full flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Recent Emails
                    </h3>
                    {/* Page Size Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Show:</span>
                        <div className="relative">
                            <select
                                value={pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 pr-6 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {PAGE_SIZE_OPTIONS.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Email List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800/50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : data?.emails && data.emails.length > 0 ? (
                        <AnimatePresence initial={false}>
                            {data.emails.map((email, index) => (
                                <motion.button
                                    key={email.id}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    onClick={() => setSelectedEmailId(email.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-left group"
                                >
                                    {/* Icon */}
                                    <div className={`p-2 rounded-lg shrink-0 ${
                                        email.ai_action === 'action_required'
                                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                            : email.ai_action === 'draft_reply'
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {email.ai_action === 'file_only' ? (
                                            <FolderOpen className="h-4 w-4" />
                                        ) : email.ai_action === 'action_required' ? (
                                            <AlertCircle className="h-4 w-4" />
                                        ) : (
                                            <Mail className="h-4 w-4" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {email.subject || '(No Subject)'}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            <span className="truncate max-w-[120px]">{email.sender_email?.split('@')[0] || 'Unknown'}</span>
                                            <span>•</span>
                                            <span>{formatRelativeTime(email.received_at || email.created_at)}</span>
                                        </div>
                                    </div>

                                    {/* Urgency Dot */}
                                    {email.ai_urgency && (
                                        <div
                                            className={`h-2 w-2 rounded-full shrink-0 ${urgencyColors[email.ai_urgency] || 'bg-gray-400'}`}
                                            title={email.ai_urgency}
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                            No emails found
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                {data && data.totalPages > 1 && (
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                        <span className="text-xs text-gray-500">
                            Page {data.page} of {data.totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                disabled={page === data.totalPages}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Decision Details Modal */}
            <DecisionDetailsModal
                decision={selectedEmailDetails || null}
                open={!!selectedEmailId}
                onClose={() => setSelectedEmailId(null)}
            />
        </>
    )
}
