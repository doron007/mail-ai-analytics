export interface OpenRouterModel {
    id: string
    name: string
    description?: string
    context_length: number
    pricing: {
        prompt: string
        completion: string
    }
}

interface OpenRouterModelsResponse {
    data: OpenRouterModel[]
}

class OpenRouterService {
    private modelsCache: OpenRouterModel[] | null = null
    private cacheTimestamp: number = 0
    private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

    async getModels(): Promise<OpenRouterModel[]> {
        // Return cached if valid
        if (this.modelsCache && Date.now() - this.cacheTimestamp < this.CACHE_TTL_MS) {
            return this.modelsCache
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/models')
            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status}`)
            }
            const data: OpenRouterModelsResponse = await response.json()
            this.modelsCache = data.data
            this.cacheTimestamp = Date.now()
            return this.modelsCache
        } catch (error) {
            console.error('Failed to fetch OpenRouter models:', error)
            // Return cached data if available, even if stale
            if (this.modelsCache) {
                return this.modelsCache
            }
            throw error
        }
    }

    async validateModel(modelId: string): Promise<{ valid: boolean; suggestion?: string }> {
        try {
            const models = await this.getModels()
            const exactMatch = models.find(m => m.id === modelId)

            if (exactMatch) {
                return { valid: true }
            }

            // Find similar models for suggestion
            const lowerModelId = modelId.toLowerCase()
            const similarModels = models
                .filter(m =>
                    m.id.toLowerCase().includes(lowerModelId) ||
                    lowerModelId.includes(m.id.toLowerCase().split('/').pop() || '')
                )
                .slice(0, 3)

            return {
                valid: false,
                suggestion: similarModels.length > 0
                    ? `Did you mean: ${similarModels.map(m => m.id).join(', ')}?`
                    : undefined
            }
        } catch (error) {
            // If we can't validate, allow the save but warn
            console.warn('Could not validate model:', error)
            return { valid: true }
        }
    }

    async searchModels(query: string): Promise<OpenRouterModel[]> {
        const models = await this.getModels()
        const lowerQuery = query.toLowerCase()

        return models
            .filter(m =>
                m.id.toLowerCase().includes(lowerQuery) ||
                m.name.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 20)
    }
}

export const openRouterService = new OpenRouterService()
