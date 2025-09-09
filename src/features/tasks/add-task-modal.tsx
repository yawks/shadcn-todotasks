import * as z from 'zod';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isSameYear, isToday, isTomorrow } from 'date-fns';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import Tiptap from '@/components/tiptap';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import TodoBackend from '@/backends/nextcloud-todo/nextcloud-todo';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  title: z.string().min(1),
  dueDate: z.date().optional(),
  priority: z.enum(['urgent', 'normal', 'non-urgent']),
  description: z.string().optional(),
  project: z.string().optional(),
});

// Function to intelligently format dates
const formatDateSmart = (date: Date): string => {
  if (isToday(date)) {
    return "today";
  }
  if (isTomorrow(date)) {
    return "tomorrow";
  }
  
  // For other dates
  if (isSameYear(date, new Date())) {
    // Same year: display "day month"
    return format(date, "d MMM");
  } else {
    // Different year: display "day month year"
    return format(date, "d MMM yyyy");
  }
};

interface AddTaskModalProps {
  trigger?: React.ReactNode;
}

export function AddTaskModal({ trigger }: AddTaskModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const backend = new TodoBackend();
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => backend.getProjects(),
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => backend.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setOpen(false);
      form.reset();
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (projectName) => backend.createProject(projectName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      priority: 'normal',
      description: '',
      project: '',
    },
  });

  // Auto-focus sur le champ titre quand la popin s'affiche
  useEffect(() => {
    if (open && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  function priorityToNumber(priority: 'urgent' | 'normal' | 'non-urgent'): number {
    switch (priority) {
      case 'urgent': return 3;
      case 'normal': return 2;
      case 'non-urgent': return 1;
      default: return 2;
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let project: Project | null = null;
    const projectIdentifier = values.project;

    if (projectIdentifier) {
      const existingProject = projects.find((p) => p.id === projectIdentifier || p.title === projectIdentifier);

      if (existingProject) {
        project = existingProject;
      } else {
        project = await createProjectMutation.mutateAsync(projectIdentifier);
      }
    }

    const taskToCreate: Partial<Task> = {
      title: values.title,
      description: values.description,
      dueDate: values.dueDate,
      priority: priorityToNumber(values.priority),
      project: project,
    };

    createTaskMutation.mutate(taskToCreate);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>{t('add_task')}</Button>}
      </DialogTrigger>
      {/* Popin sans titre avec bordures très fines et largeur adaptée au contenu */}
      <DialogContent className="w-fit min-w-[700px] max-w-4xl border-[0.5px] border-border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Zone de saisie du titre - grande police, bold, sans cadre, focus auto */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      {...field}
                      ref={titleInputRef}
                      placeholder="Nom de la tâche"
                      className="border-0 md:text-2xl px-0 focus-visible:ring-0 shadow-none bg-transparent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Zone de saisie description - Tiptap sans cadre */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Tiptap
                      content={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Description"
                      noBorder={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row with selectors (left) and create button (right) - same height */}
            <div className="flex items-center justify-between gap-4">
              {/* Group of 3 selectors on the left */}
              <div className="flex items-center gap-3">
                
                {/* Date selector */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-36 justify-start text-left font-normal h-10 border-[0.5px]",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                formatDateSmart(field.value)
                              ) : (
                                <span>Date</span>
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
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Priority selector */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-32 h-10 border-[0.5px]">
                            <SelectValue placeholder="Priorité" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="non-urgent">Non urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Project selector */}
                <FormField
                  control={form.control}
                  name="project"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Combobox
                          items={projects.map((project) => ({
                            value: project.id,
                            label: project.title,
                          }))}
                          placeholder="Project"
                          searchPlaceholder="Search for a project..."
                          noItemsText="No project found"
                          className="w-44 h-10 border-[0.5px]"
                          popoverClassName="w-80"
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

              {/* Create button on the right */}
              <Button 
                type="submit" 
                disabled={createTaskMutation.isPending || createProjectMutation.isPending}
                className="h-10 px-6"
              >
                {createTaskMutation.isPending || createProjectMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
