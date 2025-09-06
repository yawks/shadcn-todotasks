// Types for Nextcloud TodoTasks API

export interface NTProject {
  id: number
  title: string
  icon: string | null
  description: string | null
  userId: string
}

export interface NTProjects {
  projects: NTProject[]
}

export interface NTTask {
  id: number
  projectId: number
  parentId: number | null
  title: string
  icon: string | null
  description: string | null
  priority: number
  createdAt: string
  dueDate: string | null
  completedAt: string | null
  tags: string | null
  userId: string
}

export interface NTTasks {
  tasks: NTTask[]
}

export interface NTSearchResult {
  tasks: NTTask[]
}
