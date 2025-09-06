import Tasks from '@/features/tasks'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/project/$projectId')({
  component: Tasks,
})
