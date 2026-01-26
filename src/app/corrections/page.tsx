'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { correctionsService, Correction } from '@/services/api/corrections.service'
import { searchService } from '@/services/api/search.service'
import { DecisionDetailsModal } from '@/components/search/DecisionDetailsModal'
import { formatRelativeTime } from '@/lib/utils'
import { ArrowRight, BrainCircuit, User } from 'lucide-react'

function useCorrections() {
    return useQuery({
        queryKey: ['corrections'],
        queryFn: () => correctionsService.getCorrections(),
    })
}

function useEmailDetails(decisionId: string | null) {
    return useQuery({
        queryKey: ['emailDetails', decisionId],
        queryFn: () => decisionId ? searchService.getEmailDetails(decisionId) : null,
        enabled: !!decisionId,
    })
}

// Learning Weight Circular Progress Component
function LearningWeightCircle({ percentage }: { percentage: number }) {
    const radius = 22
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                {/* Background circle */}
                <circle
                    cx="32" cy="32" r={radius}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="5"
                    className="dark:stroke-slate-700"
                />
                {/* Progress circle */}
                <circle
                    cx="32" cy="32" r={radius}
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#F97316" />
                    </linearGradient>
                </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-400">
                {percentage}%
            </span>
        </div>
    )
}

// Correction Card Component with two-panel layout
function CorrectionCard({ correction, onClick }: { correction: Correction; onClick: () => void }) {
    // Extract folder names from the action strings
    const aiFolder = correction.ai_action?.replace('Proposed ', '') || 'Unknown'
    const userFolder = correction.user_action?.replace('Moved to ', '') || 'Unknown'
    const learningWeight = correction.learning_weight ?? 0.85

    return (
        <div
            className="bg-white dark:bg-slate-900/80 rounded-2xl shadow-xl p-6 md:p-8 mb-8 cursor-pointer hover:shadow-2xl transition-shadow"
            onClick={onClick}
        >
            {/* Email Subject Header */}
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white text-center flex-1">
                    {correction.email_subject || 'No Subject'}
                </h2>
                <span className="text-xs font-mono text-gray-400 whitespace-nowrap ml-4">
                    {formatRelativeTime(correction.created_at)}
                </span>
            </div>

            {/* Two-panel layout */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch relative">

                {/* LEFT: AI Proposal Panel */}
                <div className="flex-1 rounded-xl p-5 bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700 border-2 border-slate-300/50 dark:border-slate-500/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-white/20">
                            <BrainCircuit className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">AI Proposal</h3>
                    </div>

                    <p className="text-sm text-white/80 mb-2">Suggested Action:</p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="px-4 py-2 rounded-lg bg-blue-500/90 text-white font-medium text-sm">
                            {aiFolder}
                        </div>
                    </div>
                    <p className="text-sm text-white/90 mt-3">
                        Move email from &apos;Inbox&apos; to &apos;{aiFolder}&apos;.
                    </p>

                    <p className="text-xs text-white/60 mt-4">
                        Based on similar patterns and content analysis.
                    </p>
                </div>

                {/* CURVED ARROW (desktop only) */}
                <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <svg width="50" height="35" viewBox="0 0 50 35" className="text-gray-400 dark:text-gray-500 drop-shadow-md">
                        <path
                            d="M5 17.5 Q25 5 40 17.5 M35 12 L40 17.5 L35 23"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                {/* Mobile arrow */}
                <div className="flex md:hidden justify-center py-2">
                    <ArrowRight className="h-6 w-6 text-gray-400" />
                </div>

                {/* RIGHT: User Action Panel */}
                <div className="flex-1 rounded-xl p-5 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 border-2 border-purple-400/50 relative overflow-hidden">
                    {/* Sparkle/particle effect overlay */}
                    <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 1px, transparent 1px),
                                             radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 1px, transparent 1px),
                                             radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 2px, transparent 2px)`,
                            backgroundSize: '30px 30px, 40px 40px, 50px 50px'
                        }}
                    />

                    <div className="flex items-center gap-3 mb-4 relative">
                        <div className="p-2 rounded-lg bg-white/20">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">User Action</h3>
                    </div>

                    <p className="text-sm text-white/80 mb-2 relative">Your Action:</p>
                    <div className="flex items-center gap-3 flex-wrap relative">
                        <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-400 to-amber-500 text-white font-medium text-sm shadow-lg">
                            {userFolder}
                        </div>
                    </div>
                    <p className="text-sm text-white/90 mt-3 relative">
                        Moved email to &apos;{userFolder}&apos;.
                    </p>

                    <p className="text-xs text-white/60 mt-4 relative">
                        Correction applied. This choice informs future suggestions.
                    </p>
                </div>
            </div>

            {/* Learning Weight Section */}
            <div className="mt-6 flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <LearningWeightCircle percentage={Math.round(learningWeight * 100)} />
                <div>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                        Learning Weight: {learningWeight.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        This correction significantly improves future filing accuracy. Keep it up!
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function CorrectionsPage() {
    const { data: corrections, isLoading } = useCorrections()
    const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null)
    const { data: selectedEmailDetails } = useEmailDetails(selectedDecisionId)

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-2">
                    Email Filing Learning Opportunity
                </h1>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-10">
                    Review instances where human feedback corrected the AI model.
                </p>

                {isLoading ? (
                    <div className="space-y-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-white dark:bg-gray-800 rounded-2xl animate-pulse shadow-lg" />
                        ))}
                    </div>
                ) : (
                    <div>
                        {corrections && corrections.length > 0 ? (
                            corrections.map((c) => (
                                <CorrectionCard
                                    key={c.id}
                                    correction={c}
                                    onClick={() => setSelectedDecisionId(c.original_decision_id)}
                                />
                            ))
                        ) : (
                            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 shadow-lg">
                                <BrainCircuit className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-gray-900 dark:text-white">No Corrections Yet</h3>
                                <p className="text-gray-500 mt-2">The AI model is running smoothly without manual interventions.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Decision Details Modal */}
                <DecisionDetailsModal
                    decision={selectedEmailDetails || null}
                    open={!!selectedDecisionId}
                    onClose={() => setSelectedDecisionId(null)}
                />
            </div>
        </div>
    )
}
