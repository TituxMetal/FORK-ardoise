import { createApiClient, unwrap, type HttpClientOptions } from '~/lib/http.client'
import type { ExpensesClient } from '../types/expenses.dto'

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
