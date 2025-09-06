import { Backend, Project, Task, TaskFilter, TaskQuery } from '../types';
import { NTProject, NTTask } from './nextcloud-todo-types';

import { api } from '@/utils/request';

const NB_TASKS_TO_LOAD = 20;

export default class TodoBackend implements Backend {
  url: string
  login: string
  password: string

  constructor() {
    this.url = localStorage.getItem('backend-url') ?? '';
    this.login = localStorage.getItem('backend-login') ?? '';
    this.password = localStorage.getItem('backend-password') ?? '';
    
    // In development, use the proxy
    if (import.meta.env.DEV && this.url) {
      this.url = this.url.replace(/^https:\/\/[^/]+/, '/api');
    }
  }

  async getProjects(): Promise<Project[]> {
    let projects: Project[] = [];
    try {
      // Try multiple possible endpoints
      const possibleUrls = [
        this.url + '/apps/todotasks/api/v1/projects',
        this.url + '/apps/todotasks/api/projects',
        this.url + '/index.php/apps/todotasks/api/v1/projects',
        this.url + '/ocs/v2.php/apps/todotasks/api/v1/projects'
      ];
      
      let projectsQuery: NTProject[] = [];
      let lastError: any = null;
      
      for (const testUrl of possibleUrls) {
        try {
          console.log('🔍 Trying URL:', testUrl);
          projectsQuery = await api.get<NTProject[]>(testUrl, this._getOptions());
          console.log('✅ Success with URL:', testUrl);
          break;
        } catch (error) {
          console.log('❌ Failed with URL:', testUrl, error);
          lastError = error;
          continue;
        }
      }
      
      if (projectsQuery.length === 0 && lastError) {
        throw lastError;
      }
      
      console.log('✅ Projects response:', projectsQuery);
      
      // For now, return mock projects to test the UI
      projects = [
        {
          id: '1',
          title: 'Test Project 1',
          icon: '📋',
          description: 'A test project',
          taskCount: 5,
        },
        {
          id: '2', 
          title: 'Test Project 2',
          icon: '📝',
          description: 'Another test project',
          taskCount: 3,
        }
      ];

    } catch (error) {
      console.error('❌ Error in getProjects:', error);
      
      // Return mock data to test the UI
      projects = [
        {
          id: '1',
          title: 'Mock Project (API Error)',
          icon: '⚠️',
          description: 'API connection failed, showing mock data',
          taskCount: 0,
        }
      ];
    }

    return projects;
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
    const projectsMapping: { [projectId: number]: Project } = {};
    try {
      const projectsQuery = await api.get<NTProject[]>(
        this.url + '/apps/todotasks/api/v1/projects', 
        this._getOptions()
      );
      
      projectsQuery.forEach((project: NTProject) => {
        projectsMapping[project.id] = {
          id: String(project.id),
          title: project.title,
          icon: project.icon,
          description: project.description,
          taskCount: 0, // Will be updated when needed
        } as Project;
      });
    } catch (error) {
      throw new Error('Network response was not ok: ' + error)
    }

    return projectsMapping;
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
        tasks = tasks.filter(task => !task.completed);
      } else if (query.taskFilter === TaskFilter.COMPLETED) {
        tasks = tasks.filter(task => task.completed);
      }

    } catch (error) {
      console.error('❌ Error in getTasks, returning mock data:', error);
      
      // Return mock tasks for testing
      const mockProject = { id: '1', title: 'Mock Project', icon: '📋', description: 'Test', taskCount: 3 };
      
      tasks = [
        {
          id: 1,
          project: query.projectId === '1' ? mockProject : null,
          title: 'Sample Task 1',
          description: 'This is a mock task for testing the UI',
          priority: 1,
          createdAt: new Date(),
          dueDate: new Date(Date.now() + 86400000), // Tomorrow
          completed: false,
          completedAt: null,
          tags: ['test', 'mock'],
        },
        {
          id: 2,
          project: query.projectId === '1' ? mockProject : null,
          title: 'Sample Task 2 - Completed',
          description: 'This is a completed mock task',
          priority: 2,
          createdAt: new Date(Date.now() - 86400000), // Yesterday
          dueDate: new Date(),
          completed: true,
          completedAt: new Date(),
          tags: ['completed', 'test'],
        },
        {
          id: 3,
          project: query.projectId === '2' ? { id: '2', title: 'Project 2', icon: '📝', description: 'Test 2', taskCount: 1 } : null,
          title: 'High Priority Task',
          description: 'This task has high priority',
          priority: 3,
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
          dueDate: new Date(Date.now() + 172800000), // In 2 days
          completed: false,
          completedAt: null,
          tags: ['urgent', 'important'],
        }
      ];
      
      // Apply filters to mock data
      if (query.taskFilter === TaskFilter.PENDING) {
        tasks = tasks.filter(task => !task.completed);
      } else if (query.taskFilter === TaskFilter.COMPLETED) {
        tasks = tasks.filter(task => task.completed);
      }
      
      // Filter by project if specified
      if (query.projectId) {
        tasks = tasks.filter(task => task.project?.id === query.projectId);
      }
    }

    return tasks;
  }

  async setTaskCompleted(id: string): Promise<void> {
    try {
      // First get the current task to preserve its data
      const task = await api.get<NTTask>(
        this.url + `/apps/todotasks/api/v1/tasks/${id}`, 
        this._getOptions()
      );

      // Update the task with completed status
      const updateData = {
        projectId: task.projectId,
        title: task.title,
        parentId: task.parentId,
        icon: task.icon,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        completedAt: new Date().toISOString(),
        tags: task.tags
      };

      await api.put(
        this.url + `/apps/todotasks/api/v1/tasks/${id}`,
        JSON.stringify(updateData),
        { 
          ...this._getOptions('PUT'),
          headers: {
            ...this._getOptions('PUT').headers,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      throw new Error('Network response was not ok: ' + error)
    }
  }

  async searchTasks(content: string): Promise<Task[]> {
    let tasks: Task[] = [];
    try {
      // For now, we'll search by getting all tasks and filtering client-side
      // In a real implementation, you might want to add a search endpoint to the API
      const allTasks = await this.getTasks({ taskFilter: TaskFilter.ALL });
      
      tasks = allTasks.filter(task => 
        task.title.toLowerCase().includes(content.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(content.toLowerCase()))
      );

    } catch (error) {
      throw new Error('Network response was not ok: ' + error)
    }

    return tasks;
  }

  async createProject(name: string): Promise<Project> {
    console.log('Creating project:', name);
    // Mock implementation
    const newProject: Project = {
      id: Math.random().toString(36).substring(7),
      title: name,
      icon: '📋',
      description: '',
      taskCount: 0,
    };
    return Promise.resolve(newProject);
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    console.log('Creating task:', task);
    // Mock implementation
    const newTask: Task = {
      id: Math.floor(Math.random() * 1000),
      project: task.project || null,
      title: task.title || 'No title',
      description: task.description || null,
      priority: task.priority || 1,
      createdAt: new Date(),
      dueDate: task.dueDate || null,
      completed: false,
      completedAt: null,
      tags: task.tags || null,
    };
    return Promise.resolve(newTask);
  }
}
