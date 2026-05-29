import {
  ActivityLogResponse,
  apiRequest,
  GroupAnalyticsResponse,
  GroupBalanceResponse,
  GroupMemberResponse,
  GroupResponse,
  PageResponse,
  SettlementSuggestionResponse,
} from './api'

export const groupService = {
  list: () => apiRequest<GroupResponse[]>('/api/groups'),

  get: (groupId: string) => apiRequest<GroupResponse>(`/api/groups/${groupId}`),

  create: (body: { name: string; description?: string }) =>
    apiRequest<GroupResponse>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  join: (inviteCode: string) =>
    apiRequest<GroupResponse>('/api/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    }),

  members: (groupId: string) => apiRequest<GroupMemberResponse[]>(`/api/groups/${groupId}/members`),

  balances: (groupId: string) => apiRequest<GroupBalanceResponse>(`/api/groups/${groupId}/balances`),

  settlementSuggestions: (groupId: string) =>
    apiRequest<SettlementSuggestionResponse[]>(`/api/groups/${groupId}/settlement-suggestions`).then((result) =>
      Array.isArray(result) ? result : [result]
    ),

  activity: (groupId: string) => apiRequest<PageResponse<ActivityLogResponse>>(`/api/groups/${groupId}/activity?page=0&size=20`),

  analytics: (groupId: string) => apiRequest<GroupAnalyticsResponse>(`/api/groups/${groupId}/analytics`),
}
