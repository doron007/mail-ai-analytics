import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '0')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const search = searchParams.get('search') || ''
  const action = searchParams.get('action') || ''
  const corrected = searchParams.get('corrected') || ''

  try {
    let query = supabase
      .from('email_decisions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (search) {
      query = query.or(`subject.ilike.%${search}%,sender_email.ilike.%${search}%`)
    }

    if (action) {
      query = query.eq('ai_action', action)
    }

    if (corrected === 'yes') {
      query = query.eq('was_corrected', true)
    } else if (corrected === 'no') {
      query = query.eq('was_corrected', false)
    }

    const { data, count, error } = await query

    if (error) throw error

    return NextResponse.json({
      decisions: data || [],
      total: count || 0,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Decisions fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch decisions' },
      { status: 500 }
    )
  }
}
