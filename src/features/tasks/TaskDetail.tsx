import { IconCalendar, IconCheck, IconCircle, IconClock, IconFlag } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Task } from "@/backends/types"
import TodoBackend from "@/backends/nextcloud-todo/nextcloud-todo"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import Tiptap from "@/components/tiptap"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface TaskDetailProps {
    readonly task: Task
    readonly isMobile?: boolean
}

export function TaskDetail({ task, isMobile = false }: TaskDetailProps) {
    const [isLoading, setIsLoading] = useState(false)
    const queryClient = useQueryClient()

    const backend = useMemo(() => new TodoBackend(), [])

    const updateTask = async (field: keyof Task, value: Task[keyof Task]) => {
        await queryClient.cancelQueries({ queryKey: ['tasks'] })

        const previousTasks = queryClient.getQueryData(['tasks'])

        queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
            if (!old) return []
            return old.map(t =>
                t.id === task.id ? { ...t, [field]: value } : t
            )
        })

        try {
            await backend.updateTask(task.id.toString(), { [field]: value })
        } catch (error) {
            queryClient.setQueryData(['tasks'], previousTasks)
            toast.error(`Error updating task: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    const handleCompleteToggle = async () => {
        if (task.completed) return;

        setIsLoading(true)

        await queryClient.cancelQueries({ queryKey: ['tasks'] })

        const previousTasks = queryClient.getQueryData(['tasks'])

        queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
            if (!old) return []
            return old.map(t =>
                t.id === task.id ? { ...t, completed: true, completedAt: new Date() } : t
            )
        })

        try {
            await backend.setTaskCompleted(task.id.toString())
        } catch (error) {
            queryClient.setQueryData(['tasks'], previousTasks)
            toast.error(`Error completing task: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    const getPriorityLabel = (priority: number) => {
        switch (priority) {
            case 1: return { label: 'Low', color: 'text-yellow-600' }
            case 2: return { label: 'Medium', color: 'text-orange-600' }
            case 3: return { label: 'High', color: 'text-red-600' }
            default: return { label: 'None', color: 'text-gray-600' }
        }
    }

    return (
        <div
            className={cn(
                'flex flex-col rounded-md border bg-primary-foreground shadow-sm h-full w-full',
                {
                    'flex': isMobile,
                    'absolute inset-0 left-full z-50 hidden w-full flex-1 transition-all duration-200 sm:static sm:z-auto sm:flex': !isMobile,
                }
            )}
        >
            <div className='mb-1 flex flex-none justify-between rounded-t-md bg-secondary shadow-lg h-full relative'>
                {isLoading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="bg-background rounded-lg p-4 shadow-lg">
                            <Skeleton className="w-8 h-8 rounded-full" />
                        </div>
                    </div>
                )}
                
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="flex items-start gap-4 mb-6">
                        <button
                            onClick={handleCompleteToggle}
                            disabled={task.completed || isLoading}
                            className="flex-shrink-0 mt-1"
                        >
                            {task.completed ? (
                                <IconCheck className="h-6 w-6 text-green-500" />
                            ) : (
                                <IconCircle className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
                            )}
                        </button>
                        
                        <div className="flex-1">
                            <Input
                                defaultValue={task.title}
                                onBlur={(e) => updateTask('title', e.currentTarget.value)}
                                className={cn(
                                    "text-2xl font-bold mb-2",
                                    task.completed && "line-through text-muted-foreground"
                                )}
                            />
                            
                            {task.project && (
                                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                                    {task.project.icon && <span>{task.project.icon}</span>}
                                    {task.project.title}
                                </div>
                            )}
                        </div>
                    </div>

                    {task.description && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-2">Description</h2>
                            <Tiptap
                                content={task.description}
                                onChange={(content) => updateTask('description', content)}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <IconFlag className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Priority:</span>
                            <Select
                                defaultValue={String(task.priority)}
                                onValueChange={(value) => updateTask('priority', Number(value))}
                            >
                                <SelectTrigger className={cn("w-[120px] text-sm font-medium bg-transparent", getPriorityLabel(task.priority).color)}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">None</SelectItem>
                                    <SelectItem value="1">Low</SelectItem>
                                    <SelectItem value="2">Medium</SelectItem>
                                    <SelectItem value="3">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {task.createdAt && (
                            <div className="flex items-center gap-2">
                                <IconClock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Created:</span>
                                <span className="text-sm">
                                    {formatDate(task.createdAt)}
                                </span>
                            </div>
                        )}

                        {task.dueDate && (
                            <div className="flex items-center gap-2">
                                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Due:</span>
                                <input
                                    type="datetime-local"
                                    defaultValue={new Date(task.dueDate.getTime() - task.dueDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                    onBlur={(e) => updateTask('dueDate', new Date(e.target.value))}
                                    className={cn(
                                        "text-sm bg-transparent",
                                        task.dueDate < new Date() && !task.completed && "text-red-600 font-medium"
                                    )}
                                />
                            </div>
                        )}

                        {task.completedAt && (
                            <div className="flex items-center gap-2">
                                <IconCheck className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-muted-foreground">Completed:</span>
                                <span className="text-sm text-green-600">
                                    {formatDate(task.completedAt)}
                                </span>
                            </div>
                        )}
                    </div>

                    {task.tags && task.tags.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {task.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                        {!task.completed && (
                            <Button
                                onClick={handleCompleteToggle}
                                disabled={isLoading}
                                className="flex items-center gap-2"
                            >
                                <IconCheck className="h-4 w-4" />
                                Complete Task
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
