import { apiRequest, CreateSettlementRequest, PageResponse, SettlementResponse } from './api'

export const settlementService = {
  listByGroup: (groupId: string) =>
    apiRequest<PageResponse<SettlementResponse>>(`/api/groups/${groupId}/settlements?page=0&size=20`),

  create: async (groupId: string, body: Omit<CreateSettlementRequest, 'groupId'>) => {
    try {
      return await apiRequest<SettlementResponse>(`/api/groups/${groupId}/settlements`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    } catch {
      return apiRequest<SettlementResponse>('/api/settlements', {
        method: 'POST',
        body: JSON.stringify({ ...body, groupId }),
      })
    }
  },

  complete: (settlementId: string) =>
    apiRequest<SettlementResponse>(`/api/settlements/${settlementId}/complete`, {
      method: 'PATCH',
    }),

  reject: (settlementId: string) =>
    apiRequest<SettlementResponse>(`/api/settlements/${settlementId}/reject`, {
      method: 'POST',
    }),
}
