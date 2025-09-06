import { FilterTaskList, FilterTaskListRef } from './FilterTaskList'
import { Task, TaskType } from '@/backends/types'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { FontSizeSwitch } from '@/components/font-size-switch'
import { Header } from '@/components/layout/header'
import { IconX } from '@tabler/icons-react'
import { ItemsListLoader } from '@/components/layout/loaders/itemslist-loader'
import { Main } from '@/components/layout/main'
import { MobileBackButton } from '@/components/mobile-back-button'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ResizeHandle } from '@/components/ui/resize-handle'
import { Search } from '@/components/search'
import { TaskDetail } from './TaskDetail'
import { ThemeSwitch } from '@/components/theme-switch'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useIsMobile } from '@/hooks/use-mobile'
import { useResizablePanelsFlex } from '@/hooks/use-resizable-panels-flex'
import { useSearch } from '@/context/search-context'
import { useTaskQuery } from '@/context/task-query-provider'

export default function Tasks() {
  const location = useLocation();
  const navigate = useNavigate();
  const { taskQuery, setTaskQuery } = useTaskQuery()
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isSearchMode, searchResults, clearSearchMode } = useSearch()
  const isMobile = useIsMobile()

  // Ref for the list container to manage scroll
  const filterTaskListRef = useRef<FilterTaskListRef>(null)

  // State to store scroll position
  const [scrollPosition, setScrollPosition] = useState(0)

  // Get taskId from URL search params
  const taskId = new URLSearchParams(location.search).get('taskId')

  // Check if we are displaying a task via the URL (taskId parameter)
  // On mobile, show the task if taskId is present in the URL
  const showTaskOnMobile = isMobile && Boolean(taskId)

  // Hook to manage resizable panels (desktop only)
  const {
    leftFlex,
    rightFlex,
    handleMouseDown
  } = useResizablePanelsFlex({
    leftPanelKey: 'tasks-65-flex',
    rightPanelKey: 'task-detail-flex',
    defaultLeftFlex: 0.4,
    defaultRightFlex: 0.6,
    minLeftFlex: 0.15,
    minRightFlex: 0.15
  })

  useEffect(() => {
    // Check if we're on a project route (URL contains /project/)
    const projectMatch = location.pathname.match(/\/project\/(.+)/)
    if (projectMatch) {
      const projectId = projectMatch[1]
      setTaskQuery({
        taskFilter: taskQuery.taskFilter,
        taskType: TaskType.PROJECT,
        projectId: projectId,
      })
    } else {
      // Case for "All tasks" (route /)
      setTaskQuery({
        taskFilter: taskQuery.taskFilter,
        taskType: undefined, // All tasks, no specific type
        projectId: undefined
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Function to handle task selection (desktop and mobile)
  const handleTaskSelection = (task: Task | null) => {
    setSelectedTask(task)

    if (isMobile && task) {
      // Save the scroll position before navigating
      const currentScroll = filterTaskListRef.current?.getScrollTop() || 0
      setScrollPosition(currentScroll)

      // Navigate to task with taskId in search params
      const searchParams = new URLSearchParams(location.search)
      searchParams.set('taskId', task.id.toString())

      navigate({
        to: location.pathname,
        search: Object.fromEntries(searchParams.entries())
      })
    }
  }

  // Function to go back to the list on mobile
  const handleBackToList = () => {
    // Remove the taskId from the URL to go back to the list
    const searchParams = new URLSearchParams(location.search)
    searchParams.delete('taskId')

    navigate({
      to: location.pathname,
      search: Object.fromEntries(searchParams.entries())
    })
  }

  // Infinite query to load tasks by page
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['tasks', taskQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const backend = new (await import('@/backends/nextcloud-todo/nextcloud-todo')).default();
      return backend.getTasks(taskQuery, pageParam);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: Task[], _allPages: Task[][]) => {
      // lastPage is the array of returned tasks
      return lastPage.length === 20 ? _allPages.flat().length : undefined;
    },
    enabled: !isSearchMode, // Don't run this query when in search mode
  })

  // All tasks from all pages
  const allTasks = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data?.pages]);

  // Tasks to display (search results or regular tasks)
  const tasksToDisplay = useMemo(() => {
    return isSearchMode ? (searchResults as Task[]) || [] : allTasks;
  }, [isSearchMode, searchResults, allTasks]);

  // Find the selected task from the displayed tasks or from URL
  useEffect(() => {
    if (taskId && tasksToDisplay.length > 0) {
      const foundTask = tasksToDisplay.find(task => task.id.toString() === taskId)
      if (foundTask) {
        setSelectedTask(foundTask)
      }
    }
  }, [taskId, tasksToDisplay])

  // Restore scroll position on mobile when coming back from task detail
  useEffect(() => {
    if (isMobile && !showTaskOnMobile && scrollPosition > 0) {
      setTimeout(() => {
        filterTaskListRef.current?.setScrollTop(scrollPosition)
        setScrollPosition(0)
      }, 100)
    }
  }, [isMobile, showTaskOnMobile, scrollPosition])

  if (isLoading) {
    return (
      <Main>
        <ItemsListLoader />
      </Main>
    )
  }

  if (error) {
    return (
      <Main>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Error loading tasks</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
        </div>
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
          <Button onClick={() => navigate({ to: '/tasks/add' })}>{t('add_task')}</Button>
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
