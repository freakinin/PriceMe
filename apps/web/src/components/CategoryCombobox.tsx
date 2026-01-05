import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CategoryComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  existingCategories: string[];
  onCreateCategory?: (category: string) => void;
  className?: string;
}

export function CategoryCombobox({
  value,
  onChange,
  existingCategories,
  onCreateCategory,
  className,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter categories based on input
  const filteredCategories = existingCategories.filter((cat) =>
    cat.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Check if input matches an existing category exactly
  const exactMatch = existingCategories.some(
    (cat) => cat.toLowerCase() === inputValue.toLowerCase()
  );

  // Check if we should show "Create" option
  const showCreateOption = inputValue.trim() && !exactMatch;

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSelect = (category: string) => {
    onChange(category);
    setInputValue('');
    setOpen(false);
  };

  const handleCreate = () => {
    const newCategory = inputValue.trim();
    if (newCategory && onCreateCategory) {
      onCreateCategory(newCategory);
      onChange(newCategory);
      setInputValue('');
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && showCreateOption) {
      e.preventDefault();
      handleCreate();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setInputValue('');
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setInputValue('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'w-full justify-between h-auto min-h-10 px-3 py-2',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {value ? (
              <Badge variant="secondary" className="mr-1">
                {value}
                <button
                  type="button"
                  onClick={handleRemove}
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ) : (
              <span className="text-sm">Select or create category...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="p-2">
          <Input
            ref={inputRef}
            placeholder="Search or create category..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9"
          />
        </div>
        <div className="max-h-[300px] overflow-auto">
          {filteredCategories.length > 0 ? (
            <div className="p-1">
              {filteredCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                    value === category && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => handleSelect(category)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === category ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {category}
                </button>
              ))}
            </div>
          ) : (
            !inputValue && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No categories found. Start typing to create one.
              </div>
            )
          )}
          {showCreateOption && (
            <div className="border-t p-1">
              <button
                type="button"
                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={handleCreate}
              >
                <span className="mr-2">+</span>
                Create &quot;{inputValue}&quot;
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

