'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Search, Filter, Calendar as CalendarIcon, Mail, FolderOpen, AlertCircle, ChevronRight } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { searchService, EmailSearchResult, EmailDecisionDetails } from '@/services/api/search.service'
import { DecisionDetailsModal } from '@/components/search/DecisionDetailsModal'
import { formatRelativeTime } from '@/lib/utils'

function useSearchEmails(filters: { query: string, status: string, date: string }) {
    return useQuery({
        queryKey: ['search', filters],
        queryFn: () => searchService.search(filters),
    })
}

function useEmailDetails(decisionId: string | null) {
    return useQuery({
        queryKey: ['emailDetails', decisionId],
        queryFn: () => decisionId ? searchService.getEmailDetails(decisionId) : null,
        enabled: !!decisionId,
    })
}

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchPageSkeleton />}>
            <SearchPageContent />
        </Suspense>
    )
}

function SearchPageSkeleton() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded mt-2 animate-pulse" />
            </div>
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800/50 rounded-lg animate-pulse" />)}
            </div>
        </div>
    )
}

function SearchPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // Initialize state from URL params
    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [status, setStatus] = useState(searchParams.get('status') || '')
    const [date, setDate] = useState(searchParams.get('date') || '')

    // Modal state
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)

    // Update URL when filters change
    const updateUrl = (newParams: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(newParams).forEach(([key, value]) => {
            if (value) params.set(key, value)
            else params.delete(key)
        })
        router.replace(`/search?${params.toString()}`)
    }

    // Effect to sync URL params to state
    useEffect(() => {
        setQuery(searchParams.get('q') || '')
        setStatus(searchParams.get('status') || '')
        setDate(searchParams.get('date') || '')
    }, [searchParams])

    const { data: results, isLoading } = useSearchEmails({ query, status, date })
    const { data: selectedEmailDetails } = useEmailDetails(selectedEmailId)

    const urgencyColors: Record<string, string> = {
        'Critical': 'bg-red-500/20 text-red-400 border-red-500/30',
        'High': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        'Medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'Low': 'bg-green-500/20 text-green-400 border-green-500/30',
    }

    const actionIcons: Record<string, React.ReactNode> = {
        'file_only': <FolderOpen className="h-4 w-4" />,
        'action_required': <AlertCircle className="h-4 w-4" />,
        'draft_reply': <Mail className="h-4 w-4" />,
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search Emails</h1>
                <p className="text-gray-500 dark:text-gray-400">Find and analyze email decisions and their processing details.</p>
            </div>

            <Card className="flex-shrink-0">
                <CardContent className="p-4 space-y-4">
                    {/* Main Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Subject, Sender, or ID..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                updateUrl({ q: e.target.value })
                            }}
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap gap-4">
                        {/* Urgency Filter */}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                className="bg-transparent text-sm focus:outline-none text-gray-700 dark:text-gray-300"
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value)
                                    updateUrl({ status: e.target.value })
                                }}
                            >
                                <option value="">All Urgencies</option>
                                <option value="Critical">Critical</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
                            <CalendarIcon className="h-4 w-4 text-gray-500" />
                            <input
                                type="date"
                                className="bg-transparent text-sm focus:outline-none text-gray-700 dark:text-gray-300"
                                value={date}
                                onChange={(e) => {
                                    setDate(e.target.value)
                                    updateUrl({ date: e.target.value })
                                }}
                            />
                        </div>

                        {(status || date || query) && (
                            <button
                                onClick={() => {
                                    setQuery('')
                                    setStatus('')
                                    setDate('')
                                    router.push('/search')
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 px-2"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Results Area */}
            <div className="flex-1 overflow-auto space-y-2">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800/50 rounded-lg animate-pulse" />)}
                    </div>
                ) : results && results.length > 0 ? (
                    results.map((email) => (
                        <EmailRow
                            key={email.id}
                            email={email}
                            urgencyColors={urgencyColors}
                            actionIcons={actionIcons}
                            onClick={() => setSelectedEmailId(email.id)}
                        />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/30 dark:bg-gray-900/30 py-12">
                        <Search className="h-8 w-8 mb-2 opacity-20" />
                        <p>No emails found matching your filters.</p>
                        <p className="text-sm mt-1">Try adjusting your search criteria or date range.</p>
                    </div>
                )}
            </div>

            {/* Decision Details Modal */}
            <DecisionDetailsModal
                decision={selectedEmailDetails || null}
                open={!!selectedEmailId}
                onClose={() => setSelectedEmailId(null)}
            />
        </div>
    )
}

// Email Row Component
function EmailRow({
    email,
    urgencyColors,
    actionIcons,
    onClick
}: {
    email: EmailSearchResult
    urgencyColors: Record<string, string>
    actionIcons: Record<string, React.ReactNode>
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className="w-full group flex items-center justify-between p-4 bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 rounded-xl transition-all text-left"
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Icon based on action */}
                <div className={`p-2.5 rounded-full shrink-0 ${
                    email.ai_action === 'action_required'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        : email.ai_action === 'draft_reply'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                    {actionIcons[email.ai_action || ''] || <Mail className="h-5 w-5" />}
                </div>

                {/* Email Info */}
                <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {email.subject || '(No Subject)'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="truncate max-w-[200px]">{email.sender_email || 'Unknown'}</span>
                        <span className="shrink-0">•</span>
                        <span className="shrink-0">{formatRelativeTime(email.received_at || email.created_at)}</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Category, Urgency, Folder */}
            <div className="flex items-center gap-3 shrink-0 ml-4">
                {/* Category Badge */}
                {email.ai_category && (
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                        <span className="truncate max-w-[100px]">{email.ai_category.split('/').pop()}</span>
                    </div>
                )}

                {/* Urgency Badge */}
                {email.ai_urgency && (
                    <div className={`px-2 py-1 rounded-md text-xs font-medium border ${urgencyColors[email.ai_urgency] || 'bg-gray-100 text-gray-600'}`}>
                        {email.ai_urgency}
                    </div>
                )}

                {/* Folder Path */}
                {email.ai_folder_path && (
                    <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 max-w-[120px]">
                        <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{email.ai_folder_path.split('/').pop()}</span>
                    </div>
                )}

                {/* Corrected indicator */}
                {email.was_corrected && (
                    <div className="h-2 w-2 rounded-full bg-yellow-500" title="User corrected" />
                )}

                {/* Chevron */}
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-cyan-500 transition-colors" />
            </div>
        </button>
    )
}
