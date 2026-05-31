const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

const TOKEN_KEY = 'splitsphere.jwt'
const USER_KEY = 'splitsphere.user'

export interface ApiUser {
  id: string
  name: string
  email: string
  role?: string
  createdAt?: string
}

export interface AuthResponse {
  accessToken?: string
  token?: string
  tokenType?: string
  expiresInSeconds?: number
  user: ApiUser
}

export interface GroupResponse {
  id: string
  name: string
  description?: string | null
  inviteCode?: string
  ownerId?: string
  ownerName?: string
}

export interface GroupMemberResponse {
  id?: string
  userId?: string
  name?: string
  userName?: string
  email?: string
  role?: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface CategoryResponse {
  id: string
  name: string
  icon?: string | null
  color?: string | null
}

export interface CreateExpenseSplit {
  userId: string
  amount?: number
}

export interface CreateExpenseRequest {
  groupId?: string
  payerId: string
  title: string
  amount: number
  splitType: 'EQUAL' | 'CUSTOM'
  splits: CreateExpenseSplit[]
  categoryId?: string
  expenseDate?: string
}

export interface ExpenseSplitResponse {
  userId?: string
  userName?: string
  amount: number
  paid?: boolean
}

export interface ExpenseResponse {
  id: string
  groupId: string
  description?: string
  title?: string
  amount: number
  splitType?: string
  expenseDate?: string
  payerId?: string
  payerName?: string
  categoryId?: string
  categoryName?: string
  splits?: ExpenseSplitResponse[]
  createdAt?: string
}

export interface BalanceResponse {
  userId: string
  userName: string
  netBalance: number
}

export interface SettlementSuggestionResponse {
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  amount: number
}

export interface GroupBalanceResponse {
  groupId: string
  balances: BalanceResponse[]
  optimizedSettlements: SettlementSuggestionResponse[]
}

export interface CreateSettlementRequest {
  groupId?: string
  payerId: string
  receiverId: string
  amount: number
  note?: string
}

export interface SettlementResponse {
  id: string
  groupId: string
  payerId?: string
  payerName?: string
  receiverId?: string
  receiverName?: string
  amount: number
  status: 'PENDING' | 'PENDING_CONFIRMATION' | 'COMPLETED' | 'REJECTED' | string
  settledAt?: string | null
  createdAt?: string
}

export interface ActivityLogResponse {
  id: string
  groupId?: string
  userId?: string
  userName?: string
  action?: string
  description?: string
  createdAt?: string
}

export interface GroupAnalyticsResponse {
  groupId: string
  totalExpenses: number
  expenseCount: number
  totalSettled: number
  spendingByCategory?: Record<string, number>
}

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export const tokenStore = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: (): ApiUser | null => {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as ApiUser
    } catch {
      localStorage.removeItem(USER_KEY)
      return null
    }
  },
  setUser: (user: ApiUser) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clearUser: () => localStorage.removeItem(USER_KEY),
  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}

const authPaths = ['/', '/login', '/signup']

const handleUnauthorized = () => {
  tokenStore.clearAll()
  window.dispatchEvent(new CustomEvent('splitsphere:unauthorized'))
  if (!authPaths.includes(window.location.pathname)) {
    window.location.assign('/login')
  }
}

const readErrorMessage = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  for (const key of ['message', 'error', 'result', 'detail']) {
    if (typeof record[key] === 'string') return record[key] as string
  }
  return null
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const hasBody = options.body !== undefined && options.body !== null

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = tokenStore.getToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (response.status === 401) {
    handleUnauthorized()
  }

  if (!response.ok) {
    throw new ApiError(readErrorMessage(payload) ?? `Request failed with status ${response.status}`, response.status, payload)
  }

  return payload as T
}

export const apiBaseUrl = API_BASE_URL
