export interface Backend {
  getProjects: () => Promise<Project[]>
  createProject?(name: string): Promise<Project>
  getProject?(id: string): Promise<Project>
  updateProject?(id: string, data: Partial<Project>): Promise<Project>
  deleteProject?(id: string): Promise<void>

  getTasks(query: TaskQuery, offset: number): Promise<Task[]>
  createTask?(task: Partial<Task>): Promise<Task>
  getTask?(id: string): Promise<Task>
  updateTask?(id: string, task: Partial<Task>): Promise<Task>
  deleteTask?(id: string): Promise<void>

  setTaskCompleted?(id: string): Promise<void>

  searchTasks(content: string): Promise<Task[]>

  getTaskFiles?(taskId: string): Promise<any[]>
  addTaskFile?(taskId: string, file: any): Promise<any>
  deleteTaskFile?(taskId: string, fileId: string): Promise<void>
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

