import { Backend, Project, Task, TaskFilter, TaskQuery } from '../types';
import { NTProject, NTTask } from './nextcloud-todo-types';

import { api } from '@/utils/request';

/**
 * Formats a JavaScript Date object into a 'YYYY-MM-DD HH:MM:SS' string for MySQL DATETIME columns.
 * @param date The Date object to format.
 * @returns The formatted date string.
 */
function toMySqlDateTime(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // getMonth() is 0-indexed
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const NB_TASKS_TO_LOAD = 20;

class TodoBackend implements Backend {
  url: string
  login: string
  password: string
  apiUrl: string | null = null

  constructor() {
    this.url = localStorage.getItem('backend-url') ?? ''
    this.login = localStorage.getItem('backend-login') ?? ''
    this.password = localStorage.getItem('backend-password') ?? ''

    // In development, use the proxy
    if (import.meta.env.DEV && this.url) {
      this.url = this.url.replace(/^https:\/\/[^/]+/, '/api')
    }
  }

  private async _getApiUrl(path: string): Promise<string> {
    if (this.apiUrl) {
      return this.apiUrl + path
    }

    const possibleBaseUrls = [
      this.url + '/apps/todotasks/api/v1',
      this.url + '/apps/todotasks/api',
      this.url + '/index.php/apps/todotasks/api/v1',
      this.url + '/ocs/v2.php/apps/todotasks/api/v1',
    ]

    for (const baseUrl of possibleBaseUrls) {
      try {
        await api.get<NTProject[]>(`${baseUrl}/projects`, this._getOptions())
        this.apiUrl = baseUrl
        console.log('✅ Discovered API URL:', this.apiUrl)
        return this.apiUrl + path
      } catch (error) {
        console.log('❌ Failed with base URL:', baseUrl, error)
        continue
      }
    }

    throw new Error('Could not find a valid API endpoint.')
  }

  async getProjects(): Promise<Project[]> {
    try {
      const url = await this._getApiUrl('/projects')
      const projectsQuery = await api.get<NTProject[]>(url, this._getOptions())
      return projectsQuery.map(p => ({
        id: String(p.id),
        title: p.title,
        icon: p.icon,
        description: p.description,
        taskCount: 0, // This should be calculated based on tasks
      }))
    } catch (error) {
      console.error('❌ Error in getProjects:', error)
      throw error
    }
  }

  private _getOptions(method: string = 'GET'): RequestInit {
    const headers = new Headers()
    headers.append(
      'Authorization',
      'Basic ' + btoa(this.login + ':' + this.password)
    )
    headers.append('Accept', 'application/json')
    
    // For NextCloud APIs, we might need specific headers
    if (method !== 'GET') {
      headers.append('Content-Type', 'application/json')
    }

    const requestOptions = {
      method: method,
      headers: headers,
      mode: 'cors' as RequestMode,
    }
    return requestOptions
  }

  private async _getProjectsMapping(): Promise<{ [projectId: number]: Project }> {
    const projectsMapping: { [projectId: number]: Project } = {}
    try {
      const url = await this._getApiUrl('/projects')
      const projectsQuery = await api.get<NTProject[]>(
        url,
        this._getOptions()
      )

      projectsQuery.forEach((project: NTProject) => {
        projectsMapping[project.id] = {
          id: String(project.id),
          title: project.title,
          icon: project.icon,
          description: project.description,
          taskCount: 0, // Will be updated when needed
        } as Project
      })
    } catch (error) {
      console.error('❌ Error in _getProjectsMapping:', error)
      throw error
    }

    return projectsMapping
  }

  async getTasks(query: TaskQuery, offset?: number): Promise<Task[]> {
    let tasks: Task[] = [];
    try {
      // Get all projects for creating a mapping projectId -> Project
      const projectsMapping = await this._getProjectsMapping();

      let url = this.url + '/apps/todotasks/api/v1/tasks';
      const params: { [key: string]: string } = {};
      
      if (query.projectId) {
        params['projectId'] = query.projectId;
      }

      // Handle pagination
      if (offset && offset > 0) {
        params['offset'] = String(offset);
      }
      params['limit'] = String(NB_TASKS_TO_LOAD);

      if (Object.keys(params).length > 0) {
        url += '?' + new URLSearchParams(params).toString();
      }

      const tasksQuery = await api.get<NTTask[]>(url, this._getOptions());
      
      tasks = tasksQuery.map((task: NTTask) => {
        return {
          id: task.id,
          project: projectsMapping[task.projectId] || null,
          title: task.title,
          description: task.description,
          priority: task.priority,
          createdAt: task.createdAt ? new Date(task.createdAt) : null,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          completed: Boolean(task.completedAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : null,
          tags: task.tags ? task.tags.split(',').map(tag => tag.trim()) : null,
        } as Task
      });

      // Filter tasks based on query
      if (query.taskFilter === TaskFilter.PENDING) {
        tasks = tasks.filter(task => !task.completed)
      } else if (query.taskFilter === TaskFilter.COMPLETED) {
        tasks = tasks.filter(task => task.completed)
      }
    } catch (error) {
      console.error('❌ Error in getTasks:', error)
      throw error
    }

    return tasks
  }

  async setTaskCompleted(id: string): Promise<void> {
    await this.updateTask(id, { completed: true })
  }

  async searchTasks(content: string): Promise<Task[]> {
    let tasks: Task[] = []
    try {
      // For now, we'll search by getting all tasks and filtering client-side
      // In a real implementation, you might want to add a search endpoint to the API
      const allTasks = await this.getTasks({ taskFilter: TaskFilter.ALL }, 0)

      tasks = allTasks.filter(
        task =>
          task.title.toLowerCase().includes(content.toLowerCase()) ||
          (task.description &&
            task.description.toLowerCase().includes(content.toLowerCase()))
      )
    } catch (error) {
      console.error('❌ Error in searchTasks:', error)
      throw error
    }

    return tasks
  }

  async createProject(name: string): Promise<Project> {
    const url = await this._getApiUrl('/projects')
    const projectData = { title: name }
    const newProject = await api.post<NTProject>(
      url,
      JSON.stringify(projectData),
      this._getOptions('POST')
    )
    return {
      id: String(newProject.id),
      title: newProject.title,
      icon: newProject.icon,
      description: newProject.description,
      taskCount: 0,
    }
  }

  async getProject(id: string): Promise<Project> {
    const url = await this._getApiUrl(`/projects/${id}`)
    const project = await api.get<NTProject>(url, this._getOptions())
    return {
      id: String(project.id),
      title: project.title,
      icon: project.icon,
      description: project.description,
      taskCount: 0, // Should be calculated
    }
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const url = await this._getApiUrl(`/projects/${id}`)
    const updatedProject = await api.put<NTProject>(
      url,
      JSON.stringify(data),
      this._getOptions('PUT')
    )
    return {
      id: String(updatedProject.id),
      title: updatedProject.title,
      icon: updatedProject.icon,
      description: updatedProject.description,
      taskCount: 0, // Should be calculated
    }
  }

  async deleteProject(id: string): Promise<void> {
    const url = await this._getApiUrl(`/projects/${id}`)
    await api.delete(url, this._getOptions('DELETE'))
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    if (!task.title || typeof task.title !== 'string' || task.title.trim() === '') {
      throw new Error('Task title must be a non-empty string.');
    }

    const url = await this._getApiUrl('/tasks')
    const taskData = {
      projectId: task.project ? parseInt(task.project.id, 10) : undefined,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate ? toMySqlDateTime(task.dueDate) : undefined,
      priority: task.priority,
      tags: task.tags?.join(','),
    }
    const newTask = await api.post<NTTask>(
      url,
      JSON.stringify(taskData),
      this._getOptions('POST')
    )
    return {
      id: newTask.id,
      project: task.project || null,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      createdAt: new Date(newTask.createdAt),
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null,
      completed: !!newTask.completedAt,
      completedAt: newTask.completedAt ? new Date(newTask.completedAt) : null,
      tags: newTask.tags ? newTask.tags.split(',') : [],
    }
  }

  async getTask(id: string): Promise<Task> {
    const url = await this._getApiUrl(`/tasks/${id}`)
    const task = await api.get<NTTask>(url, this._getOptions())
    // We need project mapping to get the full project info
    const projectsMapping = await this._getProjectsMapping()
    return {
      id: task.id,
      project: projectsMapping[task.projectId] || null,
      title: task.title,
      description: task.description,
      priority: task.priority,
      createdAt: new Date(task.createdAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      completed: !!task.completedAt,
      completedAt: task.completedAt ? new Date(task.completedAt) : null,
      tags: task.tags ? task.tags.split(',') : [],
    }
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    const url = await this._getApiUrl(`/tasks/${id}`)
    const projectsMapping = await this._getProjectsMapping()
    const taskData: Partial<NTTask> = {}

    if (task.title) taskData.title = task.title
    if (task.description) taskData.description = task.description
    if (task.dueDate) taskData.dueDate = toMySqlDateTime(task.dueDate)
    if (task.priority) taskData.priority = task.priority
    if (task.tags) taskData.tags = task.tags.join(',')
    if (task.completed) taskData.completedAt = new Date().toISOString()

    const updatedTask = await api.put<NTTask>(
      url,
      JSON.stringify(taskData),
      this._getOptions('PUT')
    )
    return {
      id: updatedTask.id,
      project: projectsMapping[updatedTask.projectId] || null,
      title: updatedTask.title,
      description: updatedTask.description,
      priority: updatedTask.priority,
      createdAt: new Date(updatedTask.createdAt),
      dueDate: updatedTask.dueDate ? new Date(updatedTask.dueDate) : null,
      completed: !!updatedTask.completedAt,
      completedAt: updatedTask.completedAt
        ? new Date(updatedTask.completedAt)
        : null,
      tags: updatedTask.tags ? updatedTask.tags.split(',') : [],
    }
  }

  async deleteTask(id: string): Promise<void> {
    const url = await this._getApiUrl(`/tasks/${id}`)
    await api.delete(url, this._getOptions('DELETE'))
  }

  async getTaskFiles(taskId: string): Promise<any[]> {
    const url = await this._getApiUrl(`/tasks/${taskId}/files`)
    return await api.get<any[]>(url, this._getOptions())
  }

  async addTaskFile(taskId: string, file: any): Promise<any> {
    const url = await this._getApiUrl(`/tasks/${taskId}/files`)
    // The file object should be a FormData object for multipart/form-data upload
    const options = this._getOptions('POST')
    delete options.headers['Content-Type'] // Let the browser set the correct content type with boundary
    return await api.post<any>(url, file, options)
  }

  async deleteTaskFile(taskId: string, fileId: string): Promise<void> {
    const url = await this._getApiUrl(`/tasks/${taskId}/files/${fileId}`)
    await api.delete(url, this._getOptions('DELETE'))
  }
}

const todoBackend = new TodoBackend();
export default todoBackend;
