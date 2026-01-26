'use client'

import { useDataStats } from '@/hooks/useData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, AlertTriangle, RefreshCw } from 'lucide-react'

export default function DataPage() {
    const { data: stats, isLoading } = useDataStats()



    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading storage stats...</div>
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Management</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage database storage and maintenance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Analytics Rows</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.analytics_count.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recorded Decisions</CardTitle>
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.decisions_count.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-300">Test / Backfill Data</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{stats?.test_rows_count.toLocaleString()}</div>
                        <p className="text-xs text-orange-600/80 mt-1">Candidates for deletion</p>
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}
