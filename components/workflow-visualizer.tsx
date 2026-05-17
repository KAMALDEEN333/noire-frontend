'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Zap, DollarSign, CheckCircle2, Clock } from 'lucide-react'

interface WorkflowVisualizerProps {
  workflow: string
}

export function WorkflowVisualizer({ workflow }: WorkflowVisualizerProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Workflow Visualization</h2>
        <p className="text-sm text-muted-foreground">See your automation flow at a glance</p>
      </div>

      <div className="space-y-6">
        {/* Flow 1 */}
        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-base">Trigger: user_signup</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Event Triggered</div>
                  <div className="text-xs text-muted-foreground">user_signup</div>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

              <div className="flex-1 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Send XLM</div>
                  <div className="text-xs text-muted-foreground">5 XLM to user_wallet</div>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

              <div className="flex-1 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Settled</div>
                  <div className="text-xs text-muted-foreground">On Stellar</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flow 2 */}
        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-base">Trigger: daily (Scheduled)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Daily Timer</div>
                  <div className="text-xs text-muted-foreground">Recurring at midnight UTC</div>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

              <div className="flex-1 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Send XLM</div>
                  <div className="text-xs text-muted-foreground">1 XLM to community_pool</div>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

              <div className="flex-1 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Confirmed</div>
                  <div className="text-xs text-muted-foreground">Next execution queued</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flow 3 */}
        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-base">Condition: balance {'>'} 100</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Check Balance</div>
                  <div className="text-xs text-muted-foreground">Monitor wallet balance</div>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

              <div className="flex-1 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Send XLM</div>
                  <div className="text-xs text-muted-foreground">10 XLM to treasury_wallet</div>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

              <div className="flex-1 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Swept</div>
                  <div className="text-xs text-muted-foreground">Anchored on-chain</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/10 border border-primary/20">
        <CardContent className="pt-6">
          <div className="text-sm">
            <p className="font-semibold text-primary mb-2">Workflow Hash</p>
            <p className="font-mono text-xs text-muted-foreground break-all">
              0x7a3f8c9e2b1d4f6a5c8e9b0d2f1a3c5e7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This hash is anchored on Stellar, making every workflow configuration verifiable and tamper-proof.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
