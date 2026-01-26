import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from('email_decisions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Decision fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch decision' },
      { status: 500 }
    )
  }
}
