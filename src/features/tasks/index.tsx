import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'

import { Task, TaskType } from '@/backends/types'
import { tasksQueryOptions } from './data/queries'

import { useIsMobile } from '@/hooks/use-mobile'
import { useResizablePanelsFlex } from '@/hooks/use-resizable-panels-flex'
import { useSearch } from '@/context/search-context'
import { useTaskQuery } from '@/context/task-query-provider'
import { useTranslation } from 'react-i18next'

import { AddTaskModal } from './add-task-modal'
import { Button } from '@/components/ui/button'
import { FilterTaskList, FilterTaskListRef } from './FilterTaskList'
import { FontSizeSwitch } from '@/components/font-size-switch'
import { Header } from '@/components/layout/header'
import { IconX } from '@tabler/icons-react'
import { Main } from '@/components/layout/main'
import { MobileBackButton } from '@/components/mobile-back-button'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ResizeHandle } from '@/components/ui/resize-handle'
import { Search } from '@/components/search'
import { TaskDetail } from './TaskDetail'
import { TaskDetailSkeleton } from './components/task-detail-skeleton'
import { TaskListSkeleton } from './components/task-list-skeleton'
import { ThemeSwitch } from '@/components/theme-switch'

function TasksContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { taskQuery, setTaskQuery } = useTaskQuery()
  const { isSearchMode, searchResults, clearSearchMode } = useSearch()
  const isMobile = useIsMobile()

  // Get current project ID from the route
  const projectId = useMemo(() => {
    const projectMatch = location.pathname.match(/\/project\/(.+)/)
    return projectMatch ? projectMatch[1] : undefined
  }, [location.pathname])

  // Update task query context when projectId changes
  useEffect(() => {
    setTaskQuery({
      ...taskQuery,
      taskType: projectId ? TaskType.PROJECT : undefined,
      projectId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Fetch tasks with suspense
  const { data: allTasks, error } = useSuspenseQuery(tasksQueryOptions(projectId))

  // Ref for the list container to manage scroll
  const filterTaskListRef = useRef<FilterTaskListRef>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Get taskId from URL search params
  const taskId = new URLSearchParams(location.search).get('taskId')
  const showTaskOnMobile = isMobile && Boolean(taskId)

  const { leftFlex, rightFlex, handleMouseDown } = useResizablePanelsFlex({
    leftPanelKey: 'tasks-65-flex',
    rightPanelKey: 'task-detail-flex',
    defaultLeftFlex: 0.4,
    defaultRightFlex: 0.6,
    minLeftFlex: 0.15,
    minRightFlex: 0.15,
  })

  // Function to handle task selection
  const handleTaskSelection = (task: Task | null) => {
    setSelectedTask(task)
    if (isMobile && task) {
      const currentScroll = filterTaskListRef.current?.getScrollTop() || 0
      setScrollPosition(currentScroll)
      const searchParams = new URLSearchParams(location.search)
      searchParams.set('taskId', task.id.toString())
      navigate({
        to: location.pathname,
        search: Object.fromEntries(searchParams.entries()),
      })
    }
  }

  // Function to go back to the list on mobile
  const handleBackToList = () => {
    const searchParams = new URLSearchParams(location.search)
    searchParams.delete('taskId')
    navigate({
      to: location.pathname,
      search: Object.fromEntries(searchParams.entries()),
    })
  }

  // Determine which tasks to display
  const tasksToDisplay = useMemo(() => {
    return isSearchMode ? (searchResults as Task[]) || [] : allTasks
  }, [isSearchMode, searchResults, allTasks])

  // Find the selected task from the list when taskId is in the URL
  useEffect(() => {
    if (taskId && tasksToDisplay.length > 0) {
      const foundTask = tasksToDisplay.find(
        (task) => task.id.toString() === taskId
      )
      setSelectedTask(foundTask || null)
    } else if (!taskId) {
      setSelectedTask(null)
    }
  }, [taskId, tasksToDisplay])

  // Restore scroll position on mobile
  useEffect(() => {
    if (isMobile && !showTaskOnMobile && scrollPosition > 0) {
      setTimeout(() => {
        filterTaskListRef.current?.setScrollTop(scrollPosition)
        setScrollPosition(0)
      }, 100)
    }
  }, [isMobile, showTaskOnMobile, scrollPosition])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Error loading tasks</h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    )
  }

  // Mobile layout: show task detail
  if (showTaskOnMobile) {
    return (
      <>
        <Header>
          <MobileBackButton onBack={handleBackToList} />
          <div className="flex flex-1 justify-center">
            <h1 className="text-lg font-semibold truncate">
              {selectedTask?.title ?? 'Task Detail'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <FontSizeSwitch />
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Suspense fallback={<TaskDetailSkeleton />}>
          {selectedTask ? (
            <TaskDetail task={selectedTask} isMobile={true} />
          ) : (
            <TaskDetailSkeleton />
          )}
        </Suspense>
      </>
    )
  }

  // Desktop and mobile list view
  return (
    <>
      <Header>
        {isMobile && (
          <div className="flex flex-1 justify-center">
            <h1 className="text-lg font-semibold">Tasks</h1>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Search />
          <AddTaskModal />
          <FontSizeSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <div className="flex h-full w-full">
        <div
          className={`flex h-full ${isMobile ? 'w-full' : ''}`}
          style={!isMobile ? { flex: `${leftFlex} 1 0%` } : undefined}
        >
          <div className="flex w-full flex-col">
            {isSearchMode && (
              <div className="border-b border-border/40 bg-muted/30 px-4 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Search results ({tasksToDisplay.length})
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearchMode}
                    className="h-6 w-6 p-0"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <FilterTaskList
              ref={filterTaskListRef}
              tasks={tasksToDisplay}
              selectedTask={selectedTask}
              setSelectedTask={handleTaskSelection}
              onScrollEnd={() => {}} // Infinite scroll disabled for now
              isFetchingNextPage={false}
            />
          </div>
        </div>

        {!isMobile && <ResizeHandle onMouseDown={handleMouseDown} />}

        {!isMobile && (
          <div className="flex h-full" style={{ flex: `${rightFlex} 1 0%` }}>
            <Suspense fallback={<TaskDetailSkeleton />}>
              {selectedTask ? (
                <TaskDetail task={selectedTask} />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted/20">
                  <div className="text-center text-muted-foreground">
                    <h3 className="text-lg font-medium mb-2">Select a task</h3>
                    <p className="text-sm">
                      Choose a task from the list to view its details
                    </p>
                  </div>
                </div>
              )}
            </Suspense>
          </div>
        )}
      </div>
    </>
  )
}

export default function Tasks() {
  return (
    <Main>
      <Suspense fallback={<TaskListSkeleton />}>
        <TasksContent />
      </Suspense>
    </Main>
  )
}

  // Mobile layout: show task detail if taskId is in URL
  if (showTaskOnMobile && selectedTask) {
    return (
      <Main>
        <Header>
          <MobileBackButton onBack={handleBackToList} />
          <div className="flex flex-1 justify-center">
            <h1 className="text-lg font-semibold truncate">
              {selectedTask.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <FontSizeSwitch />
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <TaskDetail task={selectedTask} isMobile={true} />
      </Main>
    )
  }

  // Desktop layout and mobile list view
  return (
    <Main>
      <Header>
        {isMobile && (
          <div className="flex flex-1 justify-center">
            <h1 className="text-lg font-semibold">Tasks</h1>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Search />
          <AddTaskModal />
          <FontSizeSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <div className="flex h-full w-full">
        {/* Tasks List */}
        <div
          className={`flex h-full ${isMobile ? 'w-full' : ''}`}
          style={
            !isMobile
              ? {
                  flex: `${leftFlex} 1 0%`,
                  minWidth: '200px',
                }
              : undefined
          }
        >
          <div className="flex w-full flex-col">
            {isSearchMode && (
              <div className="border-b border-border/40 bg-muted/30 px-4 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Search results ({tasksToDisplay.length})
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearchMode}
                    className="h-6 w-6 p-0"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <FilterTaskList
              ref={filterTaskListRef}
              tasks={tasksToDisplay}
              selectedTask={selectedTask}
              setSelectedTask={handleTaskSelection}
              onScrollEnd={() => {
                if (!isSearchMode && hasNextPage && !isFetchingNextPage) {
                  fetchNextPage()
                }
              }}
              isFetchingNextPage={isFetchingNextPage}
            />
          </div>
        </div>

        {/* Resize Handle (Desktop only) */}
        {!isMobile && (
          <ResizeHandle
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Task Detail (Desktop only) */}
        {!isMobile && (
          <div
            className="flex h-full"
            style={{
              flex: `${rightFlex} 1 0%`,
              minWidth: '300px',
            }}
          >
            {selectedTask ? (
              <TaskDetail task={selectedTask} />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-muted/20">
                <div className="text-center text-muted-foreground">
                  <h3 className="text-lg font-medium mb-2">Select a task</h3>
                  <p className="text-sm">
                    Choose a task from the list to view its details
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Main>
  )
}
