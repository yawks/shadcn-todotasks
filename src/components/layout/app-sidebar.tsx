import { IconCheckbox, IconChecklist, IconListDetails } from '@tabler/icons-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { TaskFilter, TaskType } from '@/backends/types'

import { Button } from '../ui/button'
import { ProjectsNavGroup } from './projects-nav-group'
import { useNavigate } from '@tanstack/react-router'
import { useSearch } from '@/context/search-context'
import { useTaskQuery } from '@/context/task-query-provider'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { taskQuery, setTaskQuery } = useTaskQuery()
  const navigate = useNavigate()
  const { isSearchMode } = useSearch()

  const toggleTaskQueryButton = (taskFilter?: TaskFilter, taskType?: TaskType) => {
    // do not allow changing filters in search mode
    if (isSearchMode) return;
    
    let projectId = taskQuery.projectId;
    let filter = taskFilter ?? taskQuery.taskFilter;
    let type = taskType ?? taskQuery.taskType;
    
    if (taskType == TaskType.COMPLETED) {
      // for completed tasks, we force the filter to COMPLETED and remove the project constraint
      filter = TaskFilter.COMPLETED;
      projectId = undefined;
    } else if (taskFilter !== undefined && taskType === undefined && taskQuery.taskType === TaskType.COMPLETED) {
      // if we are changing the filter from ALL to PENDING (or vice versa)
      // and we were in COMPLETED mode, we reset the type to exit COMPLETED mode
      type = undefined;
    }
    
    setTaskQuery({
      taskFilter: filter,
      taskType: type,
      projectId: projectId,
    })

    // Then navigate if necessary for completed tasks
    if (taskType == TaskType.COMPLETED) {
      navigate({ to: '/' });
    }
  }

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
      </SidebarHeader>
      <SidebarContent>
        <ProjectsNavGroup />

        <SidebarGroup>
          <SidebarGroupLabel>Filters</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={isSearchMode ? 'Filtering disabled during search' : 'All tasks'}>
                <Button 
                  onClick={() => {
                    toggleTaskQueryButton(TaskFilter.ALL)
                  }}
                  disabled={isSearchMode}
                  className={`bg-transparent hover:bg-transparent justify-start text-secondary-foreground ${isSearchMode ? 'opacity-50 cursor-not-allowed hover:text-secondary-foreground' : 'hover:text-blue-500'}`}>
                  <IconListDetails className={!isSearchMode && taskQuery.taskType != TaskType.COMPLETED && taskQuery.taskFilter == TaskFilter.ALL ? 'text-blue-500' : ''} />
                  <span className={`text-xs ${!isSearchMode && taskQuery.taskType != TaskType.COMPLETED && taskQuery.taskFilter == TaskFilter.ALL ? 'font-bold text-blue-500' : null}`}>All tasks</span>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={isSearchMode ? 'Filtering disabled during search' : 'Pending tasks'}>
                <Button 
                  onClick={() => {
                    toggleTaskQueryButton(TaskFilter.PENDING)
                  }} 
                  disabled={isSearchMode}
                  className={`bg-transparent hover:bg-transparent justify-start text-secondary-foreground ${isSearchMode ? 'opacity-50 cursor-not-allowed hover:text-secondary-foreground' : 'hover:text-blue-500'}`}>
                  <IconChecklist className={!isSearchMode && taskQuery.taskType != TaskType.COMPLETED && taskQuery.taskFilter == TaskFilter.PENDING ? 'text-blue-500' : ''} />
                  <span className={`text-xs ${!isSearchMode && taskQuery.taskType != TaskType.COMPLETED && taskQuery.taskFilter == TaskFilter.PENDING ? 'font-bold text-blue-500' : null}`}>Pending</span>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={isSearchMode ? 'Filtering disabled during search' : 'Completed tasks'}>
                <Button 
                  onClick={() => {
                    toggleTaskQueryButton(undefined, TaskType.COMPLETED)
                  }} 
                  disabled={isSearchMode}
                  className={`bg-transparent hover:bg-transparent justify-start text-secondary-foreground ${isSearchMode ? 'opacity-50 cursor-not-allowed hover:text-secondary-foreground' : 'hover:text-blue-500'}`}>
                  <IconCheckbox className={!isSearchMode && taskQuery.taskType == TaskType.COMPLETED ? 'text-blue-500' : ''} />
                  <span className={`text-xs ${!isSearchMode && taskQuery.taskType == TaskType.COMPLETED ? 'font-bold text-blue-500' : null}`}>Completed</span>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
    </Sidebar >
  )
}
