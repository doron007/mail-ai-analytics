import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

type AnalyticsRow = {
  model_used: string | null
  estimated_cost_usd: number | null
  input_tokens: number | null
  output_tokens: number | null
  operation_type: string | null
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
      .select('model_used, estimated_cost_usd, input_tokens, output_tokens, operation_type')
      .gte('timestamp', startDate.toISOString())

    if (error) throw error

    const rows = (data || []) as AnalyticsRow[]

    // Group by model
    const byModel: Record<
      string,
      { cost: number; inputTokens: number; outputTokens: number; count: number }
    > = {}

    rows.forEach((item) => {
      const model = item.model_used || 'unknown'
      if (!byModel[model]) {
        byModel[model] = { cost: 0, inputTokens: 0, outputTokens: 0, count: 0 }
      }
      byModel[model].cost += item.estimated_cost_usd || 0
      byModel[model].inputTokens += item.input_tokens || 0
      byModel[model].outputTokens += item.output_tokens || 0
      byModel[model].count++
    })

    // Group by operation
    const byOperation: Record<string, { cost: number; count: number }> = {}

    rows.forEach((item) => {
      const op = item.operation_type || 'unknown'
      if (!byOperation[op]) {
        byOperation[op] = { cost: 0, count: 0 }
      }
      byOperation[op].cost += item.estimated_cost_usd || 0
      byOperation[op].count++
    })

    return NextResponse.json({
      byModel: Object.entries(byModel).map(([model, data]) => ({
        model,
        ...data,
      })),
      byOperation: Object.entries(byOperation).map(([operation, data]) => ({
        operation,
        ...data,
      })),
      totalCost: rows.reduce((sum, a) => sum + (a.estimated_cost_usd || 0), 0),
      totalTokens: rows.reduce(
        (sum, a) => sum + (a.input_tokens || 0) + (a.output_tokens || 0),
        0
      ),
    })
  } catch (error) {
    console.error('Analytics costs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cost breakdown' },
      { status: 500 }
    )
  }
}
