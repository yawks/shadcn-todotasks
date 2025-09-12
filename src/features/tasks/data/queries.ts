import { queryOptions } from '@tanstack/react-query'

import { Task, TaskFilter } from '@/backends/types'
import TodoBackend from '@/backends/nextcloud-todo/nextcloud-todo'

const todoBackend = new TodoBackend()

// Priorities: 3 = Urgent, 2 = Normal, 1 = Low
const priorityOrder: { [key: number]: number } = {
  3: 3, // Urgent
  2: 2, // Normal
  1: 1, // Low
  0: 0, // None
}

const sortTasks = (tasks: Task[]): Task[] => {
  return tasks.sort((a, b) => {
    // Sort by due date (oldest first)
    if (a.dueDate && b.dueDate) {
      const dateA = new Date(a.dueDate).getTime()
      const dateB = new Date(b.dueDate).getTime()
      if (dateA !== dateB) {
        return dateA - dateB
      }
    }
    if (a.dueDate && !b.dueDate) return -1
    if (!a.dueDate && b.dueDate) return 1

    // Then by priority (highest first)
    const priorityA = priorityOrder[a.priority] || 0
    const priorityB = priorityOrder[b.priority] || 0
    if (priorityA !== priorityB) {
      return priorityB - priorityA
    }

    return 0
  })
}

export const tasksQueryOptions = (projectId?: string) =>
  queryOptions({
    queryKey: ['tasks', { projectId: projectId ?? 'all' }],
    queryFn: async () => {
      const tasks = await todoBackend.getTasks(
        {
          taskFilter: TaskFilter.PENDING,
          projectId: projectId,
        },
        0
      )
      return sortTasks(tasks)
    },
  })
