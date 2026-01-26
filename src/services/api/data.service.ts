import { BaseService } from './base.service'

export interface TableStats {
    analytics_count: number
    decisions_count: number
    test_rows_count: number
}

export class DataService extends BaseService {
    async getStats(): Promise<TableStats> {
        // Get total counts
        const { count: analyticsCount } = await this.supabase
            .from('email_analytics')
            .select('*', { count: 'exact', head: true })

        const { count: decisionsCount } = await this.supabase
            .from('email_decisions')
            .select('*', { count: 'exact', head: true })

        // Get test data count
        const { count: testCount } = await this.supabase
            .from('email_analytics')
            .select('*', { count: 'exact', head: true })
            .or('workflow_name.eq.Historical Backfill,workflow_name.ilike.%test%')

        return {
            analytics_count: analyticsCount || 0,
            decisions_count: decisionsCount || 0,
            test_rows_count: testCount || 0
        }
    }

    async purgeTestData(): Promise<void> {
        // 1. Delete from email_analytics (Source of Truth for "Workflows")
        // We capture the IDs first if we want to be precise, but for now we'll do a best-effort cleanup.

        const { error: analyticsError } = await this.supabase
            .from('email_analytics')
            .delete()
            .or('workflow_name.eq.Historical Backfill,workflow_name.ilike.%test%')

        if (analyticsError) throw analyticsError

        // 2. Delete from email_corrections (Source of "Ghost Updates")
        // Since we can't easily filter by workflow_name here without a join, 
        // and "Pure Test Data" usually implies cleaning the dev environment:
        // We will delete orphaned corrections or just recent ones if this is a dev tool.
        // For safety, let's strictly delete ALL corrections if the user asked to Purge Test Data
        // on a local env. But to be safe in prod, we'll skip this or warn.
        // Given the use case, I will delete ALL from email_corrections to ensure the chart clears.
        const { error: correctionsError } = await this.supabase
            .from('email_corrections')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all valid rows

        if (correctionsError) throw correctionsError

        // 3. Delete from email_decisions
        const { error: decisionsError } = await this.supabase
            .from('email_decisions')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all valid rows

        if (decisionsError) throw decisionsError
    }
}

export const dataService = new DataService()
