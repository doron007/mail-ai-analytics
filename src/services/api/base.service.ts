import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { supabase } from '@/lib/supabase'

export class BaseService {
    protected supabase: SupabaseClient<Database>

    constructor(client: SupabaseClient<Database> = supabase) {
        this.supabase = client
    }
}
