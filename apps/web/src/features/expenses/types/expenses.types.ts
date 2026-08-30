import type { InferRequestType } from 'hono/client'
import type { ApiClient } from '~/lib/http.client'
import type { Group } from '~features/groups'

export type CreateExpenseInput = InferRequestType<
  ApiClient['groups'][':groupId']['expenses']['$post']
>['json']

export type UpdateExpenseInput = InferRequestType<
  ApiClient['groups'][':groupId']['expenses'][':id']['$patch']
>['json']

export type ExpensesClient = {
  create: (groupId: string, input: CreateExpenseInput) => Promise<Group>
  update: (groupId: string, expenseId: string, input: UpdateExpenseInput) => Promise<Group>
  delete: (groupId: string, expenseId: string) => Promise<Group>
}
