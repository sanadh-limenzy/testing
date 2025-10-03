"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface VirtualizedSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function VirtualizedSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
  className,
  disabled = false,
}: VirtualizedSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return options;
    const query = trimmedQuery.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Virtualizer configuration
  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // Estimated height of each item
    overscan: 5, // Number of items to render outside of the visible area
  });

  // Reset scroll position when filtered options change
  React.useEffect(() => {
    if (virtualizer && parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [filteredOptions, virtualizer]);

  // Force virtualizer to measure when popover opens
  React.useEffect(() => {
    if (open && virtualizer) {
      // Small delay to ensure the popover is fully rendered
      const timer = setTimeout(() => {
        virtualizer.measure();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, virtualizer]);

  // Get the selected option label
  const selectedOption = options.find((option) => option.value === value);

  // Handle option selection
  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
    setSearchQuery("");
  };

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-muted hover:bg-muted/80 h-9",
            !selectedOption && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
                autoFocus
              />
            </div>
          </div>

          {/* Virtualized List */}
          <div
            ref={parentRef}
            className="max-h-[300px] overflow-auto p-1"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <div
                key={`virtual-list-${filteredOptions.length}`}
                style={{
                  height: `${Math.max(virtualizer.getTotalSize(), 36)}px`,
                  width: "100%",
                  position: "relative",
                  minHeight: "36px",
                }}
              >
                {virtualizer.getVirtualItems().length > 0 ? (
                  virtualizer.getVirtualItems().map((virtualItem) => {
                    const option = filteredOptions[virtualItem.index];
                    const isSelected = value === option.value;

                    return (
                      <div
                        key={option.value}
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <button
                          onClick={() => handleSelect(option.value)}
                          className={cn(
                            "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                            isSelected && "bg-accent text-accent-foreground"
                          )}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{option.label}</span>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  // Fallback: show first few items if virtualizer hasn't initialized
                  filteredOptions.slice(0, 10).map((option) => {
                    const isSelected = value === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{option.label}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

