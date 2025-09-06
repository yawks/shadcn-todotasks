export interface Backend {
  getProjects: () => Promise<Project[]>
  createProject?(name: string): Promise<Project>
  getTasks(query: TaskQuery, offset: number): Promise<Task[]>
  createTask?(task: Partial<Task>): Promise<Task>
  searchTasks(content: string): Promise<Task[]>
  setTaskCompleted?(id: string): Promise<void>
}


// New Task types
export type Project = {
  id: string
  title: string
  icon: string | null
  description: string | null
  taskCount: number
}

export type Task = {
  id: number
  project: Project | null
  title: string
  description: string | null
  priority: number
  createdAt: Date | null
  dueDate: Date | null
  completed: boolean
  completedAt: Date | null
  tags: string[] | null
}

export enum TaskType {
  PROJECT = 'project',
  ALL = 'all',
  COMPLETED = 'completed',
}

export enum TaskFilter {
  ALL = 'all',
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export type TaskQuery = {
  taskType?: TaskType
  taskFilter: TaskFilter,
  projectId?: string
}

