'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService, SystemConfig } from '@/services/api/settings.service'
import { openRouterService, OpenRouterModel } from '@/services/api/openrouter.service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useState, useEffect, useRef } from 'react'
import { Save, Check, Hash, Type, Braces, AlertCircle, Loader2, X, ChevronDown } from 'lucide-react'

function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getConfig(),
  })
}

function useOpenRouterModels() {
  return useQuery({
    queryKey: ['openrouter-models'],
    queryFn: () => openRouterService.getModels(),
    staleTime: 5 * 60 * 1000,
  })
}

function useUpdateSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string, value: string }) => settingsService.updateConfig(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  })
}

const typeIcons: Record<string, React.ReactNode> = {
  'string': <Type className="h-3 w-3" />,
  'number': <Hash className="h-3 w-3" />,
  'json': <Braces className="h-3 w-3" />,
}

const typeColors: Record<string, string> = {
  'string': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'number': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'json': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

interface ModelSelectorProps {
  value: string
  onChange: (value: string) => void
  models: OpenRouterModel[]
  isLoading: boolean
}

function ModelSelector({ value, onChange, models, isLoading }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredModels = models.filter(m =>
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    m.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 15)

  const isValidModel = models.some(m => m.id === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className={`w-full px-3 py-1.5 pr-8 text-sm rounded border font-mono ${
            value && !isValidModel && !isLoading
              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950'
          }`}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            setSearch(value)
            setIsOpen(true)
          }}
          placeholder="Select or type model ID..."
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Validation indicator */}
      {value && !isLoading && (
        <div className={`absolute -right-6 top-1/2 -translate-y-1/2 ${isValidModel ? 'text-green-500' : 'text-red-500'}`}>
          {isValidModel ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !isLoading && filteredModels.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredModels.map((model) => (
            <button
              key={model.id}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0"
              onClick={() => {
                onChange(model.id)
                setIsOpen(false)
              }}
            >
              <div className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">
                {model.id}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {model.name} • {(model.context_length / 1000).toFixed(0)}k ctx
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Validation error message */}
      {value && !isValidModel && !isLoading && (
        <p className="absolute text-xs text-red-500 mt-1">
          Model not found in OpenRouter
        </p>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { data: config, isLoading } = useSettings()
  const { data: models = [], isLoading: modelsLoading } = useOpenRouterModels()
  const updateMutation = useUpdateSetting()
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [savingAll, setSavingAll] = useState(false)

  const hasUnsavedChanges = Object.keys(editing).length > 0
  const unsavedCount = Object.keys(editing).length

  const isModelField = (key: string) => key.toLowerCase().includes('model')

  const validateModelField = async (key: string, value: string): Promise<boolean> => {
    if (!isModelField(key)) return true

    const result = await openRouterService.validateModel(value)
    if (!result.valid) {
      setValidationErrors(prev => ({
        ...prev,
        [key]: result.suggestion || 'Invalid model ID'
      }))
      return false
    }
    setValidationErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    return true
  }

  const handleSave = async (key: string) => {
    if (editing[key] === undefined) return

    // Validate model fields
    if (isModelField(key)) {
      const isValid = await validateModelField(key, editing[key])
      if (!isValid) return
    }

    await updateMutation.mutateAsync({ key, value: editing[key] })
    const newEditing = { ...editing }
    delete newEditing[key]
    setEditing(newEditing)
    setSaved(prev => ({ ...prev, [key]: true }))
    setTimeout(() => setSaved(prev => ({ ...prev, [key]: false })), 2000)
  }

  const handleSaveAll = async () => {
    setSavingAll(true)
    const keys = Object.keys(editing)

    // Validate all model fields first
    let hasErrors = false
    for (const key of keys) {
      if (isModelField(key)) {
        const isValid = await validateModelField(key, editing[key])
        if (!isValid) hasErrors = true
      }
    }

    if (hasErrors) {
      setSavingAll(false)
      return
    }

    // Save all changes
    try {
      for (const key of keys) {
        await updateMutation.mutateAsync({ key, value: editing[key] })
      }
      setEditing({})
      setSaved(keys.reduce((acc, key) => ({ ...acc, [key]: true }), {}))
      setTimeout(() => setSaved({}), 2000)
    } finally {
      setSavingAll(false)
    }
  }

  const handleDiscardAll = () => {
    setEditing({})
    setValidationErrors({})
  }

  const handleChange = (key: string, val: string) => {
    setEditing(prev => ({ ...prev, [key]: val }))
    // Clear validation error when user types
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const handleRevert = (key: string, originalValue: string) => {
    const newEditing = { ...editing }
    delete newEditing[key]
    setEditing(newEditing)
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const groupConfigs = (configs: SystemConfig[]) => {
    const groups: Record<string, SystemConfig[]> = {
      'Models': [],
      'Thresholds': [],
      'Integrations': [],
      'Other': []
    }

    configs.forEach(item => {
      if (item.key.includes('model')) {
        groups['Models'].push(item)
      } else if (item.key.includes('threshold') || item.key.includes('interval')) {
        groups['Thresholds'].push(item)
      } else if (item.key.includes('email') || item.key.includes('teams') || item.key.includes('todo') || item.key.includes('freshdesk') || item.key.includes('inbox') || item.key.includes('user_id')) {
        groups['Integrations'].push(item)
      } else {
        groups['Other'].push(item)
      }
    })

    return groups
  }

  const groupedConfig = config ? groupConfigs(config) : {}

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Configuration</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage global parameters for the AI email processing system.</p>
        </div>

        {/* Save All / Discard buttons */}
        {hasUnsavedChanges && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-600 dark:text-amber-400">
              {unsavedCount} unsaved change{unsavedCount > 1 ? 's' : ''}
            </span>
            <button
              onClick={handleDiscardAll}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Discard
            </button>
            <button
              onClick={handleSaveAll}
              disabled={savingAll || Object.keys(validationErrors).length > 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save All Changes
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        Object.entries(groupedConfig).map(([group, items]) => items.length > 0 && (
          <Card key={group}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{group}</CardTitle>
              <CardDescription>
                {group === 'Models' && 'AI models used for different processing stages (validated against OpenRouter)'}
                {group === 'Thresholds' && 'Similarity thresholds and timing parameters'}
                {group === 'Integrations' && 'External service IDs and endpoints'}
                {group === 'Other' && 'Additional configuration options'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => {
                const isEdited = editing[item.key] !== undefined
                const currentValue = isEdited ? editing[item.key] : item.value
                const hasError = validationErrors[item.key]

                return (
                  <div
                    key={item.key}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-lg transition-colors ${
                      isEdited
                        ? hasError
                          ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                          : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                        : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {item.key}
                        </code>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${typeColors[item.type] || 'bg-gray-100 text-gray-600'}`}>
                          {typeIcons[item.type]}
                          {item.type}
                        </span>
                        {isEdited && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Modified
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                      )}
                      {hasError && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {hasError}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 sm:w-96 items-start">
                      {isModelField(item.key) ? (
                        <ModelSelector
                          value={currentValue}
                          onChange={(val) => handleChange(item.key, val)}
                          models={models}
                          isLoading={modelsLoading}
                        />
                      ) : item.type === 'json' ? (
                        <textarea
                          rows={2}
                          className="flex-1 px-3 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 font-mono resize-none"
                          value={currentValue}
                          onChange={(e) => handleChange(item.key, e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          className="flex-1 px-3 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 font-mono"
                          value={currentValue}
                          onChange={(e) => handleChange(item.key, e.target.value)}
                        />
                      )}
                      {isEdited && (
                        <>
                          <button
                            onClick={() => handleRevert(item.key, item.value)}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded transition-colors"
                            title="Revert"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleSave(item.key)}
                            disabled={updateMutation.isPending || !!hasError}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                            title="Save"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {saved[item.key] && (
                        <span className="p-2 text-green-600">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))
      )}

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900 p-4 rounded-lg text-sm text-amber-800 dark:text-amber-300">
        <strong>Note:</strong> Changes take effect immediately for new email processing jobs. Model names are validated against OpenRouter to prevent typos.
      </div>
    </div>
  )
}
