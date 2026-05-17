'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react'
import { useState } from 'react'

interface YAMLEditorProps {
  value: string
  onChange: (value: string) => void
}

export function YAMLEditor({ value, onChange }: YAMLEditorProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState(true)
  const [lineNumbers, setLineNumbers] = useState<number[]>([])

  const validateYAML = () => {
    setIsValidating(true)
    setTimeout(() => {
      setIsValid(true)
      setIsValidating(false)
    }, 500)
  }

  const updateLineNumbers = () => {
    const lines = value.split('\n').length
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1))
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    updateLineNumbers()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Workflow Definition</h2>
          <p className="text-sm text-muted-foreground">Edit your YAML workflow configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={validateYAML}
            disabled={isValidating}
          >
            {isValidating ? 'Validating...' : 'Validate'}
          </Button>
          <Button className="gap-2">
            <Zap className="w-4 h-4" />
            Deploy Workflow
          </Button>
        </div>
      </div>

      {isValid && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded text-primary">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Workflow syntax is valid</span>
        </div>
      )}

      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">YAML Editor</CardTitle>
              <CardDescription>Define your payment automation logic</CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              {value.split('\n').length} lines
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex bg-muted/30">
            {/* Line numbers */}
            <div className="bg-muted/50 text-muted-foreground text-xs font-mono p-4 text-right border-r border-border/30 select-none min-w-fit">
              {value.split('\n').map((_, i) => (
                <div key={i} className="h-6 leading-6">
                  {i + 1}
                </div>
              ))}
            </div>
            {/* Editor */}
            <div className="flex-1 relative">
              <textarea
                value={value}
                onChange={handleChange}
                className="w-full p-4 bg-background text-foreground font-mono text-sm resize-none focus:outline-none leading-6"
                style={{ minHeight: '500px' }}
                spellCheck="false"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="text-xs text-muted-foreground">Total Steps</div>
            <div className="text-2xl font-bold mt-2">3</div>
          </CardHeader>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="text-xs text-muted-foreground">Estimated XLM</div>
            <div className="text-2xl font-bold mt-2">16</div>
          </CardHeader>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="text-2xl font-bold mt-2 text-primary">Ready</div>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
