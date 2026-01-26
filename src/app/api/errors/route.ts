import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

type ErrorRow = {
  error_code: string | null
  error_message: string | null
}

type TimelineRow = {
  timestamp: string
}

export async function GET(request: Request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '0')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const search = searchParams.get('search') || ''

  try {
    let query = supabase
      .from('email_analytics')
      .select('*', { count: 'exact' })
      .eq('status', 'error')
      .order('timestamp', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (search) {
      query = query.or(
        `error_message.ilike.%${search}%,workflow_name.ilike.%${search}%,node_name.ilike.%${search}%`
      )
    }

    const { data, count, error } = await query

    if (error) throw error

    // Get error patterns
    const { data: allErrorsData } = await supabase
      .from('email_analytics')
      .select('error_code, error_message')
      .eq('status', 'error')

    const allErrors = (allErrorsData || []) as ErrorRow[]

    const patterns: Record<string, number> = {}
    allErrors.forEach((item) => {
      const key =
        item.error_code || item.error_message?.substring(0, 50) || 'Unknown'
      patterns[key] = (patterns[key] || 0) + 1
    })

    const sortedPatterns = Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }))

    // Get error timeline (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: timelineDataRaw } = await supabase
      .from('email_analytics')
      .select('timestamp')
      .eq('status', 'error')
      .gte('timestamp', sevenDaysAgo.toISOString())

    const timelineData = (timelineDataRaw || []) as TimelineRow[]

    const byDay: Record<string, number> = {}
    timelineData.forEach((item) => {
      const day = new Date(item.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      byDay[day] = (byDay[day] || 0) + 1
    })

    const timeline = Object.entries(byDay).map(([date, count]) => ({
      date,
      count,
    }))

    return NextResponse.json({
      errors: data || [],
      total: count || 0,
      patterns: sortedPatterns,
      timeline,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Errors fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch errors' },
      { status: 500 }
    )
  }
}
