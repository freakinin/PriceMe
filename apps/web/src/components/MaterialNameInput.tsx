import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { formatCurrency } from '@/utils/currency';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';

interface UserMaterial {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  price_per_unit: number;
  category?: string;
}

interface MaterialNameInputProps {
  value: string;
  onChange: (value: string) => void;
  onMaterialSelect?: (material: UserMaterial) => void;
  onAddToLibrary?: (name: string) => Promise<void>;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function MaterialNameInput({
  value,
  onChange,
  onMaterialSelect,
  onAddToLibrary,
  className,
  placeholder = "Search or type material name...",
  disabled,
}: MaterialNameInputProps) {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [materials, setMaterials] = useState<UserMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  useEffect(() => {
    if (open && searchQuery.length > 0) {
      const timeoutId = setTimeout(() => {
        fetchMaterials();
      }, 300); // Debounce search to avoid too many API calls
      return () => clearTimeout(timeoutId);
    } else {
      setMaterials([]); // Clear materials when search is empty
    }
  }, [open, searchQuery]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/materials?search=${encodeURIComponent(searchQuery)}`);
      if (response.data.status === 'success') {
        setMaterials(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if search query matches an existing material exactly
  const exactMatch = materials.some(
    (material) => material.name.toLowerCase() === searchQuery.toLowerCase()
  );

  // Check if we should show "Add to Library" option
  const showAddOption = searchQuery.trim().length > 0 && !exactMatch;

  const handleSelect = (material: UserMaterial) => {
    onChange(material.name);
    if (onMaterialSelect) {
      onMaterialSelect(material);
    }
    setOpen(false);
  };

  const handleAddToLibrary = async () => {
    if (onAddToLibrary && searchQuery.trim()) {
      try {
        await onAddToLibrary(searchQuery.trim());
        onChange(searchQuery.trim());
        setOpen(false);
      } catch (error) {
        console.error('Error adding material to library:', error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    
    // Open popover when user types
    if (newValue.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (searchQuery.length > 0) {
      setOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Close popover when input loses focus
    // Use setTimeout to allow click events on popover items to fire first
    setTimeout(() => {
      // Check if the newly focused element is inside the popover
      const activeElement = document.activeElement;
      const popoverContent = document.querySelector('[data-radix-popover-content]');
      
      // If focus moved to popover content, don't close (user is clicking on a suggestion)
      if (popoverContent && activeElement && popoverContent.contains(activeElement)) {
        return;
      }
      
      // Otherwise, close the popover (user clicked outside or tabbed away)
      setOpen(false);
    }, 200);
  };

  const handleInputClick = () => {
    // Keep popover open when clicking on input
    if (searchQuery.length > 0) {
      setOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && showAddOption && onAddToLibrary) {
      e.preventDefault();
      handleAddToLibrary();
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <Popover open={open && searchQuery.length > 0} onOpenChange={(isOpen) => {
      // Allow closing when clicking outside
      setOpen(isOpen);
    }}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("pr-10", className)}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={() => {
          setOpen(false);
          inputRef.current?.blur();
        }}
        onInteractOutside={(e) => {
          // Prevent closing when clicking on the input itself
          const target = e.target as HTMLElement;
          const inputElement = inputRef.current;
          if (inputElement && (target === inputElement || inputElement.contains(target))) {
            e.preventDefault();
            return;
          }
          // Explicitly close when clicking outside
          setOpen(false);
        }}
      >
        {searchQuery.length > 0 && (
          <div className="max-h-[300px] overflow-auto">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredMaterials.length === 0 && !showAddOption ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No materials found
              </div>
            ) : (
              <div className="p-1">
                {filteredMaterials.map((material) => (
                  <button
                    key={material.id}
                    type="button"
                    className="w-full text-left p-2 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => handleSelect(material)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{material.name}</span>
                        {material.category && (
                          <Badge variant="secondary" className="text-xs">
                            {material.category}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(material.price_per_unit, settings.currency)} / {material.unit}
                      </div>
                    </div>
                  </button>
                ))}
                {showAddOption && (
                  <div className="border-t mt-1 pt-1">
                    <button
                      type="button"
                      className="w-full text-left p-2 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                      onClick={handleAddToLibrary}
                    >
                      <Plus className="h-4 w-4 text-primary" />
                      <span>
                        {onAddToLibrary 
                          ? `Add "${searchQuery}" to library`
                          : `Use "${searchQuery}" (not in library)`
                        }
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

