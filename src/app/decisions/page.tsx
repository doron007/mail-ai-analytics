'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime, truncate } from '@/lib/utils'
import { useState } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  ExternalLink,
} from 'lucide-react'
import type { Database } from '@/types/database'

type EmailDecision = Database['public']['Tables']['email_decisions']['Row']

export default function DecisionsPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [correctedFilter, setCorrectedFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const pageSize = 20

  const { data, isLoading } = useQuery({
    queryKey: ['decisions', search, actionFilter, correctedFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('email_decisions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (search) {
        query = query.or(`subject.ilike.%${search}%,sender_email.ilike.%${search}%`)
      }

      if (actionFilter) {
        query = query.eq('ai_action', actionFilter)
      }

      if (correctedFilter === 'yes') {
        query = query.eq('was_corrected', true)
      } else if (correctedFilter === 'no') {
        query = query.eq('was_corrected', false)
      }

      const { data, count, error } = await query

      if (error) throw error
      return { decisions: (data || []) as EmailDecision[], total: count || 0 }
    },
  })

  const totalPages = Math.ceil((data?.total || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Decisions Log
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Audit trail of all AI email decisions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by subject or sender..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Action Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pl-10 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="action_required">Action Required</option>
            <option value="draft_reply">Draft Reply</option>
            <option value="file_only">File Only</option>
          </select>
        </div>

        {/* Corrected Filter */}
        <select
          value={correctedFilter}
          onChange={(e) => setCorrectedFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer"
        >
          <option value="">All</option>
          <option value="yes">Corrected</option>
          <option value="no">Not Corrected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                    <th className="px-4 py-3 w-8"></th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Sender</th>
                    <th className="px-4 py-3">AI Action</th>
                    <th className="px-4 py-3">Folder</th>
                    <th className="px-4 py-3">Corrected</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.decisions.map((decision) => (
                    <>
                      <tr
                        key={decision.id}
                        onClick={() =>
                          setExpandedId(
                            expandedId === decision.id ? null : decision.id
                          )
                        }
                        className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          {expandedId === decision.id ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatRelativeTime(decision.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs">
                          {truncate(decision.subject || '(No subject)', 50)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {decision.sender_email}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              decision.ai_action === 'action_required'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                : decision.ai_action === 'draft_reply'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {decision.ai_action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {decision.final_folder_path?.split('/').pop() || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {decision.was_corrected ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <Check className="h-4 w-4" />
                              <span className="text-xs">Yes</span>
                            </span>
                          ) : (
                            <X className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                          )}
                        </td>
                      </tr>
                      {expandedId === decision.id && (
                        <tr className="bg-gray-50 dark:bg-gray-900">
                          <td colSpan={7} className="px-4 py-4">
                            <ExpandedDecision decision={decision} />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {page * pageSize + 1} -{' '}
                {Math.min((page + 1) * pageSize, data?.total || 0)} of{' '}
                {data?.total || 0}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ExpandedDecision({ decision }: { decision: EmailDecision }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
          Category
        </p>
        <p className="text-gray-900 dark:text-white">{decision.ai_category || '—'}</p>
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
          Urgency
        </p>
        <p className="text-gray-900 dark:text-white">{decision.ai_urgency || '—'}</p>
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
          Assignee
        </p>
        <p className="text-gray-900 dark:text-white">{decision.ai_assignee || '—'}</p>
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
          Should Reply
        </p>
        <p className="text-gray-900 dark:text-white">
          {decision.ai_should_reply === true
            ? 'Yes'
            : decision.ai_should_reply === false
            ? 'No'
            : '—'}
        </p>
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
          AI Folder
        </p>
        <p className="text-gray-900 dark:text-white">{decision.ai_folder_path || '—'}</p>
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
          Final Folder
        </p>
        <p className="text-gray-900 dark:text-white">
          {decision.final_folder_path || '—'}
        </p>
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
          Skip Reason
        </p>
        <p className="text-gray-900 dark:text-white">
          {decision.ai_reply_skip_reason || '—'}
        </p>
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
          Message ID
        </p>
        <p className="text-gray-900 dark:text-white font-mono text-xs truncate">
          {decision.outlook_message_id || '—'}
        </p>
      </div>
    </div>
  )
}
