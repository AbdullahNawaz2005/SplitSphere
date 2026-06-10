import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Check,
  ChevronRight,
  Utensils,
  ShoppingBasket,
  BusFront,
  Fuel,
  Home,
  Plug,
  ShoppingBag,
  Plane,
  Film,
  HeartPulse,
  GraduationCap,
  Repeat,
  Gift,
  Package,
  Wrench,
  Dumbbell,
  PawPrint,
  CalendarDays,
  CircleEllipsis,
  Search,
} from 'lucide-react'
import { useAppearance } from '../contexts/AppearanceContext'
import { useToast } from '../contexts/ToastContext'
import { colorFor, formatCurrencyAmount, initialsFor, toBasePkrAmount } from '../utils/display'
import { currencyOptions } from '../utils/preferences'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  groups?: { id: string; name: string }[]
  defaultGroupId?: string
  currentUserId?: string
  currentUserName?: string
  members?: ModalUser[]
  groupMembersByGroup?: Record<string, ModalUser[]>
  categories?: ModalCategory[]
  isSubmitting?: boolean
  onSubmit?: (payload: AddExpensePayload) => Promise<void> | void
}

export interface ModalUser {
  id: string
  name: string
  email?: string
  initials?: string
  color?: string
}

export interface ModalCategory {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  backendId?: string
}

export interface AddExpensePayload {
  groupId: string
  payerId: string
  title: string
  amount: number
  categoryId?: string
  splitUserIds: string[]
}

const steps = ['amount', 'category', 'people', 'summary'] as const
type Step = typeof steps[number]

const TITLE_MAX_LENGTH = 80

const categoryCatalog = [
  { id: 'food-dining', name: 'Food & Dining', Icon: Utensils, color: '#10b981' },
  { id: 'groceries', name: 'Groceries', Icon: ShoppingBasket, color: '#22c55e' },
  { id: 'transport', name: 'Transport', Icon: BusFront, color: '#06b6d4' },
  { id: 'fuel', name: 'Fuel', Icon: Fuel, color: '#f59e0b' },
  { id: 'rent', name: 'Rent', Icon: Home, color: '#8b5cf6' },
  { id: 'utilities', name: 'Utilities', Icon: Plug, color: '#0ea5e9' },
  { id: 'shopping', name: 'Shopping', Icon: ShoppingBag, color: '#ec4899' },
  { id: 'travel', name: 'Travel', Icon: Plane, color: '#14b8a6' },
  { id: 'entertainment', name: 'Entertainment', Icon: Film, color: '#a855f7' },
  { id: 'medical', name: 'Medical', Icon: HeartPulse, color: '#ef4444' },
  { id: 'education', name: 'Education', Icon: GraduationCap, color: '#6366f1' },
  { id: 'subscriptions', name: 'Subscriptions', Icon: Repeat, color: '#0891b2' },
  { id: 'gifts', name: 'Gifts', Icon: Gift, color: '#f43f5e' },
  { id: 'home-supplies', name: 'Home Supplies', Icon: Package, color: '#84cc16' },
  { id: 'maintenance', name: 'Maintenance', Icon: Wrench, color: '#64748b' },
  { id: 'fitness', name: 'Fitness', Icon: Dumbbell, color: '#10b981' },
  { id: 'pets', name: 'Pets', Icon: PawPrint, color: '#d97706' },
  { id: 'events', name: 'Events', Icon: CalendarDays, color: '#7c3aed' },
  { id: 'other', name: 'Other', Icon: CircleEllipsis, color: '#6b7280' },
]

type ExpenseCategory = (typeof categoryCatalog)[number] & { backendId?: string }

const backendCategoryAliases: Record<string, string[]> = {
  'food-dining': ['food', 'food-drink', 'food-and-drink', 'utensils'],
  groceries: ['shopping-cart'],
  transport: ['car'],
  rent: ['housing'],
  utilities: ['bolt'],
  shopping: ['shopping-bag'],
  events: ['party-popper'],
  other: ['circle'],
}

const normalizeCategoryKey = (value?: string | null) =>
  (value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  groups = [],
  defaultGroupId,
  currentUserId,
  currentUserName = 'You',
  members = [],
  groupMembersByGroup,
  categories,
  isSubmitting = false,
  onSubmit,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const [currentStep, setCurrentStep] = useState<Step>('amount')
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId ?? groups[0]?.id ?? '')
  const { currency } = useAppearance()
  const { showToast } = useToast()

  const stepIndex = steps.indexOf(currentStep)
  const visibleCategories = useMemo<ExpenseCategory[]>(() => {
    const backendByKey = new Map<string, ModalCategory>()
    categories?.forEach((category) => {
      backendByKey.set(normalizeCategoryKey(category.id), category)
      backendByKey.set(normalizeCategoryKey(category.name), category)
    })

    return categoryCatalog.map((category) => {
      const aliasMatch = backendCategoryAliases[category.id]
        ?.map((alias) => backendByKey.get(normalizeCategoryKey(alias)))
        .find(Boolean)
      const backendCategory =
        backendByKey.get(normalizeCategoryKey(category.id)) ??
        backendByKey.get(normalizeCategoryKey(category.name)) ??
        aliasMatch
      return { ...category, backendId: backendCategory?.id }
    })
  }, [categories])
  const filteredCategories = useMemo(
    () =>
      visibleCategories.filter((category) =>
        category.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
      ),
    [categorySearch, visibleCategories]
  )
  const activePayerId = currentUserId ?? members[0]?.id ?? ''
  const selectedGroupMembers = useMemo(
    () => (selectedGroupId && groupMembersByGroup?.[selectedGroupId]) || members,
    [groupMembersByGroup, members, selectedGroupId]
  )

  useEffect(() => {
    if (isOpen) {
      setSelectedGroupId(defaultGroupId ?? groups[0]?.id ?? '')
      setSelectedPeople([])
    }
  }, [defaultGroupId, groups, isOpen])

  useEffect(() => {
    setSelectedPeople((previous) =>
      previous.filter((id) => selectedGroupMembers.some((member) => member.id === id))
    )
  }, [selectedGroupMembers])

  const resetAndClose = useCallback(() => {
    setCurrentStep('amount')
    setAmount('')
    setTitle('')
    setSelectedCategory('')
    setCategorySearch('')
    setSelectedPeople([])
    setSelectedGroupId(defaultGroupId ?? groups[0]?.id ?? '')
    onClose()
  }, [defaultGroupId, groups, onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        resetAndClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, resetAndClose])

  const amountValue = Number(amount)
  const validAmount = Number.isFinite(amountValue) && amountValue > 0
  const validTitle = title.trim().length > 0 && title.trim().length <= TITLE_MAX_LENGTH
  const selectedCategoryData = visibleCategories.find((c) => c.id === selectedCategory)
  const canContinueFromAmount = Boolean(selectedGroupId && activePayerId && validAmount && validTitle)

  const validateCurrentStep = () => {
    if (currentStep === 'amount') {
      if (!selectedGroupId) {
        showToast('Choose a group before continuing.', 'error')
        return false
      }
      if (!validAmount) {
        showToast('Enter an amount greater than 0.', 'error')
        return false
      }
      if (!title.trim()) {
        showToast('Add a short description for the expense.', 'error')
        return false
      }
      if (title.trim().length > TITLE_MAX_LENGTH) {
        showToast(`Description must be ${TITLE_MAX_LENGTH} characters or fewer.`, 'error')
        return false
      }
    }

    if (currentStep === 'category' && !selectedCategoryData) {
      showToast('Choose a category before continuing.', 'error')
      return false
    }

    if (currentStep === 'people' && selectedPeople.length === 0) {
      showToast('Select at least one split participant.', 'error')
      return false
    }

    return true
  }

  const nextStep = () => {
    if (!validateCurrentStep()) return
    const idx = steps.indexOf(currentStep)
    if (idx < steps.length - 1) setCurrentStep(steps[idx + 1])
  }

  const prevStep = () => {
    const idx = steps.indexOf(currentStep)
    if (idx > 0) setCurrentStep(steps[idx - 1])
  }

  const togglePerson = (id: string) => {
    setSelectedPeople((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const selectAllPeople = () => {
    setSelectedPeople(selectedGroupMembers.map((member) => member.id))
  }

  const clearPeople = () => {
    setSelectedPeople([])
  }

  const splitAmount = selectedPeople.length > 0 ? (validAmount ? amountValue : 0) / selectedPeople.length : 0
  const selectedPeopleData = selectedPeople
    .map((id) => selectedGroupMembers.find((member) => member.id === id))
    .filter(Boolean) as ModalUser[]

  const submitExpense = async () => {
    if (!selectedGroupId || !activePayerId) {
      showToast('Choose a group before submitting.', 'error')
      return
    }
    if (!validAmount) {
      showToast('Enter an amount greater than 0.', 'error')
      return
    }
    if (!validTitle) {
      showToast('Add a short description for the expense.', 'error')
      return
    }
    if (!selectedCategoryData) {
      showToast('Choose a category before submitting.', 'error')
      return
    }
    if (selectedPeople.length === 0) {
      showToast('Select at least one split participant.', 'error')
      return
    }
    // Temporary input conversion: users enter the selected display currency,
    // while the current backend contract stores all expense amounts as PKR.
    const basePkrAmount = toBasePkrAmount(amountValue, currency)
    await onSubmit?.({
      groupId: selectedGroupId,
      payerId: activePayerId,
      title: title.trim(),
      amount: Number(basePkrAmount.toFixed(2)),
      categoryId: selectedCategoryData.backendId,
      splitUserIds: selectedPeople,
    })
    resetAndClose()
  }

  const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  const modal = {
    hidden: { opacity: 0, y: 40, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1 },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={resetAndClose}
          />

          {/* Modal */}
          <motion.div
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] glass-strong rounded-3xl overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-expense-title"
            aria-describedby="add-expense-step"
            ref={modalRef}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div>
                <h2 id="add-expense-title" className="text-xl font-bold tracking-tight">Add Expense</h2>
                <p id="add-expense-step" className="text-sm text-on-surface-variant mt-1">Step {stepIndex + 1} of {steps.length}</p>
              </div>
              <button onClick={resetAndClose} className="p-2 rounded-xl hover:bg-white/30 transition-colors" aria-label="Close add expense dialog">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-6">
              <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-primary rounded-full"
                  animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6 min-h-0 overflow-y-auto">
              <AnimatePresence mode="wait">
                {currentStep === 'amount' && (
                  <motion.div
                    key="amount"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight">How much was it?</h3>
                      <p className="text-sm text-on-surface-variant mt-1">Enter the total bill amount in {currency}</p>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-primary-container">
                        {currencyOptions[currency].symbol}
                      </span>
                      <label htmlFor="expense-amount" className="sr-only">Expense amount in {currency}</label>
                      <input
                        id="expense-amount"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder={formatCurrencyAmount(0, currency)}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        aria-label={`Expense amount in ${currency}`}
                        className="w-full pl-16 pr-4 py-4 text-2xl sm:text-3xl font-bold glass-input rounded-2xl outline-none text-on-surface placeholder:text-outline-variant"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label htmlFor="expense-description" className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-2 block">Description</label>
                      <input
                        id="expense-description"
                        type="text"
                        placeholder="e.g. Dinner at Monal"
                        value={title}
                        onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX_LENGTH))}
                        maxLength={TITLE_MAX_LENGTH}
                        aria-label="Expense description"
                        className="w-full px-4 py-3 glass-input rounded-xl outline-none text-on-surface placeholder:text-outline-variant text-sm"
                      />
                      <p className="mt-1 text-[11px] text-on-surface-variant">{title.length}/{TITLE_MAX_LENGTH}</p>
                    </div>
                    {groups.length > 1 && !defaultGroupId && (
                      <div>
                        <label htmlFor="expense-group" className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-2 block">Group</label>
                        <select
                          id="expense-group"
                          value={selectedGroupId}
                          onChange={(event) => {
                            setSelectedGroupId(event.target.value)
                            setSelectedPeople([])
                          }}
                          aria-label="Expense group"
                          className="w-full px-4 py-3 glass-input rounded-xl outline-none text-on-surface text-sm"
                        >
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </motion.div>
                )}

                {currentStep === 'category' && (
                  <motion.div
                    key="category"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight">What's it for?</h3>
                      <p className="text-sm text-on-surface-variant mt-1">Select a category for better tracking</p>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                      <label htmlFor="category-search" className="sr-only">Search categories</label>
                      <input
                        id="category-search"
                        type="text"
                        value={categorySearch}
                        onChange={(event) => setCategorySearch(event.target.value)}
                        placeholder="Search categories..."
                        aria-label="Search categories"
                        className="w-full pl-10 pr-4 py-3 glass-input rounded-xl outline-none text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                      {filteredCategories.map((cat) => {
                        const CategoryIcon = cat.Icon
                        return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          aria-pressed={selectedCategory === cat.id}
                          className={`relative min-h-[88px] flex flex-col items-center justify-center gap-2 p-3 rounded-2xl text-center transition-all duration-300 ${
                            selectedCategory === cat.id
                              ? 'glass-strong ring-2 ring-primary-container shadow-lg'
                              : 'glass-subtle hover:bg-white/40'
                          }`}
                        >
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${cat.color}1f`, color: cat.color }}
                          >
                            <CategoryIcon className="w-5 h-5" />
                          </span>
                          <span className="text-xs font-semibold leading-tight">{cat.name}</span>
                          {selectedCategory === cat.id && (
                            <Check className="absolute w-4 h-4 text-primary-container top-2 right-2" />
                          )}
                        </button>
                        )
                      })}
                      {filteredCategories.length === 0 && (
                        <div className="col-span-2 sm:col-span-3 glass-subtle rounded-2xl p-5 text-center text-sm text-on-surface-variant">
                          No matching category. Use Other for custom expenses.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {currentStep === 'people' && (
                  <motion.div
                    key="people"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Split between</h3>
                      <p className="text-sm text-on-surface-variant mt-1">Choose exactly who this expense is for</p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-on-surface-variant">
                        {selectedPeople.length} of {selectedGroupMembers.length} selected
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={selectAllPeople} className="btn-ghost text-xs px-3 py-2">
                          Select all
                        </button>
                        <button type="button" onClick={clearPeople} className="btn-ghost text-xs px-3 py-2">
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {selectedGroupMembers.length > 0 ? selectedGroupMembers.map((user) => {
                        const checked = selectedPeople.includes(user.id)
                        return (
                        <label
                          key={user.id}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-primary-container ${
                            checked
                              ? 'glass-strong ring-2 ring-primary-container'
                              : 'glass-subtle hover:bg-white/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePerson(user.id)}
                            className="sr-only"
                            aria-label={`Include ${user.name} in split`}
                          />
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: user.color ?? colorFor(user.id) }}
                          >
                            {user.initials ?? initialsFor(user.name)}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {user.id === activePayerId ? `${user.name} (payer)` : user.name}
                            </p>
                            <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            checked ? 'bg-primary-container border-primary-container' : 'border-outline-variant'
                          }`}>
                            {checked && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </label>
                        )
                      }) : (
                        <div className="glass-subtle rounded-2xl p-5 text-center text-sm text-on-surface-variant">
                          No active members were found for this group.
                        </div>
                      )}
                    </div>
                    <div className="glass-subtle rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-on-surface-variant">Total</span>
                        <span className="font-bold">{formatCurrencyAmount(validAmount ? amountValue : 0, currency)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-on-surface-variant">Split between</span>
                        <span className="font-bold">{selectedPeople.length} {selectedPeople.length === 1 ? 'person' : 'people'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-on-surface-variant">Each share</span>
                        <span className="font-bold text-primary-container">{formatCurrencyAmount(splitAmount, currency)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 'summary' && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Split Summary</h3>
                      <p className="text-sm text-on-surface-variant mt-1">Review the details before splitting</p>
                    </div>
                    <div className="glass-subtle rounded-2xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-lg break-words">{title || 'Untitled expense'}</p>
                          <p className="text-xs text-on-surface-variant">
                            {selectedCategoryData?.name || 'Uncategorized'} • Today
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-gradient break-words">{formatCurrencyAmount(validAmount ? amountValue : 0, currency)}</p>
                      </div>
                      <div className="h-px bg-on-surface/5" />
                      <div className="space-y-3">
                        <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">Split Between</p>
                        <div className="space-y-2">
                          {selectedPeopleData.map((user) => (
                              <div key={user.id} className="flex items-center justify-between gap-3 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: user.color ?? colorFor(user.id) }}>
                                    {user.initials ?? initialsFor(user.name)}
                                  </div>
                                  <span className="text-sm font-medium truncate">{user.id === activePayerId ? `${user.name} (payer)` : user.name}</span>
                                </div>
                                <span className="text-sm font-bold shrink-0">{formatCurrencyAmount(splitAmount, currency)}</span>
                              </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-5 sm:p-6 pt-0 shrink-0">
              <button
                onClick={stepIndex === 0 ? resetAndClose : prevStep}
                className="btn-ghost text-sm"
              >
                {stepIndex === 0 ? 'Cancel' : 'Back'}
              </button>
              <button
                onClick={stepIndex === steps.length - 1 ? submitExpense : nextStep}
                disabled={isSubmitting || (stepIndex === steps.length - 1 && (!canContinueFromAmount || !selectedCategoryData || selectedPeople.length === 0))}
                className="btn-primary flex items-center gap-2"
              >
                {stepIndex === steps.length - 1 ? (isSubmitting ? 'Splitting...' : 'Split Expense') : 'Continue'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AddExpenseModal
