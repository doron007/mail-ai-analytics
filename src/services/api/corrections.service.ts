import { BaseService } from './base.service'

export interface Correction {
    id: string
    created_at: string
    original_decision_id: string
    user_action: string
    ai_action?: string
    feedback?: string
    email_subject?: string
    learning_weight?: number
}

export class CorrectionsService extends BaseService {
    async getCorrections(limit = 50) {
        const { data, error } = await this.supabase
            .from('email_corrections')
            .select(`
                *,
                decision:email_decisions!inner (
                    subject,
                    sender_email,
                    ai_action,
                    ai_folder_path,
                    ai_category,
                    ai_urgency
                )
            `)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        // Flatten structure for the UI or keep nested
        return data.map((item: any) => ({
            id: item.id,
            created_at: item.created_at,
            original_decision_id: item.decision_id,
            user_action: `Moved to ${item.corrected_folder_path}`,
            ai_action: item.decision?.ai_action || `Proposed ${item.decision?.ai_folder_path}`,
            email_subject: item.decision?.subject, // New field for context
            learning_weight: item.learning_weight
        })) as Correction[]
    }

    async getCorrectionStats() {
        // TBD: aggregation
        return { total: 0 }
    }
}

export const correctionsService = new CorrectionsService()
