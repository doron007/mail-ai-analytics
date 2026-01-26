import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

type AnalyticsRow = Database['public']['Tables']['email_analytics']['Row']

export async function GET(request: Request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '24h'

  const getStartDate = () => {
    const now = new Date()
    switch (range) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
  }

  try {
    const startDate = getStartDate()

    // Get analytics data
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('email_analytics')
      .select('*')
      .gte('timestamp', startDate.toISOString())

    if (analyticsError) throw analyticsError

    const analytics = (analyticsData || []) as AnalyticsRow[]

    // Calculate stats
    const emailsProcessed = analytics.filter(
      (a) => a.operation_type === 'triage'
    ).length

    const draftsCreated = analytics.filter(
      (a) => a.operation_type === 'reply_draft'
    ).length

    const totalCost = analytics.reduce(
      (sum, a) => sum + (a.estimated_cost_usd || 0),
      0
    )

    const successCount = analytics.filter((a) => a.status === 'success').length
    const successRate = analytics.length
      ? (successCount / analytics.length) * 100
      : 100

    const avgProcessingTime = analytics.length
      ? analytics.reduce((sum, a) => sum + (a.duration_ms || 0), 0) / analytics.length
      : 0

    const totalTokens = analytics.reduce(
      (sum, a) => sum + (a.total_tokens || 0),
      0
    )

    const errors = analytics.filter((a) => a.status === 'error').length

    // Get corrections count
    const { count: corrections } = await supabase
      .from('email_corrections')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    return NextResponse.json({
      emailsProcessed,
      draftsCreated,
      totalCost,
      successRate,
      avgProcessingTime,
      totalTokens,
      corrections: corrections || 0,
      errors,
      range,
    })
  } catch (error) {
    console.error('Analytics summary error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics summary' },
      { status: 500 }
    )
  }
}
