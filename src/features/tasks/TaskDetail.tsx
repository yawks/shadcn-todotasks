import { IconCalendar, IconCheck, IconCircle, IconClock, IconFlag } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Task } from "@/backends/types"
import TodoBackend from "@/backends/nextcloud-todo/nextcloud-todo"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface TaskDetailProps {
    readonly task: Task
    readonly isMobile?: boolean
}

export function TaskDetail({ task, isMobile = false }: TaskDetailProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleCompleteToggle = async () => {
        if (task.completed) return; // Don't allow uncompleting for now
        
        setIsLoading(true)
        try {
            const backend = new TodoBackend()
            await backend.setTaskCompleted(task.id.toString())
            // TODO: Refresh the task list or update the task state
        } catch (error) {
            // Error handling - could show a toast notification instead
            alert('Error completing task: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
                    // Classes pour mobile : toujours visible et prend toute la place
                    'flex': isMobile,
                    // Classes pour desktop : comportement original
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
                    {/* Header */}
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
                            <h1 className={cn(
                                "text-2xl font-bold mb-2",
                                task.completed && "line-through text-muted-foreground"
                            )}>
                                {task.title}
                            </h1>
                            
                            {task.project && (
                                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                                    {task.project.icon && <span>{task.project.icon}</span>}
                                    {task.project.title}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {task.description && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-2">Description</h2>
                            <div className="prose prose-sm max-w-none">
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                    {task.description}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Priority */}
                        <div className="flex items-center gap-2">
                            <IconFlag className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Priority:</span>
                            <span className={cn("text-sm font-medium", getPriorityLabel(task.priority).color)}>
                                {getPriorityLabel(task.priority).label}
                            </span>
                        </div>

                        {/* Created date */}
                        {task.createdAt && (
                            <div className="flex items-center gap-2">
                                <IconClock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Created:</span>
                                <span className="text-sm">
                                    {formatDate(task.createdAt)}
                                </span>
                            </div>
                        )}

                        {/* Due date */}
                        {task.dueDate && (
                            <div className="flex items-center gap-2">
                                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Due:</span>
                                <span className={cn(
                                    "text-sm",
                                    task.dueDate < new Date() && !task.completed && "text-red-600 font-medium"
                                )}>
                                    {formatDate(task.dueDate)}
                                </span>
                            </div>
                        )}

                        {/* Completed date */}
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

                    {/* Tags */}
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

                    {/* Actions */}
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
