'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Filter, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const logs = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 5 * 60000),
    workflow: 'Daily Rewards',
    trigger: 'user_signup',
    amount: '5.00',
    recipient: 'GDZST3XVCDTUJ76ZAV2HA72KYRF...S3V',
    status: 'success',
    txHash: '8c5e1e4e...',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 15 * 60000),
    workflow: 'Treasury Sweep',
    trigger: 'balance > 100',
    amount: '10.00',
    recipient: 'GBQQ3QGMJDAHEQ4N4XQWQQ6ZC...P3',
    status: 'success',
    txHash: '2a9f3b1c...',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 42 * 60000),
    workflow: 'Community Pool',
    trigger: 'scheduled',
    amount: '1.00',
    recipient: 'GCZXW2Z6RO7ZCWTQ3JHFQVBXGM...V5',
    status: 'success',
    txHash: '5d8c0f9e...',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 2 * 3600000),
    workflow: 'Daily Rewards',
    trigger: 'user_signup',
    amount: '5.00',
    recipient: 'GCCQZ3QSGJ5H7DQPJYZGZZDT2...X9',
    status: 'success',
    txHash: '1b4e8c2a...',
  },
]

export function ExecutionLogs() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Execution Logs</h2>
          <p className="text-sm text-muted-foreground">Real-time workflow execution history</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Executions</CardTitle>
              <CardDescription>Last 24 hours</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {logs.length} executions
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/30 bg-muted/30">
                <tr>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Timestamp</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Workflow</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Trigger</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Recipient</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 font-medium">{log.workflow}</td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="text-xs">
                        {log.trigger}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{log.amount} XLM</td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                      {log.recipient}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-primary hover:text-primary/80 cursor-pointer">
                      {log.txHash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Executed</div>
              <div className="text-2xl font-bold">4</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
              <div className="text-2xl font-bold text-green-400">100%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total XLM Sent</div>
              <div className="text-2xl font-bold">21.00</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Avg. Settlement</div>
              <div className="text-2xl font-bold">3.2s</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
