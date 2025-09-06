import { TaskFilter, TaskQuery } from '@/backends/types'
import { createContext, useContext, useState } from 'react'

type TaskQueryContextType = {
    taskQuery: TaskQuery
    setTaskQuery: (v: TaskQuery) => void
}

const TaskQueryContext = createContext<TaskQueryContextType | undefined>(undefined)

export function TaskQueryProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const initialQuery: TaskQuery = {
        taskType: undefined,
        taskFilter: TaskFilter.ALL,
        projectId: undefined,
    }
    const [taskQuery, setTaskQuery] = useState(initialQuery)

    return (
        <TaskQueryContext.Provider value={{ taskQuery: taskQuery, setTaskQuery: setTaskQuery }}>
            {children}
        </TaskQueryContext.Provider>
    )
}

export function useTaskQuery() {
    const ctx = useContext(TaskQueryContext)
    if (!ctx) throw new Error('useTaskQuery must be used within TaskQueryProvider')
    return ctx
}
