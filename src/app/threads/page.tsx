'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime, formatNumber } from '@/lib/utils'
import type { Database } from '@/types/database'
import { useState } from 'react'
import { Search, MessageSquare, FolderOpen, User, Clock } from 'lucide-react'

type ThreadRow = Database['public']['Tables']['email_threads']['Row']

export default function ThreadsPage() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const pageSize = 20

  const { data, isLoading } = useQuery({
    queryKey: ['threads', search, sourceFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('email_threads')
        .select('*', { count: 'exact' })
        .order('last_email_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (search) {
        query = query.or(
          `subject.ilike.%${search}%,first_sender_email.ilike.%${search}%`
        )
      }

      if (sourceFilter) {
        query = query.eq('assignment_source', sourceFilter)
      }

      const { data, count, error } = await query

      if (error) throw error
      return { threads: (data || []) as ThreadRow[], total: count || 0 }
    },
  })

  const totalPages = Math.ceil((data?.total || 0) / pageSize)

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ai_decision':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
      case 'user_correction':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
      case 'thread_inheritance':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
      case 'backfill':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Thread Tracker
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Email threads and their assigned folders
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

        {/* Source Filter */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer"
        >
          <option value="">All Sources</option>
          <option value="ai_decision">AI Decision</option>
          <option value="user_correction">User Correction</option>
          <option value="thread_inheritance">Inherited</option>
          <option value="backfill">Backfill</option>
        </select>
      </div>

      {/* Thread Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.threads.map((thread) => (
              <div
                key={thread.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {thread.subject || '(No subject)'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <User className="h-3 w-3" />
                      <span className="truncate">{thread.first_sender_email}</span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getSourceBadge(
                      thread.assignment_source
                    )}`}
                  >
                    {thread.assignment_source.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {thread.assigned_folder_path?.split('/').pop() || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {formatNumber(thread.email_count)} emails
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>
                    Last activity:{' '}
                    {thread.last_email_at
                      ? formatRelativeTime(thread.last_email_at)
                      : 'Unknown'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {data?.threads.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No threads found</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.total > pageSize && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {page * pageSize + 1} -{' '}
                {Math.min((page + 1) * pageSize, data.total)} of {data.total}
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
          )}
        </>
      )}
    </div>
  )
}
