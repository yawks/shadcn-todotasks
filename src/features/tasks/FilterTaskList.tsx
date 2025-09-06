import { forwardRef, useImperativeHandle, useRef } from "react";

import { ItemsListLoader } from "@/components/layout/loaders/itemslist-loader";
import { Task } from "@/backends/types";
import { TasksList } from "./tasks-list";

export interface FilterTaskListRef {
    getScrollTop: () => number;
    setScrollTop: (position: number) => void;
}

interface FilterTasksProps {
    readonly tasks: Task[];
    readonly selectedTask: Task | null;
    readonly setSelectedTask: (task: Task | null) => void;
    readonly onScrollEnd: () => void;
    readonly isFetchingNextPage?: boolean;
}

export const FilterTaskList = forwardRef<FilterTaskListRef, FilterTasksProps>(
    function FilterTaskList({ tasks, selectedTask, setSelectedTask, onScrollEnd, isFetchingNextPage }, ref) {
        const scrollRef = useRef<HTMLDivElement>(null);

        // Expose methods to control scroll from parent
        useImperativeHandle(ref, () => ({
            getScrollTop: () => scrollRef.current?.scrollTop || 0,
            setScrollTop: (position: number) => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = position;
                }
            },
        }));

        const handleScroll = () => {
            if (scrollRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
                // Trigger when close to bottom (within 100px)
                if (scrollHeight - scrollTop - clientHeight < 100) {
                    onScrollEnd();
                }
            }
        };

        return (
            <div 
                ref={scrollRef}
                className="h-full overflow-y-auto"
                onScroll={handleScroll}
            >
                <TasksList 
                    tasks={tasks} 
                    selectedTask={selectedTask} 
                    setSelectedTask={setSelectedTask} 
                />
                {isFetchingNextPage && (
                    <div className="p-4">
                        <ItemsListLoader />
                    </div>
                )}
            </div>
        );
    }
);
