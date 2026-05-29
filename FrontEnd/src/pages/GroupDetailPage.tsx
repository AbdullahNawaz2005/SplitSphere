import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Settings, ChevronRight } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Avatar, { AvatarStack } from '../components/Avatar'
import AddExpenseModal, { AddExpensePayload, ModalUser } from '../components/AddExpenseModal'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { CategoryResponse, ExpenseResponse, GroupBalanceResponse, GroupResponse } from '../services/api'
import { expenseService } from '../services/expenseService'
import { groupService } from '../services/groupService'
import { colorFor, iconFor, initialsFor, money, shortDate } from '../utils/display'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' as const } },
}

const GroupDetailPage: React.FC = () => {
  const { id } = useParams()
  const [group, setGroup] = useState<GroupResponse | null>(null)
  const [members, setMembers] = useState<ModalUser[]>([])
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([])
  const [balance, setBalance] = useState<GroupBalanceResponse | null>(null)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submittingExpense, setSubmittingExpense] = useState(false)
  const { user } = useAuth()
  const { showToast } = useToast()

  const loadGroup = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [groupData, memberData, expensePage, balanceData, categoryData] = await Promise.all([
        groupService.get(id),
        groupService.members(id).catch(() => []),
        expenseService.listByGroup(id),
        groupService.balances(id).catch(() => null),
        expenseService.categories().catch(() => []),
      ])
      setGroup(groupData)
      const normalizedMembers = memberData.map((member) => {
        const memberId = member.userId ?? member.id ?? ''
        const name = member.userName ?? member.name ?? 'Member'
        return { id: memberId, name, email: member.email, initials: initialsFor(name), color: colorFor(memberId) }
      }).filter((member) => member.id)
      if (user?.id && !normalizedMembers.some((member) => member.id === user.id)) {
        normalizedMembers.unshift({ id: user.id, name: user.name, email: user.email, initials: initialsFor(user.name), color: colorFor(user.id) })
      }
      setMembers(normalizedMembers)
      setExpenses(expensePage.content)
      setBalance(balanceData)
      setCategories(categoryData)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load group.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroup()
  }, [id])

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const userBalance = balance?.balances.find((item) => item.userId === user?.id)?.netBalance ?? 0
  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => Date.parse(b.createdAt ?? b.expenseDate ?? '') - Date.parse(a.createdAt ?? a.expenseDate ?? '')),
    [expenses]
  )

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
      await loadGroup()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to add expense.', 'error')
    } finally {
      setSubmittingExpense(false)
    }
  }

  if (loading && !group) {
    return (
      <div className="relative z-10 pt-24 pb-28 md:pb-10 px-5 md:px-10">
        <div className="max-w-4xl mx-auto glass rounded-2xl p-8 text-center text-sm text-on-surface-variant">Loading group...</div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="relative z-10 pt-24 pb-28 md:pb-10 px-5 md:px-10">
        <div className="max-w-4xl mx-auto glass rounded-2xl p-8 text-center text-sm text-on-surface-variant">Group not found.</div>
      </div>
    )
  }

  return (
    <div className="relative z-10 pt-24 pb-28 md:pb-10 px-5 md:px-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <Link to="/groups" className="p-2 rounded-xl glass-subtle hover:bg-white/40 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{iconFor(group.name)}</span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
                <p className="text-sm text-on-surface-variant">{group.description ?? `Invite ${group.inviteCode ?? ''}`}</p>
              </div>
            </div>
          </div>
          <button className="p-2 rounded-xl glass-subtle hover:bg-white/40 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          <GlassCard hover={false} delay={0.1} className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Total</p>
            <p className="text-xl font-bold">{money(totalExpenses)}</p>
          </GlassCard>
          <GlassCard hover={false} delay={0.15} className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Your Balance</p>
            <p className={`text-xl font-bold ${userBalance >= 0 ? 'text-primary-container' : 'text-error'}`}>
              {userBalance >= 0 ? '+' : ''}{money(Math.abs(userBalance))}
            </p>
          </GlassCard>
          <GlassCard hover={false} delay={0.2} className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Members</p>
            <p className="text-xl font-bold">{members.length}</p>
          </GlassCard>
        </div>

        <GlassCard hover={false} delay={0.25}>
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">Members</h3>
          <div className="flex flex-wrap gap-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-2 glass-subtle rounded-full pl-1 pr-4 py-1">
                <Avatar initials={member.initials ?? initialsFor(member.name)} color={member.color ?? colorFor(member.id)} size="sm" />
                <span className="text-sm font-medium">{member.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 glass-subtle rounded-full px-4 py-2 text-sm font-medium text-primary">
              <Plus className="w-4 h-4" /> {group.inviteCode ?? 'Invite'}
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false} delay={0.3}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2">Settlement Suggestions</h3>
              <AvatarStack users={members.map((member) => ({ initials: member.initials ?? initialsFor(member.name), color: member.color ?? colorFor(member.id) }))} max={4} />
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{balance?.optimizedSettlements.length ?? 0}</p>
              <p className="text-xs text-on-surface-variant">optimized payments</p>
            </div>
          </div>
        </GlassCard>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold tracking-tight">Expenses</h3>
            <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          </div>
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="space-y-3">
            {sortedExpenses.length > 0 ? sortedExpenses.map((expense) => (
              <motion.div key={expense.id} variants={fadeUp}>
                <div className="glass rounded-2xl p-4 card-hover flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                    {iconFor(expense.categoryName ?? expense.description)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{expense.description ?? expense.title ?? 'Expense'}</p>
                    <p className="text-xs text-on-surface-variant">{expense.payerName ?? 'Member'} paid - {shortDate(expense.expenseDate ?? expense.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{money(expense.amount)}</p>
                    <p className="text-[10px] text-on-surface-variant">{money(expense.amount / Math.max(expense.splits?.length ?? members.length, 1))}/person</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-outline-variant" />
                </div>
              </motion.div>
            )) : (
              <div className="glass rounded-2xl p-8 text-center text-on-surface-variant">
                <p className="text-sm">No expenses yet. Add one to get started!</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <AddExpenseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        groups={[group]}
        defaultGroupId={group.id}
        currentUserId={user?.id}
        currentUserName={user?.name}
        members={members}
        categories={categories}
        isSubmitting={submittingExpense}
        onSubmit={addExpense}
      />
    </div>
  )
}

export default GroupDetailPage
