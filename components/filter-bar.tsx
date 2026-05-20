import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FilterOption = {
  label: string;
  value: string;
};

type FilterBarProps = {
  searchPlaceholder?: string;
  filters?: Array<{
    placeholder: string;
    options: FilterOption[];
    width?: string;
  }>;
  className?: string;
};

export function FilterBar({ searchPlaceholder = "Cari data", filters = [], className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative w-full sm:w-56">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-7" placeholder={searchPlaceholder} />
      </div>
      {filters.map((filter) => (
        <Select key={filter.placeholder}>
          <SelectTrigger className={cn("w-full sm:w-36", filter.width)}>
            <SelectValue placeholder={filter.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
