import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { 
  Zap, 
  Layers, 
  BarChart3, 
  Wallet, 
  FileText,
  HelpCircle,
  LogOut
} from 'lucide-react'

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-sidebar min-h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <Button className="w-full gap-2" size="sm">
          <Plus className="w-4 h-4" />
          New Workflow
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Workflows
          </h3>
          <div className="space-y-1">
            <NavItem icon={<Zap className="w-4 h-4" />} label="Daily Rewards" active />
            <NavItem icon={<Layers className="w-4 h-4" />} label="Subscription Payouts" />
            <NavItem icon={<Wallet className="w-4 h-4" />} label="Treasury Sweep" />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Monitoring
          </h3>
          <div className="space-y-1">
            <NavItem icon={<BarChart3 className="w-4 h-4" />} label="Analytics" />
            <NavItem icon={<FileText className="w-4 h-4" />} label="Audit Logs" />
            <NavItem icon={<Wallet className="w-4 h-4" />} label="Transactions" />
          </div>
        </div>
      </nav>

      <div className="border-t border-border p-4 space-y-2">
        <NavItem icon={<HelpCircle className="w-4 h-4" />} label="Documentation" />
        <NavItem icon={<LogOut className="w-4 h-4" />} label="Disconnect Wallet" />
      </div>
    </aside>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
}

function NavItem({ icon, label, active }: NavItemProps) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
      active 
        ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
    }`}>
      {icon}
      {label}
    </button>
  )
}
