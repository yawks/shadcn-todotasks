import { IconCheck, IconCircle } from '@tabler/icons-react';

import { Task } from '@/backends/types';
import { timeSinceShort } from '@/lib/utils';

interface TasksListProps {
  readonly tasks: Readonly<Task[]>;
  readonly selectedTask: Task | null;
  readonly setSelectedTask: (task: Task | null) => void;
}

function getTitleColor(isSelected: boolean, isCompleted: boolean): string {
  if (isSelected) return 'text-primary';
  if (isCompleted) return 'text-muted-foreground line-through';
  return 'text-foreground';
}

export function TasksList({ tasks, selectedTask, setSelectedTask }: TasksListProps) {
  return (
    <div className="flex w-full flex-col border-r border-border/40">
      <div className="h-full overflow-y-auto">
        <div className="space-y-1 p-2">
          {tasks.map((task: Task) => {
            const { id, title, project, createdAt, priority } = task;
            const isSelected = selectedTask?.id === id;
            const isCompleted = task.completed;

            return (
              <div key={id} className="relative">
                <button
                  className={`
                    group relative w-full text-left rounded-lg p-3 transition-all duration-200 ease-in-out
                    hover:bg-accent/60 hover:shadow-sm hover:scale-[1.02]
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                    ${isSelected
                      ? 'bg-primary/10 border border-primary/20 shadow-md'
                      : 'bg-background/50 border border-transparent'
                    }
                  `}
                  onClick={() => setSelectedTask(task)}
                >
                  {/* Priority indicator */}
                  {priority > 0 && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                      priority === 1 ? 'bg-yellow-400' :
                      priority === 2 ? 'bg-orange-400' :
                      priority === 3 ? 'bg-red-400' : 'bg-gray-400'
                    }`} />
                  )}

                  <div className="flex items-center gap-3">
                    {/* Completion status */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <IconCheck className="h-5 w-5 text-green-500" />
                      ) : (
                        <IconCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <h3 className={`
                        font-medium text-sm leading-tight mb-1 group-hover:text-primary transition-colors
                        ${getTitleColor(isSelected, isCompleted)}
                      `}>
                        {title}
                      </h3>

                      {/* Metadata */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {project && (
                          <span className="bg-secondary px-2 py-0.5 rounded-full">
                            {project.title}
                          </span>
                        )}
                        {createdAt && (
                          <span>
                            {timeSinceShort(createdAt.getTime())}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}

          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No tasks found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
