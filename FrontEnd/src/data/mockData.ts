// ── Mock Data for SplitSphere ──

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  initials: string
  color: string
}

export interface Group {
  id: string
  name: string
  description: string
  members: User[]
  totalExpenses: number
  balance: number
  icon: string
  color: string
  recentActivity: string
}

export interface Expense {
  id: string
  title: string
  amount: number
  category: string
  date: string
  paidBy: User
  splitWith: User[]
  groupId: string
  groupName: string
  icon: string
}

export interface Settlement {
  id: string
  from: User
  to: User
  amount: number
  groupName: string
  status: 'pending' | 'completed' | 'overdue'
  dueDate: string
  originalTransactions: number
}

export interface Activity {
  id: string
  type: 'expense' | 'settlement' | 'group' | 'payment'
  title: string
  description: string
  amount?: number
  timestamp: string
  user: User
  icon: string
}

export const currentUser: User = {
  id: 'u1',
  name: 'Alex Morgan',
  email: 'alex@splitsphere.io',
  avatar: '',
  initials: 'AM',
  color: '#10b981',
}

export const users: User[] = [
  currentUser,
  { id: 'u2', name: 'Sarah Chen', email: 'sarah@email.com', avatar: '', initials: 'SC', color: '#06b6d4' },
  { id: 'u3', name: 'Marcus Johnson', email: 'marcus@email.com', avatar: '', initials: 'MJ', color: '#a855f7' },
  { id: 'u4', name: 'Priya Patel', email: 'priya@email.com', avatar: '', initials: 'PP', color: '#f59e0b' },
  { id: 'u5', name: 'Jake Wilson', email: 'jake@email.com', avatar: '', initials: 'JW', color: '#ef4444' },
  { id: 'u6', name: 'Emma Davis', email: 'emma@email.com', avatar: '', initials: 'ED', color: '#8b5cf6' },
]

export const groups: Group[] = [
  {
    id: 'g1',
    name: 'Penthouse 4B',
    description: 'Rent, Wifi & Groceries',
    members: [users[0], users[1], users[2], users[3]],
    totalExpenses: 4580.00,
    balance: 342.50,
    icon: '🏠',
    color: '#10b981',
    recentActivity: '2 hours ago',
  },
  {
    id: 'g2',
    name: 'Road Trip 2024',
    description: 'Gas, Snacks & Hotels',
    members: [users[0], users[1], users[4]],
    totalExpenses: 1245.80,
    balance: -89.20,
    icon: '🚗',
    color: '#06b6d4',
    recentActivity: '5 hours ago',
  },
  {
    id: 'g3',
    name: 'Dinner Club',
    description: 'Weekly Sushi Nights',
    members: [users[0], users[2], users[3], users[5]],
    totalExpenses: 892.40,
    balance: 156.00,
    icon: '🍽️',
    color: '#a855f7',
    recentActivity: '1 day ago',
  },
  {
    id: 'g4',
    name: 'Study Squad',
    description: 'Textbooks & Supplies',
    members: [users[0], users[1], users[5]],
    totalExpenses: 320.00,
    balance: -45.00,
    icon: '📚',
    color: '#f59e0b',
    recentActivity: '3 days ago',
  },
]

export const expenses: Expense[] = [
  {
    id: 'e1', title: 'Dinner at Sunset Grill', amount: 145.00, category: 'Food & Drink',
    date: '2024-03-15', paidBy: users[0], splitWith: [users[1], users[2], users[3]],
    groupId: 'g3', groupName: 'Dinner Club', icon: '🍽️',
  },
  {
    id: 'e2', title: 'Monthly Rent - March', amount: 1200.00, category: 'Housing',
    date: '2024-03-01', paidBy: users[1], splitWith: [users[0], users[2], users[3]],
    groupId: 'g1', groupName: 'Penthouse 4B', icon: '🏠',
  },
  {
    id: 'e3', title: 'Groceries - Whole Foods', amount: 82.15, category: 'Groceries',
    date: '2024-03-14', paidBy: users[0], splitWith: [users[1], users[2]],
    groupId: 'g1', groupName: 'Penthouse 4B', icon: '🛒',
  },
  {
    id: 'e4', title: 'Gas Station Fill-up', amount: 65.00, category: 'Transport',
    date: '2024-03-12', paidBy: users[4], splitWith: [users[0], users[1]],
    groupId: 'g2', groupName: 'Road Trip 2024', icon: '⛽',
  },
  {
    id: 'e5', title: 'Hotel - Night 2', amount: 189.00, category: 'Accommodation',
    date: '2024-03-11', paidBy: users[0], splitWith: [users[1], users[4]],
    groupId: 'g2', groupName: 'Road Trip 2024', icon: '🏨',
  },
  {
    id: 'e6', title: 'Concert Tickets', amount: 150.00, category: 'Entertainment',
    date: '2024-03-10', paidBy: users[2], splitWith: [users[0], users[3]],
    groupId: 'g3', groupName: 'Dinner Club', icon: '🎵',
  },
  {
    id: 'e7', title: 'Wifi Bill - March', amount: 59.99, category: 'Utilities',
    date: '2024-03-05', paidBy: users[3], splitWith: [users[0], users[1], users[2]],
    groupId: 'g1', groupName: 'Penthouse 4B', icon: '📡',
  },
  {
    id: 'e8', title: 'Coffee Run', amount: 24.50, category: 'Food & Drink',
    date: '2024-03-15', paidBy: users[0], splitWith: [users[1]],
    groupId: 'g1', groupName: 'Penthouse 4B', icon: '☕',
  },
]

export const settlements: Settlement[] = [
  {
    id: 's1', from: users[0], to: users[1], amount: 342.50,
    groupName: 'Penthouse 4B', status: 'pending', dueDate: '2024-03-20', originalTransactions: 5,
  },
  {
    id: 's2', from: users[2], to: users[0], amount: 89.20,
    groupName: 'Road Trip 2024', status: 'pending', dueDate: '2024-03-22', originalTransactions: 3,
  },
  {
    id: 's3', from: users[3], to: users[0], amount: 156.00,
    groupName: 'Dinner Club', status: 'pending', dueDate: '2024-03-18', originalTransactions: 4,
  },
  {
    id: 's4', from: users[0], to: users[4], amount: 45.00,
    groupName: 'Road Trip 2024', status: 'completed', dueDate: '2024-03-10', originalTransactions: 2,
  },
  {
    id: 's5', from: users[5], to: users[0], amount: 78.30,
    groupName: 'Study Squad', status: 'overdue', dueDate: '2024-03-05', originalTransactions: 3,
  },
]

export const activities: Activity[] = [
  {
    id: 'a1', type: 'expense', title: 'Dinner at Sunset Grill',
    description: 'You paid $145.00 and split with 3 others',
    amount: 145.00, timestamp: '2 hours ago', user: users[0], icon: '🍽️',
  },
  {
    id: 'a2', type: 'payment', title: 'Payment Received',
    description: 'Jake Wilson paid you $45.00',
    amount: 45.00, timestamp: '5 hours ago', user: users[4], icon: '💸',
  },
  {
    id: 'a3', type: 'expense', title: 'Groceries - Whole Foods',
    description: 'You paid $82.15 and split with Sarah, Marcus',
    amount: 82.15, timestamp: '1 day ago', user: users[0], icon: '🛒',
  },
  {
    id: 'a4', type: 'group', title: 'New Group Created',
    description: 'Study Squad was created with 3 members',
    timestamp: '2 days ago', user: users[0], icon: '📚',
  },
  {
    id: 'a5', type: 'settlement', title: 'Settlement Completed',
    description: 'Marcus settled $89.20 with you',
    amount: 89.20, timestamp: '3 days ago', user: users[2], icon: '✅',
  },
  {
    id: 'a6', type: 'expense', title: 'Gas Station Fill-up',
    description: 'Jake paid $65.00 and split with you, Sarah',
    amount: 65.00, timestamp: '4 days ago', user: users[4], icon: '⛽',
  },
  {
    id: 'a7', type: 'expense', title: 'Concert Tickets',
    description: 'Marcus paid $150.00 and split with you, Priya',
    amount: 150.00, timestamp: '5 days ago', user: users[2], icon: '🎵',
  },
  {
    id: 'a8', type: 'payment', title: 'Payment Sent',
    description: 'You paid Sarah $120.00',
    amount: 120.00, timestamp: '1 week ago', user: users[1], icon: '💳',
  },
]

export const spendingTrends = [
  { day: 'Mon', amount: 45 },
  { day: 'Tue', amount: 82 },
  { day: 'Wed', amount: 25 },
  { day: 'Thu', amount: 150 },
  { day: 'Fri', amount: 65 },
  { day: 'Sat', amount: 189 },
  { day: 'Sun', amount: 145 },
]

export const monthlySpending = [
  { month: 'Jan', food: 320, transport: 145, housing: 1200, entertainment: 89, utilities: 60 },
  { month: 'Feb', food: 280, transport: 120, housing: 1200, entertainment: 150, utilities: 58 },
  { month: 'Mar', food: 410, transport: 195, housing: 1200, entertainment: 200, utilities: 60 },
  { month: 'Apr', food: 350, transport: 110, housing: 1200, entertainment: 95, utilities: 62 },
  { month: 'May', food: 390, transport: 165, housing: 1200, entertainment: 180, utilities: 59 },
  { month: 'Jun', food: 445, transport: 200, housing: 1200, entertainment: 240, utilities: 61 },
]

export const categoryBreakdown = [
  { name: 'Food & Drink', value: 445, color: '#10b981' },
  { name: 'Housing', value: 1200, color: '#06b6d4' },
  { name: 'Transport', value: 200, color: '#a855f7' },
  { name: 'Entertainment', value: 240, color: '#f59e0b' },
  { name: 'Utilities', value: 61, color: '#ef4444' },
  { name: 'Groceries', value: 180, color: '#8b5cf6' },
]

export const categories = [
  { id: 'food', name: 'Food & Drink', icon: '🍽️', color: '#10b981' },
  { id: 'housing', name: 'Housing', icon: '🏠', color: '#06b6d4' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#a855f7' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎵', color: '#f59e0b' },
  { id: 'utilities', name: 'Utilities', icon: '📡', color: '#ef4444' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#8b5cf6' },
  { id: 'other', name: 'Other', icon: '📦', color: '#6b7280' },
]
