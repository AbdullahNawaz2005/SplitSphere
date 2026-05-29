import { apiRequest, CategoryResponse, CreateExpenseRequest, ExpenseResponse, PageResponse } from './api'

export const expenseService = {
  categories: () => apiRequest<CategoryResponse[]>('/api/categories'),

  listByGroup: (groupId: string) =>
    apiRequest<PageResponse<ExpenseResponse>>(`/api/groups/${groupId}/expenses?page=0&size=20`),

  create: async (groupId: string, body: Omit<CreateExpenseRequest, 'groupId'>) => {
    try {
      return await apiRequest<ExpenseResponse>(`/api/groups/${groupId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    } catch (error) {
      return apiRequest<ExpenseResponse>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ ...body, groupId }),
      })
    }
  },
}
