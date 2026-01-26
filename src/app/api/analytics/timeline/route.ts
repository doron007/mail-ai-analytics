import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

type TimelineRow = {
  timestamp: string
  operation_type: string | null
  status: 'success' | 'error' | 'skipped' | 'retry'
}

export async function GET(request: Request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '7d'

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
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  try {
    const startDate = getStartDate()

    const { data, error } = await supabase
      .from('email_analytics')
      .select('timestamp, operation_type, status')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true })

    if (error) throw error

    const rows = (data || []) as TimelineRow[]

    // Group by time period
    const grouped: Record<string, { total: number; success: number; error: number }> = {}

    rows.forEach((item) => {
      const date = new Date(item.timestamp)
      const key =
        range === '24h'
          ? `${date.getHours().toString().padStart(2, '0')}:00`
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      if (!grouped[key]) {
        grouped[key] = { total: 0, success: 0, error: 0 }
      }
      grouped[key].total++
      if (item.status === 'success') grouped[key].success++
      if (item.status === 'error') grouped[key].error++
    })

    const timeline = Object.entries(grouped).map(([time, counts]) => ({
      time,
      ...counts,
    }))

    return NextResponse.json(timeline)
  } catch (error) {
    console.error('Analytics timeline error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics timeline' },
      { status: 500 }
    )
  }
}
