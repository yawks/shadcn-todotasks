import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

import { IconChecklist } from '@tabler/icons-react'
import React from 'react'
import { Task } from '@/backends/types'
import todoBackend from '@/backends/nextcloud-todo/nextcloud-todo'
import { timeSince } from '@/lib/utils'
import { useSearch } from '@/context/search-context'

export function SearchDialog() {
  const {
    open,
    setOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    searchError,
    setSearchError,
    setIsSearchMode,
  } = useSearch()

  // Debounced search effect
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true)
        setSearchError(null)
              const results = await todoBackend.searchTasks(searchQuery)
        setSearchResults(results)
      } catch (error) {
        setSearchResults([])
        setSearchError(error instanceof Error ? error.message : 'Search failed')
      } finally {
        setIsSearching(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, backend, setSearchResults, setIsSearching, setSearchError])

  // Reset search when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setSearchResults([])
      setIsSearching(false)
      setSearchError(null)
    }
  }, [open, setSearchQuery, setSearchResults, setIsSearching, setSearchError])

  const handleItemSelect = (_item: Task) => {
    // Close the search dialog
    setOpen(false)

    // Enable search mode to show search results in the main feed view
    setIsSearchMode(true)

    // For tasks, we could navigate to the task detail or just close the search
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search Tasks"
      description="Search through your tasks"
    >
      <CommandInput
        placeholder="Search tasks..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {!searchQuery.trim() && !isSearching && (
          <CommandEmpty>Start typing to search tasks...</CommandEmpty>
        )}

        {isSearching && (
          <CommandEmpty>Searching...</CommandEmpty>
        )}

        {searchError && (
          <CommandEmpty className="text-destructive">
            Error: {searchError}
          </CommandEmpty>
        )}

        {searchQuery.trim() && !isSearching && !searchError && searchResults.length === 0 && (
          <CommandEmpty>No tasks found.</CommandEmpty>
        )}

        {searchResults.length > 0 && (
          <CommandGroup heading="Tasks">
            {searchResults.map((item) => {
              const task = item as Task;
              return (
                <CommandItem
                  key={task.id}
                  value={`${task.title} ${task.project?.title || ''}`}
                  onSelect={() => handleItemSelect(task)}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-md overflow-hidden bg-muted/50 ring-1 ring-border/10 flex items-center justify-center">
                    <IconChecklist className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="font-medium leading-tight line-clamp-2 text-foreground">
                      {task.title}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {task.project?.title && (
                        <>
                          <span className="font-medium truncate">{task.project.title}</span>
                          <span className="text-muted-foreground/60">•</span>
                        </>
                      )}
                      <time className="whitespace-nowrap">
                        {timeSince(task.createdAt?.getTime() ?? 0)}
                      </time>
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
