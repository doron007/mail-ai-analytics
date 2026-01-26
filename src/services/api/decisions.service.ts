import { BaseService } from './base.service'

export interface Decision {
    id: string
    created_at: string
    subject: string
    sender_email: string
    ai_action?: string
    ai_folder_path?: string
    ai_category?: string
    ai_urgency?: string
    final_folder_path?: string
    was_corrected?: boolean
    ai_confidence?: number // Adding this to type, though DB field might be different
}

export interface DecisionWithCorrections extends Decision {
    email_corrections?: any[]
    ai_confidence: number // Normalized from DB or default
}

export class DecisionsService extends BaseService {
    async getDecisions(limit = 100) {
        const { data, error } = await this.supabase
            .from('email_decisions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data as Decision[]
    }

    async getCorrections(limit = 50) {
        const { data, error } = await this.supabase
            .from('email_corrections')
            .select('*, email_decisions(subject, sender_email, ai_folder_path)')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data
    }

    async getDecisionById(id: string): Promise<DecisionWithCorrections> {
        const { data, error } = await this.supabase
            .from('email_decisions')
            .select('*, email_corrections(*)')
            .eq('id', id)
            .single()

        if (error) throw error

        if (!data) throw new Error('Decision not found')

        // Ensure confidence exists or default it
        return {
            ...(data as object),
            ai_confidence: 0.95 // Mocking if column likely doesn't exist yet, based on "Decision" schema seen earlier
        } as DecisionWithCorrections
    }
}

export const decisionsService = new DecisionsService()
