import { BaseService } from './base.service'
import { supabase } from '@/lib/supabase'

export interface SystemConfig {
    id: string
    key: string
    value: string
    type: string
    description?: string
    updated_at: string
}

interface ConfigRow {
    id: string
    config_key: string
    config_value: string
    config_type: string
    description: string | null
    updated_at: string
}

export class SettingsService extends BaseService {
    async getConfig(): Promise<SystemConfig[]> {
        // Use untyped client to avoid type inference issues
        const { data, error } = await (supabase as any)
            .from('email_system_config')
            .select('id, config_key, config_value, config_type, description, updated_at')
            .order('config_key')

        if (error) throw error

        // Map database columns to our interface
        return (data as ConfigRow[]).map(row => ({
            id: row.id,
            key: row.config_key,
            value: row.config_value,
            type: row.config_type,
            description: row.description || undefined,
            updated_at: row.updated_at
        }))
    }

    async updateConfig(key: string, value: string) {
        const { error } = await (supabase as any)
            .from('email_system_config')
            .update({ config_value: value, updated_at: new Date().toISOString() })
            .eq('config_key', key)

        if (error) throw error
    }
}

export const settingsService = new SettingsService()
