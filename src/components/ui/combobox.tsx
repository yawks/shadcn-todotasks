"use client"

import * as React from "react"

import { Check, ChevronsUpDown } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ComboboxProps {
  items: { value: string; label: string }[];
  placeholder: string;
  searchPlaceholder: string;
  noItemsText: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  popoverClassName?: string;
  popoverAlign?: "start" | "center" | "end";
  popoverSide?: "top" | "right" | "bottom" | "left";
}

export function Combobox({ items, placeholder, searchPlaceholder, noItemsText, value, onChange, className, popoverClassName, popoverAlign = "center", popoverSide = "bottom" }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? "" : currentValue;
    if (onChange) {
      onChange(newValue);
    }
    setOpen(false);
  };

  const filteredItems = React.useMemo(() => {
    if (!searchValue) return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [items, searchValue]);

  React.useEffect(() => {
    if (!open) {
      setSearchValue("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value
            ? items.find((item) => item.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", popoverClassName)} align={popoverAlign} side={popoverSide}>
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              <CommandItem onSelect={() => handleSelect(searchValue)}>
                {noItemsText}
              </CommandItem>
            </CommandEmpty>
            <CommandGroup>
              {filteredItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => handleSelect(item.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
