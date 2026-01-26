const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verifySearch() {
    console.log('Verifying Search Service Logic...')

    // Simulate the exact query from SearchService.search()
    // We use the same columns: id, timestamp, subject, sender_email, status, workflow_name, operation_type
    const query = supabase
        .from('email_analytics')
        .select('id, timestamp, subject, sender_email, status, workflow_name, operation_type')
        .order('timestamp', { ascending: false })
        .limit(5)

    const { data, error } = await query

    if (error) {
        console.error('❌ FAILED: Query error:', error.message)
        process.exit(1)
    }

    if (!data || data.length === 0) {
        console.warn('⚠️  WARNING: Query succeeded but returned no data.')
    } else {
        console.log('✅ SUCCESS: Query returned rows.')
        console.log('Sample Row:', data[0])

        // Check if sender_email is present
        if (data[0].sender_email !== undefined) {
            console.log('✅ Column check: sender_email exists.')
        } else {
            console.error('❌ FAILED: sender_email column likely missing or undefined.')
            process.exit(1)
        }
    }
}

verifySearch()
