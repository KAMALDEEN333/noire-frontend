'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { YAMLEditor } from '@/components/yaml-editor'
import { WorkflowVisualizer } from '@/components/workflow-visualizer'
import { ExecutionLogs } from '@/components/execution-logs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DashboardPage() {
  const [activeView, setActiveView] = useState('editor')
  const [workflow, setWorkflow] = useState(`workflow:
  # reward new users automatically
  - event: user_signup
    action: send_xlm
    amount: 5
    to: user_wallet

  # sustain the community treasury, daily
  - event: daily
    action: send_xlm
    amount: 1
    to: community_pool

  # trigger conditional sweeps
  - condition: balance > 100
    action: send_xlm
    amount: 10
    to: treasury_wallet`)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <div className="border-b border-border">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <h1 className="text-2xl font-bold text-balance">Workflows</h1>
              <p className="text-muted-foreground mt-1">Define and manage payment automation in YAML</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Tabs defaultValue="editor" className="w-full" onValueChange={setActiveView}>
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="visualize">Visualize</TabsTrigger>
                <TabsTrigger value="logs">Execution Logs</TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="space-y-4">
                <YAMLEditor value={workflow} onChange={setWorkflow} />
              </TabsContent>
              <TabsContent value="visualize">
                <WorkflowVisualizer workflow={workflow} />
              </TabsContent>
              <TabsContent value="logs">
                <ExecutionLogs />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
