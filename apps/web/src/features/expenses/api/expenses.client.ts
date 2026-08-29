import type { InferRequestType } from 'hono/client'
import type { GroupDto } from '~features/groups/api'
import { createApiClient, unwrap, type ApiClient, type HttpClientOptions } from '~/lib/http.client'

export type CreateExpenseInput = InferRequestType<
  ApiClient['groups'][':groupId']['expenses']['$post']
>['json']

export type ExpensesClient = {
  create: (groupId: string, input: CreateExpenseInput) => Promise<GroupDto>
  delete: (groupId: string, expenseId: string) => Promise<GroupDto>
}

export const createExpensesClient = (options: HttpClientOptions = {}): ExpensesClient => {
  const http = createApiClient(options.baseUrl ?? '/api', options.fetch)
  return {
    create: async (groupId, input) =>
      unwrap(await http.groups[':groupId'].expenses.$post({ param: { groupId }, json: input })),
    delete: async (groupId, expenseId) =>
      unwrap(
        await http.groups[':groupId'].expenses[':id'].$delete({
          param: { groupId, id: expenseId }
        })
      )
  }
}

export const expensesClient: ExpensesClient = createExpensesClient()
