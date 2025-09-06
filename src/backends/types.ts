export interface Backend {
  getProjects: () => Promise<Project[]>
  getTasks(query: TaskQuery, offset: number): Promise<Task[]>
  searchTasks(content: string): Promise<Task[]>
  setTaskCompleted?(id: string): Promise<void>
}

export interface FeedBackendInterface {
  getFolders(): Promise<FeedFolder[]>
  getFeedItems(query: FeedQuery, offset?: number): Promise<FeedItem[]>
  searchItems(content: string): Promise<FeedItem[]>
  setFeedArticleRead?(id: string): Promise<void>
}

// Legacy Feed types (keeping for compatibility if needed)
export type FeedFolder = {
  id: string
  name: string
  unreadCount: number
  feeds: Feed[]
}

export type Feed = {
  id: string
  title: string
  unreadCount: number
  faviconUrl: string
  folderId: string
}

export type FeedItem = {
  id: number
  feed: Feed | null
  folder: FeedFolder | null
  title: string
  url: string
  pubDate: Date | null
  read: boolean
  starred: boolean
  body: string
  thumbnailUrl: string
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

// Legacy types for backward compatibility
export enum FeedType {
  FOLDER = 'folder',
  FEED = 'feed',
  STARRED = 'starred',
}

export enum FeedFilter {
  ALL = 'all',
  UNREAD = 'unread',
}

export type FeedQuery = {
  feedType?: FeedType
  feedFilter: FeedFilter,
  feedId?: string
  folderId?: string
}
