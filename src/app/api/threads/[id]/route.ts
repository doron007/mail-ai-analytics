import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

type ThreadRow = Database['public']['Tables']['email_threads']['Row']

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  try {
    // Get the thread
    const { data: threadData, error: threadError } = await supabase
      .from('email_threads')
      .select('*')
      .eq('id', params.id)
      .single()

    if (threadError) throw threadError

    if (!threadData) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    const thread = threadData as ThreadRow

    // Get all decisions for this thread
    const { data: decisions, error: decisionsError } = await supabase
      .from('email_decisions')
      .select('*')
      .eq('conversation_id', thread.conversation_id)
      .order('created_at', { ascending: false })

    if (decisionsError) throw decisionsError

    return NextResponse.json({
      ...thread,
      decisions: decisions || [],
    })
  } catch (error) {
    console.error('Thread fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { assigned_folder_path, assigned_folder_id } = body

    // eslint-disable-next-line
    const { data, error } = await (supabase as any)
      .from('email_threads')
      .update({
        assigned_folder_path,
        assigned_folder_id,
        assignment_source: 'user_correction',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Thread update error:', error)
    return NextResponse.json(
      { error: 'Failed to update thread' },
      { status: 500 }
    )
  }
}
