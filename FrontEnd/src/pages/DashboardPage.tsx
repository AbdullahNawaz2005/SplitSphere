import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, TrendingUp, ChevronRight, ReceiptText, Users } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import { AvatarStack } from '../components/Avatar'
import AddExpenseModal, { AddExpensePayload, ModalUser } from '../components/AddExpenseModal'
import { useAppearance } from '../contexts/AppearanceContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { ActivityLogResponse, CategoryResponse, ExpenseResponse, GroupResponse } from '../services/api'
import { expenseService } from '../services/expenseService'
import { groupService } from '../services/groupService'
import { settlementService } from '../services/settlementService'
import { categoryLabel, colorFor, iconFor, initialsFor, money, relativeTime, shortDate } from '../utils/display'

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' as const } },
}

const toModalUsers = (members: ModalUser[], userId?: string, userName?: string): ModalUser[] => {
  if (!userId) return members
  if (members.some((member) => member.id === userId)) return members
  return [{ id: userId, name: userName ?? 'You', initials: initialsFor(userName), color: colorFor(userId) }, ...members]
}

const DashboardPage: React.FC = () => {
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([])
  const [activities, setActivities] = useState<ActivityLogResponse[]>([])
  const [pendingConfirmations, setPendingConfirmations] = useState<Array<{ id: string; groupName: string; payerName: string; amount: number }>>([])
  const [members, setMembers] = useState<Record<string, ModalUser[]>>({})
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [submittingExpense, setSubmittingExpense] = useState(false)
  const { user } = useAuth()
  const { showToast } = useToast()
  useAppearance()

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const groupList = await groupService.list()
      setGroups(groupList)
      const results = await Promise.all(
        groupList.map(async (group) => {
          const [expensePage, balanceResponse, groupMembers, activityPage, settlementPage] = await Promise.all([
            expenseService.listByGroup(group.id).catch(() => null),
            groupService.balances(group.id).catch(() => null),
            groupService.members(group.id).catch(() => []),
            groupService.activity(group.id).catch(() => null),
            settlementService.listByGroup(group.id).catch(() => null),
          ])
          return { group, expensePage, balanceResponse, groupMembers, activityPage, settlementPage }
        })
      )
      setExpenses(results.flatMap((result) => result.expensePage?.content ?? []))
      setActivities(
        results
          .flatMap((result) => result.activityPage?.content ?? [])
          .sort((a, b) => Date.parse(b.createdAt ?? '') - Date.parse(a.createdAt ?? ''))
          .slice(0, 5)
      )
      setBalances(
        Object.fromEntries(
          results.map((result) => [
            result.group.id,
            result.balanceResponse?.balances.find((balance) => balance.userId === user?.id)?.netBalance ?? 0,
          ])
        )
      )
      setPendingConfirmations(
        results.flatMap((result) =>
          (result.settlementPage?.content ?? [])
            .filter((settlement) =>
              (settlement.status === 'PENDING' || settlement.status === 'PENDING_CONFIRMATION') &&
              settlement.receiverId === user?.id
            )
            .map((settlement) => ({
              id: settlement.id,
              groupName: result.group.name,
              payerName: settlement.payerName ?? 'Member',
              amount: settlement.amount,
            }))
        )
      )
      setMembers(
        Object.fromEntries(
          results.map((result) => [
            result.group.id,
            toModalUsers(
              result.groupMembers.map((member) => {
                const id = member.userId ?? member.id ?? ''
                const name = member.userName ?? member.name ?? 'Member'
                return { id, name, email: member.email, initials: initialsFor(name), color: colorFor(id) }
              }).filter((member) => member.id),
              user?.id,
              user?.name
            ),
          ])
        )
      )
      setCategories(await expenseService.categories().catch(() => []))
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load dashboard.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const totalBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0)
  const youAreOwed = Object.values(balances).filter((balance) => balance > 0).reduce((sum, balance) => sum + balance, 0)
  const youOwe = Math.abs(Object.values(balances).filter((balance) => balance < 0).reduce((sum, balance) => sum + balance, 0))
  const recentExpenses = useMemo(
    () => [...expenses].sort((a, b) => Date.parse(b.createdAt ?? b.expenseDate ?? '') - Date.parse(a.createdAt ?? a.expenseDate ?? '')).slice(0, 5),
    [expenses]
  )
  const activeGroupId = groups[0]?.id
  const activeMembers = activeGroupId ? members[activeGroupId] ?? [] : []

  const addExpense = async (payload: AddExpensePayload) => {
    setSubmittingExpense(true)
    try {
      await expenseService.create(payload.groupId, {
        payerId: payload.payerId,
        title: payload.title,
        amount: payload.amount,
        splitType: 'EQUAL',
        categoryId: payload.categoryId,
        splits: payload.splitUserIds.map((userId) => ({ userId })),
      })
      showToast('Expense added.', 'success')
      await loadDashboard()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to add expense.', 'error')
    } finally {
      setSubmittingExpense(false)
    }
  }

  const resolveSettlement = async (settlementId: string, accepted: boolean) => {
    try {
      if (accepted) {
        await settlementService.complete(settlementId)
        showToast('Payment confirmed.', 'success')
      } else {
        await settlementService.reject(settlementId)
        showToast('Payment marked not received.', 'success')
      }
      await loadDashboard()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update settlement.', 'error')
    }
  }

  return (
    <div className="relative z-10 pt-24 pb-28 md:pb-10 px-4 sm:px-5 md:px-10 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-5 min-w-0">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-sm text-on-surface-variant">Good evening,</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user?.name ?? 'SplitSphere'}</h1>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-3 min-w-0">
          <GlassCard className="lg:col-span-2 min-w-0" hover={false} delay={0.1}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Net Balance</p>
                <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight break-words ${totalBalance >= 0 ? 'text-gradient' : 'text-error'}`}>
                  {totalBalance >= 0 ? '+' : '-'}{money(Math.abs(totalBalance))}
                </h2>
              </div>
              <span className="chip chip-emerald shrink-0">
                <TrendingUp className="w-3 h-3" /> Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="glass-subtle rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">You're Owed</p>
                <p className="text-base sm:text-lg font-bold text-primary-container break-words">{money(youAreOwed)}</p>
              </div>
              <div className="glass-subtle rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">You Owe</p>
                <p className="text-base sm:text-lg font-bold text-error break-words">{money(youOwe)}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard hover={false} delay={0.15}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-container" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Active Groups</p>
                <p className="text-2xl font-bold">{groups.length}</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-3">Groups with live balances and expenses.</p>
          </GlassCard>

          <GlassCard hover={false} delay={0.2}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/10 flex items-center justify-center">
                <ReceiptText className="w-5 h-5 text-secondary-container" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Expenses</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-3">Recent expenses across your groups.</p>
          </GlassCard>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold tracking-tight">Active Groups</h3>
              <Link to="/groups" className="text-xs text-primary font-semibold hover:underline">See All</Link>
            </div>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
              {loading ? (
                <div className="glass rounded-2xl p-6 text-center text-sm text-on-surface-variant">Loading groups...</div>
              ) : groups.length > 0 ? groups.slice(0, 3).map((group) => (
                <motion.div key={group.id} variants={fadeUp}>
                  <Link to={`/groups/${group.id}`}>
                    <div className="glass rounded-2xl p-4 card-hover flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: `${colorFor(group.id)}15` }}>
                        {iconFor(group.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{group.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{group.description ?? group.inviteCode ?? 'Shared expense group'}</p>
                      </div>
                      <div className="text-right shrink-0 min-w-0 max-w-[8rem]">
                        <p className={`text-sm font-bold break-words ${(balances[group.id] ?? 0) >= 0 ? 'text-primary-container' : 'text-error'}`}>
                          {(balances[group.id] ?? 0) >= 0 ? '+' : ''}{money(Math.abs(balances[group.id] ?? 0))}
                        </p>
                        <AvatarStack users={(members[group.id] ?? []).map((member) => ({ initials: member.initials ?? initialsFor(member.name), color: member.color ?? colorFor(member.id), name: member.name }))} max={3} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-outline-variant shrink-0 hidden sm:block" />
                    </div>
                  </Link>
                </motion.div>
              )) : (
                <div className="glass rounded-2xl p-6 text-center">
                  <p className="text-sm font-semibold">No groups yet</p>
                  <p className="text-xs text-on-surface-variant mt-1">Create or join a group to start splitting.</p>
                </div>
              )}
            </motion.div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold tracking-tight">Recent Expenses</h3>
              <Link to="/activity" className="text-xs text-primary font-semibold hover:underline">See All</Link>
            </div>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
              {recentExpenses.length > 0 ? recentExpenses.map((expense) => {
                const group = groups.find((item) => item.id === expense.groupId)
                const displayCategory = categoryLabel(expense.categoryName)
                return (
                  <motion.div key={expense.id} variants={fadeUp}>
                    <div className="glass rounded-2xl p-4 card-hover flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                        {iconFor(displayCategory ?? expense.description)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{expense.description ?? expense.title ?? 'Expense'}</p>
                        <p className="text-xs text-on-surface-variant truncate">{displayCategory} - {group?.name ?? 'Group'} - {shortDate(expense.expenseDate ?? expense.createdAt)}</p>
                      </div>
                      <div className="text-right shrink-0 max-w-[7.5rem]">
                        <p className="text-sm font-bold break-words">{money(expense.amount)}</p>
                        <p className="text-[10px] text-on-surface-variant">{expense.payerId === user?.id ? 'You paid' : `${expense.payerName ?? 'Member'} paid`}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              }) : (
                <div className="glass rounded-2xl p-6 text-center">
                  <p className="text-sm font-semibold">No expenses yet</p>
                  <p className="text-xs text-on-surface-variant mt-1">Add your first expense to see it here.</p>
                </div>
              )}
            </motion.div>
          </div>

          <div className="min-w-0">
            {pendingConfirmations.length > 0 && (
              <div className="mb-5">
                <h3 className="text-lg font-bold tracking-tight mb-4">Pending Confirmations</h3>
                <div className="space-y-3">
                  {pendingConfirmations.slice(0, 3).map((settlement) => (
                    <div key={settlement.id} className="glass rounded-2xl p-4">
                      <p className="text-sm font-semibold">
                        {settlement.payerName} marked {money(settlement.amount)} as paid to you.
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">{settlement.groupName}</p>
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <button onClick={() => resolveSettlement(settlement.id, false)} className="btn-ghost text-xs px-3 py-2">
                          Not Received
                        </button>
                        <button onClick={() => resolveSettlement(settlement.id, true)} className="btn-primary text-xs px-3 py-2">
                          Confirm Received
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold tracking-tight">Recent Activity</h3>
              <Link to="/activity" className="text-xs text-primary font-semibold hover:underline">View Timeline</Link>
            </div>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
              {activities.length > 0 ? activities.map((activity) => (
                <motion.div key={activity.id} variants={fadeUp}>
                  <div className="glass rounded-2xl p-4 card-hover">
                    <p className="text-sm font-semibold break-words">{activity.description ?? activity.action ?? 'Activity'}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{activity.userName ?? 'Someone'} · {relativeTime(activity.createdAt)}</p>
                  </div>
                </motion.div>
              )) : (
                <div className="glass rounded-2xl p-6 text-center">
                  <p className="text-sm font-semibold">No recent activity</p>
                  <p className="text-xs text-on-surface-variant mt-1">Group updates will appear here.</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setExpenseModalOpen(true)}
          aria-label="Add expense"
          className="fixed bottom-24 md:bottom-8 right-6 w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white shadow-lg shadow-primary-container/30 z-40"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>

      <AddExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        groups={groups}
        defaultGroupId={activeGroupId}
        currentUserId={user?.id}
        currentUserName={user?.name}
        members={activeMembers}
        groupMembersByGroup={members}
        categories={categories}
        isSubmitting={submittingExpense}
        onSubmit={addExpense}
      />
    </div>
  )
}

export default DashboardPage
