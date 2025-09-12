import { useTranslation } from 'react-i18next'

import { Task } from '@/backends/types'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface TasksListProps {
  readonly tasks: Readonly<Task[]>
  readonly selectedTask: Task | null
  readonly setSelectedTask: (task: Task | null) => void
}

const getPriorityProps = (priority: number, t: (key: string) => string) => {
  switch (priority) {
    case 3:
      return {
        label: t('priority.urgent'),
        className:
          'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400',
      }
    case 2:
      return {
        label: t('priority.normal'),
        className:
          'border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400',
      }
    case 1:
      return {
        label: t('priority.low'),
        className:
          'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      }
    default:
      return { label: t('priority.none'), className: 'text-muted-foreground' }
  }
}

const formatDate = (date: Date, t: (key: string) => string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  return new Intl.DateTimeFormat(t('locale'), options).format(date)
}

export function TasksList({
  tasks,
  selectedTask,
  setSelectedTask,
}: TasksListProps) {
  const { t } = useTranslation()

  return (
    <div className="flex w-full flex-col">
      <div className="h-full overflow-y-auto">
        <div className="space-y-1 p-2">
          <TooltipProvider delayDuration={200}>
            {tasks.map((task: Task) => {
              const { id, title, description, priority, dueDate } = task
              const isSelected = selectedTask?.id === id

              const priorityProps = getPriorityProps(priority, t)

              return (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        `group relative w-full text-left rounded-lg p-3 transition-all duration-200 ease-in-out
                        hover:bg-accent/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`,
                        isSelected
                          ? 'bg-primary/10 border border-primary/20 shadow-md'
                          : 'bg-card'
                      )}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-sm leading-tight group-hover:text-primary">
                            {title}
                          </h3>
                          {dueDate && (
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(dueDate, t)}
                            </div>
                          )}
                        </div>

                        {description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {description.split('\n')[0]}
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <Badge
                            variant="outline"
                            className={cn('text-xs', priorityProps.className)}
                          >
                            {priorityProps.label}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">
                    <p>{t('tooltip.viewTask')}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </TooltipProvider>

          {tasks.length === 0 && (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              {t('tasks.noneFound')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
