import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '0')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const search = searchParams.get('search') || ''
  const source = searchParams.get('source') || ''

  try {
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

    if (source) {
      query = query.eq('assignment_source', source)
    }

    const { data, count, error } = await query

    if (error) throw error

    return NextResponse.json({
      threads: data || [],
      total: count || 0,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Threads fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    )
  }
}
