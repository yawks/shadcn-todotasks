import { AddTask } from '@/features/tasks/add-task';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/tasks/add')({
  component: AddTask,
});
