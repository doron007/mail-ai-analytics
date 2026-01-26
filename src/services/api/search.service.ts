import { BaseService } from './base.service'

// Email-centric search result (one per email)
export interface EmailSearchResult {
    id: string
    outlook_message_id: string | null
    subject: string | null
    sender_email: string | null
    received_at: string | null
    created_at: string
    ai_category: string | null
    ai_urgency: string | null
    ai_action: string | null
    ai_folder_path: string | null
    ai_confidence: number | null
    was_corrected: boolean
}

// Detailed email info with analytics
export interface EmailDecisionDetails {
    // Core email info
    id: string
    outlook_message_id: string | null
    subject: string | null
    sender_email: string | null
    sender_name: string | null
    received_at: string | null
    created_at: string
    // AI Decision
    ai_category: string | null
    ai_urgency: string | null
    ai_action: string | null
    ai_folder_path: string | null
    ai_confidence: number | null
    ai_summary: string | null
    ai_assignee: string | null
    ai_should_reply: boolean | null
    ai_reply_skip_reason: string | null
    // Final outcome
    final_folder_path: string | null
    final_action: string | null
    was_corrected: boolean
    // Aggregated analytics
    total_tokens: number
    total_duration_ms: number
    workflow_steps: WorkflowStep[]
}

export interface WorkflowStep {
    id: string
    timestamp: string
    workflow_name: string
    operation_type: string | null
    status: string
    total_tokens: number | null
    duration_ms: number | null
    model_used: string | null
}

export type SearchFilters = {
    query?: string
    status?: string
    date?: string
}

export interface PaginatedEmailsResult {
    emails: EmailSearchResult[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

export class SearchService extends BaseService {
    async getRecentEmails(page = 1, pageSize = 10): Promise<PaginatedEmailsResult> {
        const offset = (page - 1) * pageSize

        // Get total count
        const { count } = await this.supabase
            .from('email_decisions')
            .select('*', { count: 'exact', head: true })

        // Get paginated data
        const { data, error } = await this.supabase
            .from('email_decisions')
            .select(`
                id,
                outlook_message_id,
                subject,
                sender_email,
                received_at,
                created_at,
                ai_category,
                ai_urgency,
                ai_action,
                ai_folder_path,
                ai_confidence,
                was_corrected
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1)

        if (error) throw error

        const total = count || 0
        return {
            emails: data as EmailSearchResult[],
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        }
    }

    async search(filters: SearchFilters): Promise<EmailSearchResult[]> {
        let query = this.supabase
            .from('email_decisions')
            .select(`
                id,
                outlook_message_id,
                subject,
                sender_email,
                received_at,
                created_at,
                ai_category,
                ai_urgency,
                ai_action,
                ai_folder_path,
                ai_confidence,
                was_corrected
            `)
            .order('created_at', { ascending: false })
            .limit(50)

        // Text Search (Subject or Sender or ID)
        if (filters.query) {
            query = query.or(`subject.ilike.%${filters.query}%,sender_email.ilike.%${filters.query}%,id.eq.${filters.query}`)
        }

        // Date Filter (Specific Day in PST)
        if (filters.date) {
            const [year, month, day] = filters.date.split('-').map(Number)
            // PST is UTC-8, so midnight PST = 08:00 UTC
            const PST_OFFSET_HOURS = 8
            const startDate = new Date(Date.UTC(year, month - 1, day, PST_OFFSET_HOURS))
            const nextDate = new Date(Date.UTC(year, month - 1, day + 1, PST_OFFSET_HOURS))

            if (!isNaN(startDate.getTime())) {
                query = query
                    .gte('created_at', startDate.toISOString())
                    .lt('created_at', nextDate.toISOString())
            }
        }

        const { data, error } = await query
        if (error) throw error
        return data as EmailSearchResult[]
    }

    async getEmailDetails(decisionId: string): Promise<EmailDecisionDetails | null> {
        // Define the type for the decision query result
        type DecisionRow = {
            id: string
            outlook_message_id: string | null
            subject: string | null
            sender_email: string | null
            sender_name: string | null
            received_at: string | null
            created_at: string
            ai_category: string | null
            ai_urgency: string | null
            ai_action: string | null
            ai_folder_path: string | null
            ai_confidence: number | null
            ai_summary: string | null
            ai_assignee: string | null
            ai_should_reply: boolean | null
            ai_reply_skip_reason: string | null
            final_folder_path: string | null
            final_action: string | null
            was_corrected: boolean
        }

        // Fetch the email decision
        const { data: decision, error: decisionError } = await this.supabase
            .from('email_decisions')
            .select(`
                id,
                outlook_message_id,
                subject,
                sender_email,
                sender_name,
                received_at,
                created_at,
                ai_category,
                ai_urgency,
                ai_action,
                ai_folder_path,
                ai_confidence,
                ai_summary,
                ai_assignee,
                ai_should_reply,
                ai_reply_skip_reason,
                final_folder_path,
                final_action,
                was_corrected
            `)
            .eq('id', decisionId)
            .single()

        if (decisionError || !decision) return null

        const typedDecision = decision as DecisionRow

        // Fetch related analytics/workflow steps
        let workflowSteps: WorkflowStep[] = []
        let totalTokens = 0
        let totalDuration = 0

        if (typedDecision.outlook_message_id) {
            type AnalyticsRow = {
                id: string
                timestamp: string
                workflow_name: string
                operation_type: string | null
                status: string
                total_tokens: number | null
                duration_ms: number | null
                model_used: string | null
            }

            const { data: analytics } = await this.supabase
                .from('email_analytics')
                .select(`
                    id,
                    timestamp,
                    workflow_name,
                    operation_type,
                    status,
                    total_tokens,
                    duration_ms,
                    model_used
                `)
                .eq('outlook_message_id', typedDecision.outlook_message_id)
                .order('timestamp', { ascending: true })

            if (analytics) {
                const typedAnalytics = analytics as AnalyticsRow[]
                workflowSteps = typedAnalytics.map(a => ({
                    id: a.id,
                    timestamp: a.timestamp,
                    workflow_name: a.workflow_name,
                    operation_type: a.operation_type,
                    status: a.status,
                    total_tokens: a.total_tokens,
                    duration_ms: a.duration_ms,
                    model_used: a.model_used
                }))

                totalTokens = typedAnalytics.reduce((sum, a) => sum + (a.total_tokens || 0), 0)
                totalDuration = typedAnalytics.reduce((sum, a) => sum + (a.duration_ms || 0), 0)
            }
        }

        return {
            ...typedDecision,
            total_tokens: totalTokens,
            total_duration_ms: totalDuration,
            workflow_steps: workflowSteps
        }
    }
}

export const searchService = new SearchService()
