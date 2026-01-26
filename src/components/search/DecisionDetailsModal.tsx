'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EmailDecisionDetails } from '@/services/api/search.service'
import {
    Database,
    Clock,
    FolderInput,
    FolderOpen,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    Cpu,
    Brain
} from 'lucide-react'

interface DecisionDetailsModalProps {
    decision: EmailDecisionDetails | null
    open: boolean
    onClose: () => void
}

export function DecisionDetailsModal({ decision, open, onClose }: DecisionDetailsModalProps) {
    const [copied, setCopied] = useState(false)
    const [rawDataOpen, setRawDataOpen] = useState(false)

    if (!decision) return null

    const copyOutlookId = () => {
        if (decision.outlook_message_id) {
            navigator.clipboard.writeText(decision.outlook_message_id)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const confidencePercent = decision.ai_confidence
        ? `${(decision.ai_confidence * 100).toFixed(1)}%`
        : 'N/A'

    const actionLabels: Record<string, string> = {
        'file_only': 'Move to Folder',
        'action_required': 'Action Required',
        'draft_reply': 'Draft Reply',
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent onClose={onClose} className="p-0">
                {/* Header */}
                <DialogHeader className="px-8 pt-8 pb-4">
                    <p className="text-xs text-cyan-400/60 tracking-widest uppercase mb-2">Decision Details</p>
                    <DialogTitle className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        {decision.subject || '(No Subject)'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-400 mt-3">
                        <span className="text-gray-500">Sender:</span> {decision.sender_email || 'Unknown'}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-8 pb-8">
                    {/* Main Content Grid */}
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Decision Classification - Left Side */}
                        <div className="flex-1">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Decision Classification</h3>

                            {/* 2x2 Grid - No arrows since these are parallel attributes */}
                            <div className="grid grid-cols-2 gap-4">
                                <FlowCard
                                    icon={<Database className="h-5 w-5" />}
                                    label="Category"
                                    value={decision.ai_category || 'Uncategorized'}
                                    color="cyan"
                                />
                                <FlowCard
                                    icon={<Clock className="h-5 w-5" />}
                                    label="Urgency"
                                    value={decision.ai_urgency || 'Unknown'}
                                    color={decision.ai_urgency === 'High' || decision.ai_urgency === 'Critical' ? 'orange' : 'cyan'}
                                />
                                <FlowCard
                                    icon={<FolderInput className="h-5 w-5" />}
                                    label="Action"
                                    value={actionLabels[decision.ai_action || ''] || decision.ai_action || 'None'}
                                    color="cyan"
                                />
                                <FlowCard
                                    icon={<FolderOpen className="h-5 w-5" />}
                                    label="Target"
                                    value={decision.ai_folder_path || 'N/A'}
                                    color="cyan"
                                />
                            </div>
                        </div>

                        {/* Stats - Right Side */}
                        <div className="w-full lg:w-72 space-y-4">
                            {/* Outlook ID - Full width with scroll */}
                            <div className="px-4 py-4 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/80 to-slate-800/80 shadow-[0_0_20px_rgba(34,211,238,0.08)]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Outlook ID</span>
                                    <button
                                        onClick={copyOutlookId}
                                        className="p-1.5 hover:bg-cyan-500/10 rounded-lg transition-colors border border-transparent hover:border-cyan-500/20"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-cyan-400" />}
                                    </button>
                                </div>
                                <p className="text-xs font-mono text-gray-300 break-all leading-relaxed">
                                    {decision.outlook_message_id || 'N/A'}
                                </p>
                            </div>

                            {/* Tokens Used */}
                            <StatCard
                                label="Tokens Used"
                                value={decision.total_tokens.toLocaleString()}
                                icon={<Cpu className="h-5 w-5" />}
                                highlight
                            />

                            {/* Model Confidence */}
                            <StatCard
                                label="Model Confidence"
                                value={confidencePercent}
                                icon={<Brain className="h-5 w-5" />}
                                highlight
                            />
                        </div>
                    </div>

                    {/* Workflow Steps Timeline - Sequential flow with arrows */}
                    {decision.workflow_steps.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Processing Steps</h3>
                            <div className="flex flex-wrap items-center gap-2">
                                {decision.workflow_steps.map((step, index) => (
                                    <div key={step.id} className="flex items-center">
                                        <div
                                            className={`px-4 py-2.5 rounded-xl text-xs border backdrop-blur-sm ${
                                                step.status === 'success'
                                                    ? 'bg-green-950/40 border-green-700/50 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                                                    : step.status === 'error'
                                                    ? 'bg-red-950/40 border-red-700/50 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                                    : 'bg-slate-800/60 border-slate-600/50 text-gray-300'
                                            }`}
                                        >
                                            <span className="text-cyan-400 font-bold mr-2">{index + 1}.</span>
                                            <span className="font-medium">{step.operation_type || step.workflow_name}</span>
                                            {step.total_tokens ? (
                                                <span className="ml-2 text-gray-500 font-normal">({step.total_tokens.toLocaleString()} tokens)</span>
                                            ) : null}
                                        </div>
                                        {/* Arrow between steps */}
                                        {index < decision.workflow_steps.length - 1 && (
                                            <svg className="h-4 w-8 text-cyan-400/50 mx-0.5 flex-shrink-0" viewBox="0 0 32 24" fill="none">
                                                <path d="M4 12h20m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Raw Data Collapsible */}
                    <div className="mt-8 border border-gray-700/50 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setRawDataOpen(!rawDataOpen)}
                            className="w-full flex items-center justify-between px-5 py-4 bg-slate-900/60 hover:bg-slate-800/60 transition-colors"
                        >
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Raw Data</span>
                            {rawDataOpen ? (
                                <ChevronUp className="h-4 w-4 text-cyan-400" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                        </button>

                        {rawDataOpen && (
                            <div className="p-5 bg-slate-950/80 overflow-auto max-h-72 border-t border-gray-800/50">
                                <SyntaxHighlightedJson data={{
                                    email: {
                                        subject: decision.subject,
                                        sender: decision.sender_email,
                                        outlook_id: decision.outlook_message_id,
                                        received_at: decision.received_at
                                    },
                                    analysis: {
                                        category: decision.ai_category,
                                        urgency: decision.ai_urgency,
                                        action: decision.ai_action,
                                        target: decision.ai_folder_path,
                                        confidence_score: decision.ai_confidence,
                                        tokens_used: decision.total_tokens,
                                        should_reply: decision.ai_should_reply,
                                        reply_skip_reason: decision.ai_reply_skip_reason
                                    },
                                    outcome: {
                                        final_folder: decision.final_folder_path,
                                        was_corrected: decision.was_corrected
                                    }
                                }} />
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Syntax Highlighted JSON Component
function SyntaxHighlightedJson({ data }: { data: object }) {
    const jsonString = JSON.stringify(data, null, 2)
    const lines = jsonString.split('\n')

    const highlightLine = (line: string): string => {
        // Order matters - match keys first, then values
        let result = line

        // Match JSON keys (property names)
        result = result.replace(/"([^"]+)":/g, '<span class="text-cyan-400">"$1"</span>:')

        // Match string values (after colon)
        result = result.replace(/: "([^"]*)"(,?)$/g, ': <span class="text-amber-400">"$1"</span>$2')

        // Match numbers
        result = result.replace(/: (\d+\.?\d*)(,?)$/g, ': <span class="text-purple-400">$1</span>$2')

        // Match booleans
        result = result.replace(/: (true|false)(,?)$/g, ': <span class="text-green-400">$1</span>$2')

        // Match null
        result = result.replace(/: (null)(,?)$/g, ': <span class="text-gray-500">$1</span>$2')

        return result
    }

    return (
        <div className="font-mono text-sm">
            {lines.map((line, index) => (
                <div key={index} className="flex hover:bg-slate-800/50">
                    <span className="w-10 text-right pr-4 text-gray-600 select-none text-xs leading-6 flex-shrink-0">
                        {index + 1}
                    </span>
                    <span
                        className="flex-1 leading-6 text-gray-300 whitespace-pre"
                        dangerouslySetInnerHTML={{ __html: highlightLine(line) }}
                    />
                </div>
            ))}
        </div>
    )
}

// Flow Card Component with glowing borders - enhanced for mockup match
function FlowCard({ icon, label, value, color }: {
    icon: React.ReactNode
    label: string
    value: string
    color: 'cyan' | 'orange'
}) {
    const isOrange = color === 'orange'

    return (
        <div className={`
            flex-1 px-5 py-4 rounded-xl relative overflow-hidden
            border-2 ${isOrange ? 'border-orange-400/50' : 'border-cyan-400/50'}
            bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/90
            ${isOrange
                ? 'shadow-[0_0_25px_rgba(249,115,22,0.2),inset_0_1px_0_rgba(249,115,22,0.1)] hover:shadow-[0_0_35px_rgba(249,115,22,0.3)]'
                : 'shadow-[0_0_25px_rgba(34,211,238,0.2),inset_0_1px_0_rgba(34,211,238,0.1)] hover:shadow-[0_0_35px_rgba(34,211,238,0.3)]'
            }
            transition-all duration-300
        `}>
            {/* Subtle inner glow */}
            <div className={`absolute inset-0 rounded-xl ${isOrange ? 'bg-gradient-to-br from-orange-500/5 to-transparent' : 'bg-gradient-to-br from-cyan-500/5 to-transparent'}`} />

            <div className="relative flex items-center gap-2.5 mb-2">
                <div className={`p-2 rounded-lg ${isOrange ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                    {icon}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isOrange ? 'text-orange-400' : 'text-cyan-400'}`}>
                    {label}
                </span>
            </div>
            <p className="relative text-lg font-bold text-white truncate pl-0.5">{value}</p>
        </div>
    )
}

// Stat Card Component with icon on right - enhanced styling
function StatCard({ label, value, icon, highlight }: {
    label: string
    value: string
    icon: React.ReactNode
    highlight?: boolean
}) {
    return (
        <div className="px-4 py-4 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/80 to-slate-800/80 shadow-[0_0_20px_rgba(34,211,238,0.08)]">
            <div className="flex items-start justify-between">
                <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
                    <p className={`text-2xl font-bold mt-1.5 ${highlight ? 'text-white' : 'text-gray-300'}`}>
                        {value}
                    </p>
                </div>
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    {icon}
                </div>
            </div>
        </div>
    )
}
