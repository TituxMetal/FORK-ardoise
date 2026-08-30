import type { InferRequestType } from 'hono/client'
import type { ApiClient } from '~/lib/http.client'
import type { GroupDto } from '~features/groups'

export type CreateExpenseInput = InferRequestType<
  ApiClient['groups'][':groupId']['expenses']['$post']
>['json']

export type ExpensesClient = {
  create: (groupId: string, input: CreateExpenseInput) => Promise<GroupDto>
  delete: (groupId: string, expenseId: string) => Promise<GroupDto>
}
