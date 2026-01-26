'use client'

import { useQuery } from '@tanstack/react-query'
import { decisionsService, DecisionWithCorrections } from '@/services/api/decisions.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/utils'
import { ArrowRight, Bot, FolderInput, BrainCircuit, Clock, Mail, Tag } from 'lucide-react'
import { useParams } from 'next/navigation'

function useDecision(id: string) {
    return useQuery({
        queryKey: ['decision', id],
        queryFn: () => decisionsService.getDecisionById(id),
    })
}

export default function DecisionDetailsPage() {
    const params = useParams()
    const id = params.id as string
    const { data: decision, isLoading, error } = useDecision(id)

    if (isLoading) return <div className="p-8 text-center">Loading decision details...</div>
    if (error) return <div className="p-8 text-center text-red-500">Error loading decision</div>
    if (!decision) return <div className="p-8 text-center">Decision not found</div>

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {decision.subject || '(No Subject)'}
                </h1>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span>{decision.sender_email}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(decision.created_at)}</span>
                </div>
            </div>

            {/* Decision Flow Visualization */}
            <Card className="border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40">
                <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
                    <CardTitle className="text-base font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <BrainCircuit className="h-5 w-5 text-blue-500" />
                        AI Decision Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-[2.5rem] left-0 w-full h-0.5 bg-gray-100 dark:bg-gray-800 -z-10" />

                        {/* Step 1: Classification */}
                        <div className="relative group">
                            <div className="h-20 w-full bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 flex flex-col items-center justify-center mb-4 transition-all group-hover:shadow-md">
                                <Tag className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-1" />
                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Classification</span>
                            </div>
                            <div className="text-center px-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{decision.ai_category || 'Uncategorized'}</p>
                                <p className="text-xs text-gray-500 mt-1">Urgency: {decision.ai_urgency || 'Normal'}</p>
                            </div>
                        </div>

                        {/* Step 2: Action */}
                        <div className="relative group">
                            <div className="h-20 w-full bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20 flex flex-col items-center justify-center mb-4 transition-all group-hover:shadow-md">
                                <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-1" />
                                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">AI Action</span>
                            </div>
                            <div className="text-center px-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{decision.ai_action || 'Processed'}</p>
                                <p className="text-xs text-gray-500 mt-1">Confidence: {(decision.ai_confidence * 100).toFixed(0)}%</p>
                            </div>
                        </div>

                        {/* Step 3: Outcome */}
                        <div className="relative group">
                            <div className={`h-20 w-full rounded-xl border flex flex-col items-center justify-center mb-4 transition-all group-hover:shadow-md ${decision.was_corrected
                                    ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
                                    : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20'
                                }`}>
                                <FolderInput className={`h-6 w-6 mb-1 ${decision.was_corrected ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                                    }`} />
                                <span className={`text-xs font-semibold ${decision.was_corrected ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'
                                    }`}>Destination</span>
                            </div>
                            <div className="text-center px-2">
                                <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{decision.final_folder_path || '/Inbox'}</p>
                                {decision.was_corrected && (
                                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                                        Manual Override
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Raw Data Viewer */}
            <Card className="border-gray-100 dark:border-gray-800">
                <CardHeader>
                    <CardTitle className="text-base font-medium">Raw Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-slate-950 text-slate-300 p-4 rounded-lg overflow-auto font-mono text-xs max-h-[400px]">
                        <pre>{JSON.stringify(decision, null, 2)}</pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
