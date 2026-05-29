import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, Check, Clock, AlertTriangle } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import { useToast } from '../contexts/ToastContext'
import { SettlementResponse, SettlementSuggestionResponse } from '../services/api'
import { groupService } from '../services/groupService'
import { settlementService } from '../services/settlementService'
import { colorFor, initialsFor, money } from '../utils/display'

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' as const } },
}

const statusConfig = {
  PENDING: { label: 'Pending', chip: 'chip-orange', icon: Clock },
  COMPLETED: { label: 'Settled', chip: 'chip-purple', icon: Check },
  SUGGESTED: { label: 'Suggested', chip: 'chip-emerald', icon: Zap },
  OVERDUE: { label: 'Overdue', chip: 'chip-red', icon: AlertTriangle },
}

interface SettlementItem {
  id: string
  groupId: string
  groupName: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  amount: number
  status: keyof typeof statusConfig
  originalTransactions: number
  persisted?: boolean
}

const fromSuggestion = (suggestion: SettlementSuggestionResponse, groupId: string, groupName: string): SettlementItem => ({
  id: `${groupId}-${suggestion.fromUserId}-${suggestion.toUserId}`,
  groupId,
  groupName,
  fromUserId: suggestion.fromUserId,
  fromUserName: suggestion.fromUserName,
  toUserId: suggestion.toUserId,
  toUserName: suggestion.toUserName,
  amount: suggestion.amount,
  status: 'SUGGESTED',
  originalTransactions: 1,
})

const fromSettlement = (settlement: SettlementResponse, groupName: string): SettlementItem => ({
  id: settlement.id,
  groupId: settlement.groupId,
  groupName,
  fromUserId: settlement.payerId ?? '',
  fromUserName: settlement.payerName ?? 'Member',
  toUserId: settlement.receiverId ?? '',
  toUserName: settlement.receiverName ?? 'Member',
  amount: settlement.amount,
  status: settlement.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
  originalTransactions: 1,
  persisted: true,
})

const SettlementsPage: React.FC = () => {
  const [settlements, setSettlements] = useState<SettlementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [settlingId, setSettlingId] = useState<string | null>(null)
  const { showToast } = useToast()

  const loadSettlements = async () => {
    setLoading(true)
    try {
      const groups = await groupService.list()
      const results = await Promise.all(
        groups.map(async (group) => {
          const [suggestions, settlementPage] = await Promise.all([
            groupService.settlementSuggestions(group.id).catch(() => []),
            settlementService.listByGroup(group.id).catch(() => null),
          ])
          return [
            ...suggestions.map((suggestion) => fromSuggestion(suggestion, group.id, group.name)),
            ...(settlementPage?.content ?? []).map((settlement) => fromSettlement(settlement, group.name)),
          ]
        })
      )
      setSettlements(results.flat())
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load settlements.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettlements()
  }, [])

  const pending = settlements.filter((settlement) => settlement.status === 'PENDING' || settlement.status === 'SUGGESTED')
  const totalSuggested = pending.reduce((sum, settlement) => sum + settlement.amount, 0)
  const stepsRemoved = pending.length

  const settleNow = async (settlement: SettlementItem) => {
    setSettlingId(settlement.id)
    try {
      const created = settlement.persisted
        ? { id: settlement.id }
        : await settlementService.create(settlement.groupId, {
            payerId: settlement.fromUserId,
            receiverId: settlement.toUserId,
            amount: settlement.amount,
            note: 'Marked from SplitSphere frontend',
          })
      await settlementService.complete(created.id)
      showToast('Settlement marked complete.', 'success')
      await loadSettlements()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to complete settlement.', 'error')
    } finally {
      setSettlingId(null)
    }
  }

  return (
    <div className="relative z-10 pt-24 pb-28 md:pb-10 px-5 md:px-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Smart Settlements</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            We've optimized your group's debts. Pay less often, settle faster.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          <GlassCard hover={false} delay={0.1}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-container" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Steps Removed</p>
                <p className="text-2xl font-bold">{stepsRemoved}</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">Optimized payment steps across your active groups.</p>
          </GlassCard>
          <GlassCard hover={false} delay={0.15}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/10 flex items-center justify-center">
                <span className="text-lg">$</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Suggested</p>
                <p className="text-2xl font-bold text-gradient">{money(totalSuggested)}</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">Total value waiting to settle.</p>
          </GlassCard>
          <GlassCard hover={false} delay={0.2}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-tertiary-container/10 flex items-center justify-center">
                <span className="text-lg">#</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Pending</p>
                <p className="text-2xl font-bold">{pending.length}</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">Settlements waiting for action.</p>
          </GlassCard>
        </div>

        <div>
          <h3 className="text-lg font-bold tracking-tight mb-4">Pending Settlements</h3>
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
            {loading ? (
              <div className="glass rounded-2xl p-8 text-center text-sm text-on-surface-variant">Loading settlements...</div>
            ) : settlements.length > 0 ? settlements.map((settlement) => {
              const config = statusConfig[settlement.status]
              const StatusIcon = config.icon
              return (
                <motion.div key={settlement.id} variants={fadeUp}>
                  <div className="glass rounded-2xl p-5 card-hover">
                    <div className="flex items-center gap-4">
                      <Avatar initials={initialsFor(settlement.fromUserName)} color={colorFor(settlement.fromUserId)} size="md" />
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      <Avatar initials={initialsFor(settlement.toUserName)} color={colorFor(settlement.toUserId)} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">
                          {settlement.fromUserName.split(' ')[0]} {'->'} {settlement.toUserName.split(' ')[0]}
                        </p>
                        <p className="text-xs text-on-surface-variant">{settlement.groupName} - {settlement.originalTransactions} optimized transaction</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-lg font-bold">{money(settlement.amount)}</p>
                        <span className={`chip ${config.chip}`}>
                          <StatusIcon className="w-3 h-3" /> {config.label}
                        </span>
                      </div>
                    </div>
                    {(settlement.status === 'PENDING' || settlement.status === 'SUGGESTED') && (
                      <div className="mt-4 flex justify-end gap-2">
                        <button className="btn-ghost text-xs" onClick={() => showToast('Reminder delivery is not exposed by the backend yet.', 'info')}>Remind</button>
                        <button disabled={settlingId === settlement.id} onClick={() => settleNow(settlement)} className="btn-primary text-xs py-2 px-4 disabled:opacity-60">
                          {settlingId === settlement.id ? 'Settling...' : 'Settle Now'}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            }) : (
              <div className="glass rounded-2xl p-8 text-center text-sm text-on-surface-variant">No settlement suggestions yet.</div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default SettlementsPage
