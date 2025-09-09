import * as z from 'zod';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import Tiptap from '@/components/tiptap';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  title: z.string().min(1),
  dueDate: z.date().optional(),
  priority: z.enum(['urgent', 'normal', 'non-urgent']),
  description: z.string().optional(),
  project: z.string(),
});

interface AddTaskModalProps {
  trigger?: React.ReactNode;
}

export function AddTaskModal({ trigger }: AddTaskModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  // Temporairement remplacer les données par des mock pour tester
  const projects = [
    { id: '1', title: 'Projet 1' },
    { id: '2', title: 'Projet 2' }
  ];

  const createTaskMutation = {
    mutate: (data: Record<string, unknown>) => {
      alert('Tâche créée: ' + JSON.stringify(data));
      setOpen(false);
      form.reset();
    },
    isPending: false
  };

  const createProjectMutation = {
    mutateAsync: (name: string) => Promise.resolve({ id: name }),
    isPending: false
  };

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>{t('add_task')}</Button>}
      </DialogTrigger>
      <DialogContent className="!max-w-[700px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title without label and border */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Nom de la tâche"
                      className="border-0 font-medium px-0 focus-visible:ring-0 shadow-none"
                      style={{ fontSize: '1.5rem' }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description without label */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Tiptap
                      content={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Description de la tâche..."
                      noBorder={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Controls on same line with equal height and spacing */}
            <div className="flex gap-4 items-end justify-between">
              <div className="flex gap-4 items-end">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem style={{ flexBasis: '140px' }}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-10 border-gray-200",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "MMM d")
                              ) : (
                                <span>{t('due_date')}</span>
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
                    <FormItem style={{ flexBasis: '120px' }}>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="!h-10 !min-h-[40px] border-gray-200 [&>svg]:hidden">
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
                  name="project"
                  render={({ field }) => (
                    <FormItem style={{ flexBasis: '200px' }}>
                      <FormControl>
                        <Combobox
                          items={projects.map((project) => ({
                            value: project.id,
                            label: project.title,
                          }))}
                          placeholder={t('project')}
                          searchPlaceholder={t('search_project')}
                          noItemsText={t('no_project_found')}
                          className="h-10 border-gray-200 [&>svg]:hidden"
                          popoverClassName="w-[400px]"
                          popoverAlign="start"
                          popoverSide="bottom"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                disabled={createTaskMutation.isPending || createProjectMutation.isPending}
                className="h-10 px-6"
              >
                {createTaskMutation.isPending || createProjectMutation.isPending ? t('creating...') : t('create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
