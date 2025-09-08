import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import Tiptap from '@/components/tiptap';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Combobox } from '@/components/ui/combobox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import NextcloudTodo from '@/backends/nextcloud-todo/nextcloud-todo';
import { useNavigate } from '@tanstack/react-router';

const formSchema = z.object({
  title: z.string().min(1),
  dueDate: z.date().optional(),
  priority: z.enum(['urgent', 'normal', 'non-urgent']),
  description: z.string().optional(),
  project: z.string(),
});

export function AddTask() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: projects } = useSuspenseQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const backend = new NextcloudTodo();
      return backend.getProjects();
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: (newProjectName: string) => {
      const backend = new NextcloudTodo();
      return backend.createProject(newProjectName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (newTask: z.infer<typeof formSchema>) => {
      const backend = new NextcloudTodo();
      return backend.createTask(newTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate({ to: '/tasks' });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      priority: 'normal',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let projectId = values.project;
    const isNewProject = !projects.some((p) => p.id === projectId);

    if (isNewProject) {
      const newProject = await createProjectMutation.mutateAsync(projectId);
      projectId = newProject.id;
    }

    createTaskMutation.mutate({ ...values, project: projectId });
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('add_task')}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('title')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('due_date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>{t('pick_a_date')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('priority')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('priority')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="urgent">{t('urgent')}</SelectItem>
                    <SelectItem value="normal">{t('normal')}</SelectItem>
                    <SelectItem value="non-urgent">{t('non_urgent')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('description')}</FormLabel>
                <FormControl>
                  <Tiptap
                    content={field.value || ''}
                    onChange={field.onChange}
                    placeholder={t('start_writing')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="project"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('project')}</FormLabel>
                <FormControl>
                  <Combobox
                    items={projects.map((project) => ({
                      value: project.id,
                      label: project.title,
                    }))}
                    placeholder={t('select_project')}
                    searchPlaceholder={t('search_project')}
                    noItemsText={t('no_project_found')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={createTaskMutation.isPending || createProjectMutation.isPending}>
            {createTaskMutation.isPending || createProjectMutation.isPending ? t('creating...') : t('create')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
