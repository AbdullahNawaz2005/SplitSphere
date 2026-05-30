import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, TrendingUp, ChevronRight } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import { AvatarStack } from '../components/Avatar'
import AddExpenseModal, { AddExpensePayload, ModalUser } from '../components/AddExpenseModal'
import { useAppearance } from '../contexts/AppearanceContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { CategoryResponse, ExpenseResponse, GroupResponse } from '../services/api'
import { expenseService } from '../services/expenseService'
import { groupService } from '../services/groupService'
import { colorFor, iconFor, initialsFor, money, shortDate } from '../utils/display'

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
          const [expensePage, balanceResponse, groupMembers] = await Promise.all([
            expenseService.listByGroup(group.id).catch(() => null),
            groupService.balances(group.id).catch(() => null),
            groupService.members(group.id).catch(() => []),
          ])
          return { group, expensePage, balanceResponse, groupMembers }
        })
      )
      setExpenses(results.flatMap((result) => result.expensePage?.content ?? []))
      setBalances(
        Object.fromEntries(
          results.map((result) => [
            result.group.id,
            result.balanceResponse?.balances.find((balance) => balance.userId === user?.id)?.netBalance ?? 0,
          ])
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

  return (
    <div className="relative z-10 pt-24 pb-28 md:pb-10 px-5 md:px-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-sm text-on-surface-variant">Good evening,</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user?.name ?? 'SplitSphere'}</h1>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-6">
          <GlassCard className="md:col-span-2" hover={false} delay={0.1}>
            <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">Total Combined Balance</p>
            <div className="flex items-end gap-3 mb-4">
              <h2 className="text-4xl font-bold tracking-tight text-gradient">{money(totalBalance)}</h2>
              <span className="chip chip-emerald mb-1">
                <TrendingUp className="w-3 h-3" /> Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-subtle rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">You're Owed</p>
                <p className="text-lg font-bold text-primary-container">{money(youAreOwed)}</p>
              </div>
              <div className="glass-subtle rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">You Owe</p>
                <p className="text-lg font-bold text-error">{money(youOwe)}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="md:col-span-3" hover={false} delay={0.2}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Insights</h3>
                <p className="text-xs text-on-surface-variant">Live backend data only</p>
              </div>
              <Link to="/insights" className="chip chip-cyan cursor-pointer hover:bg-cyan-100/20 transition-colors">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="h-48 glass-subtle rounded-2xl flex items-center justify-center px-6 text-center">
              <div>
                <p className="text-sm font-semibold">
                  {expenses.length === 0 ? 'No expenses yet. Add your first expense to see insights.' : 'Open Insights to review live category totals from your groups.'}
                </p>
                <p className="text-xs text-on-surface-variant mt-2">Fake weekly charts have been removed.</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
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
                    <div className="glass rounded-2xl p-4 card-hover flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${colorFor(group.id)}15` }}>
                        {iconFor(group.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{group.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{group.description ?? group.inviteCode ?? 'Shared expense group'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${(balances[group.id] ?? 0) >= 0 ? 'text-primary-container' : 'text-error'}`}>
                          {(balances[group.id] ?? 0) >= 0 ? '+' : ''}{money(Math.abs(balances[group.id] ?? 0))}
                        </p>
                        <AvatarStack users={(members[group.id] ?? []).map((member) => ({ initials: member.initials ?? initialsFor(member.name), color: member.color ?? colorFor(member.id) }))} max={3} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-outline-variant" />
                    </div>
                  </Link>
                </motion.div>
              )) : (
                <div className="glass rounded-2xl p-6 text-center text-sm text-on-surface-variant">Create or join a group to start splitting.</div>
              )}
            </motion.div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold tracking-tight">Recent Expenses</h3>
              <Link to="/activity" className="text-xs text-primary font-semibold hover:underline">See All</Link>
            </div>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
              {recentExpenses.length > 0 ? recentExpenses.map((expense) => {
                const group = groups.find((item) => item.id === expense.groupId)
                return (
                  <motion.div key={expense.id} variants={fadeUp}>
                    <div className="glass rounded-2xl p-4 card-hover flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                        {iconFor(expense.categoryName ?? expense.description)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{expense.description ?? expense.title ?? 'Expense'}</p>
                        <p className="text-xs text-on-surface-variant">{expense.categoryName ?? 'Shared'} - {group?.name ?? 'Group'} - {shortDate(expense.expenseDate ?? expense.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{money(expense.amount)}</p>
                        <p className="text-[10px] text-on-surface-variant">{expense.payerId === user?.id ? 'You paid' : `${expense.payerName ?? 'Member'} paid`}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              }) : (
                <div className="glass rounded-2xl p-6 text-center text-sm text-on-surface-variant">No expenses yet. Add your first expense to see insights.</div>
              )}
            </motion.div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setExpenseModalOpen(true)}
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
        categories={categories}
        isSubmitting={submittingExpense}
        onSubmit={addExpense}
      />
    </div>
  )
}

export default DashboardPage
