import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, Check, Clock, AlertTriangle } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import { useAppearance } from '../contexts/AppearanceContext'
import { useToast } from '../contexts/ToastContext'
import { SettlementResponse, SettlementSuggestionResponse } from '../services/api'
import { groupService } from '../services/groupService'
import { settlementService } from '../services/settlementService'
import { useAuth } from '../contexts/AuthContext'
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
  PENDING: { label: 'Pending confirmation', chip: 'chip-orange', icon: Clock },
  PENDING_CONFIRMATION: { label: 'Pending confirmation', chip: 'chip-orange', icon: Clock },
  COMPLETED: { label: 'Settled', chip: 'chip-purple', icon: Check },
  REJECTED: { label: 'Rejected', chip: 'chip-red', icon: AlertTriangle },
  SUGGESTED: { label: 'Suggested', chip: 'chip-emerald', icon: Zap },
  OVERDUE: { label: 'Overdue', chip: 'chip-red', icon: AlertTriangle },
}

interface SettlementItem {
  id: string
  groupId: string
  groupName: string
  groupOwnerId?: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  amount: number
  status: keyof typeof statusConfig
  originalTransactions: number
  persisted?: boolean
}

interface BalanceItem {
  id: string
  groupName: string
  userName: string
  amount: number
}

const fromSuggestion = (suggestion: SettlementSuggestionResponse, groupId: string, groupName: string, groupOwnerId?: string): SettlementItem => ({
  id: `${groupId}-${suggestion.fromUserId}-${suggestion.toUserId}`,
  groupId,
  groupName,
  groupOwnerId,
  fromUserId: suggestion.fromUserId,
  fromUserName: suggestion.fromUserName,
  toUserId: suggestion.toUserId,
  toUserName: suggestion.toUserName,
  amount: suggestion.amount,
  status: 'SUGGESTED',
  originalTransactions: 1,
})

const fromSettlement = (settlement: SettlementResponse, groupName: string, groupOwnerId?: string): SettlementItem => ({
  id: settlement.id,
  groupId: settlement.groupId,
  groupName,
  groupOwnerId,
  fromUserId: settlement.payerId ?? '',
  fromUserName: settlement.payerName ?? 'Member',
  toUserId: settlement.receiverId ?? '',
  toUserName: settlement.receiverName ?? 'Member',
  amount: settlement.amount,
  status: (settlement.status === 'COMPLETED' || settlement.status === 'REJECTED' || settlement.status === 'PENDING_CONFIRMATION')
    ? settlement.status
    : 'PENDING',
  originalTransactions: 1,
  persisted: true,
})

const SettlementsPage: React.FC = () => {
  const [settlements, setSettlements] = useState<SettlementItem[]>([])
  const [balances, setBalances] = useState<BalanceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [settlingId, setSettlingId] = useState<string | null>(null)
  const { showToast } = useToast()
  const { user } = useAuth()
  useAppearance()

  const loadSettlements = async () => {
    setLoading(true)
    try {
      const groups = await groupService.list()
      const results = await Promise.all(
        groups.map(async (group) => {
          const [suggestions, settlementPage, balance] = await Promise.all([
            groupService.settlementSuggestions(group.id).catch(() => []),
            settlementService.listByGroup(group.id).catch(() => null),
            groupService.balances(group.id).catch(() => null),
          ])
          return {
            settlements: [
              ...suggestions.map((suggestion) => fromSuggestion(suggestion, group.id, group.name, group.ownerId)),
              ...(settlementPage?.content ?? []).map((settlement) => fromSettlement(settlement, group.name, group.ownerId)),
            ],
            balances: (balance?.balances ?? [])
              .filter((item) => Math.abs(item.netBalance) > 0)
              .map((item) => ({
                id: `${group.id}-${item.userId}`,
                groupName: group.name,
                userName: item.userName,
                amount: item.netBalance,
              })),
          }
        })
      )
      setSettlements(results.flatMap((result) => result.settlements))
      setBalances(results.flatMap((result) => result.balances))
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load settlements.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettlements()
  }, [])

  const pending = settlements.filter((settlement) => settlement.status === 'PENDING' || settlement.status === 'PENDING_CONFIRMATION' || settlement.status === 'SUGGESTED')
  const history = settlements.filter((settlement) => settlement.status === 'COMPLETED' || settlement.status === 'REJECTED')
  const totalSuggested = pending.reduce((sum, settlement) => sum + settlement.amount, 0)
  const stepsRemoved = pending.length

  const recordPayment = async (settlement: SettlementItem) => {
    setSettlingId(settlement.id)
    try {
      await settlementService.create(settlement.groupId, {
        payerId: settlement.fromUserId,
        receiverId: settlement.toUserId,
        amount: settlement.amount,
        note: 'Marked from SplitSphere frontend',
      })
      showToast('Payment recorded. Waiting for receiver confirmation.', 'success')
      await loadSettlements()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to record settlement.', 'error')
    } finally {
      setSettlingId(null)
    }
  }

  const confirmPayment = async (settlement: SettlementItem) => {
    setSettlingId(settlement.id)
    try {
      await settlementService.complete(settlement.id)
      showToast('Payment confirmed.', 'success')
      await loadSettlements()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to confirm settlement.', 'error')
    } finally {
      setSettlingId(null)
    }
  }

  const rejectPayment = async (settlement: SettlementItem) => {
    setSettlingId(settlement.id)
    try {
      await settlementService.reject(settlement.id)
      showToast('Payment marked not received.', 'success')
      await loadSettlements()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to reject settlement.', 'error')
    } finally {
      setSettlingId(null)
    }
  }

  return (
    <div className="relative z-10 pt-24 pb-28 md:pb-10 px-5 md:px-10">
      <div className="max-w-5xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Smart Settlements</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Settle balances quickly and fairly using live group balances.
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
            <p className="text-xs text-on-surface-variant mt-2">Optimized settlement steps across your active groups.</p>
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
            <p className="text-xs text-on-surface-variant mt-2">Total value waiting to record.</p>
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

        <div className="grid lg:grid-cols-5 gap-5">
          <GlassCard hover={false} delay={0.25} className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Current Balances</h3>
                <p className="text-xs text-on-surface-variant">Who is currently ahead or behind.</p>
              </div>
            </div>
            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-on-surface-variant">Loading balances...</p>
              ) : balances.length > 0 ? balances.slice(0, 8).map((balance) => (
                <div key={balance.id} className="flex items-center justify-between gap-3 glass-subtle rounded-xl p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{balance.userName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{balance.groupName}</p>
                  </div>
                  <p className={`text-sm font-bold ${balance.amount >= 0 ? 'text-primary-container' : 'text-error'}`}>
                    {balance.amount >= 0 ? '+' : '-'}{money(Math.abs(balance.amount))}
                  </p>
                </div>
              )) : (
                <div className="glass-subtle rounded-xl p-5 text-center">
                  <p className="text-sm font-semibold">All balances are clear</p>
                  <p className="text-xs text-on-surface-variant mt-1">No outstanding group balances right now.</p>
                </div>
              )}
            </div>
          </GlassCard>

          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Recommended Settlement Plan</h3>
                <p className="text-xs text-on-surface-variant">Optimized steps from your backend suggestions.</p>
              </div>
            </div>
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
            {loading ? (
              <div className="glass rounded-2xl p-8 text-center text-sm text-on-surface-variant">Loading settlements...</div>
            ) : pending.length > 0 ? pending.map((settlement) => {
              const config = statusConfig[settlement.status]
              const StatusIcon = config.icon
              const canRecord = settlement.status === 'SUGGESTED' && settlement.fromUserId === user?.id
              const canResolve = Boolean(
                settlement.persisted &&
                settlement.status !== 'SUGGESTED' &&
                (settlement.toUserId === user?.id || settlement.groupOwnerId === user?.id)
              )
              const pendingMessage = settlement.toUserId === user?.id
                ? `${settlement.fromUserName} marked ${money(settlement.amount)} as paid to you. Confirm payment?`
                : `${settlement.fromUserName} marked ${money(settlement.amount)} as paid to ${settlement.toUserName}.`
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
                        <p className="text-xs text-on-surface-variant">
                          {settlement.status === 'SUGGESTED'
                            ? `${settlement.groupName} - ${settlement.originalTransactions} optimized settlement`
                            : pendingMessage}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-lg font-bold">{money(settlement.amount)}</p>
                        <span className={`chip ${config.chip}`}>
                          <StatusIcon className="w-3 h-3" /> {config.label}
                        </span>
                      </div>
                    </div>
                    {(canRecord || canResolve) && (
                      <div className="mt-4 flex justify-end gap-2">
                        {canResolve && (
                          <>
                            <button disabled={settlingId === settlement.id} onClick={() => rejectPayment(settlement)} className="btn-ghost text-xs py-2 px-4 disabled:opacity-60">
                              Not Received
                            </button>
                            <button disabled={settlingId === settlement.id} onClick={() => confirmPayment(settlement)} className="btn-primary text-xs py-2 px-4 disabled:opacity-60">
                              {settlingId === settlement.id ? 'Confirming...' : 'Confirm Received'}
                            </button>
                          </>
                        )}
                        {canRecord && (
                          <button disabled={settlingId === settlement.id} onClick={() => recordPayment(settlement)} className="btn-primary text-xs py-2 px-4 disabled:opacity-60">
                            {settlingId === settlement.id ? 'Recording...' : 'Record Payment'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            }) : (
              <div className="glass rounded-2xl p-8 text-center">
                <p className="text-base font-semibold">No settlement suggestions yet</p>
                <p className="text-sm text-on-surface-variant mt-2">Add expenses to generate optimized settlement steps.</p>
              </div>
            )}
          </motion.div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold tracking-tight mb-4">Settlement History</h3>
          <div className="space-y-3">
            {history.length > 0 ? history.map((settlement) => (
              <div key={settlement.id} className="glass rounded-2xl p-4 flex items-center gap-4">
                <Avatar initials={initialsFor(settlement.fromUserName)} color={colorFor(settlement.fromUserId)} name={settlement.fromUserName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{settlement.fromUserName} paid {settlement.toUserName}</p>
                  <p className="text-xs text-on-surface-variant truncate">{settlement.groupName}</p>
                </div>
                <p className="text-sm font-bold">{money(settlement.amount)}</p>
                <span className={`chip ${statusConfig[settlement.status].chip}`}>
                  {statusConfig[settlement.status].label}
                </span>
              </div>
            )) : (
              <div className="glass rounded-2xl p-6 text-center">
                <p className="text-sm font-semibold">No settlement history yet</p>
                <p className="text-xs text-on-surface-variant mt-1">Completed settlements will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettlementsPage
