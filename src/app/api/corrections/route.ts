import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

type CorrectionRow = {
  original_folder_path: string
  corrected_folder_path: string
}

export async function GET(request: Request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '0')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')

  try {
    const { data, count, error } = await supabase
      .from('email_corrections')
      .select(
        `
        *,
        email_decisions (
          subject,
          sender_email
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) throw error

    // Also get correction patterns
    const { data: allCorrectionsData } = await supabase
      .from('email_corrections')
      .select('original_folder_path, corrected_folder_path')

    const allCorrections = (allCorrectionsData || []) as CorrectionRow[]

    const patterns: Record<string, { count: number; to: string }> = {}
    allCorrections.forEach((c) => {
      const key = c.original_folder_path
      if (!patterns[key]) {
        patterns[key] = { count: 0, to: c.corrected_folder_path }
      }
      patterns[key].count++
    })

    const sortedPatterns = Object.entries(patterns)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([from, data]) => ({
        from: from.split('/').pop() || from,
        to: data.to.split('/').pop() || data.to,
        count: data.count,
      }))

    return NextResponse.json({
      corrections: data || [],
      total: count || 0,
      patterns: sortedPatterns,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Corrections fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch corrections' },
      { status: 500 }
    )
  }
}
