import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from('email_system_config')
      .select('*')
      .order('config_key')

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const updates = body.updates as { key: string; value: string }[]

    for (const update of updates) {
      // eslint-disable-next-line
      const { error } = await (supabase as any)
        .from('email_system_config')
        .update({
          config_value: update.value,
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', update.key)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
