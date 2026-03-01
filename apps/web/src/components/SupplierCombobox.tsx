import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, ExternalLink, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Supplier, CreateSupplierData } from '@/hooks/useSuppliers';

interface SupplierComboboxProps {
  value?: number | null;
  onChange: (supplierId: number | null, name: string, link: string) => void;
  suppliers: Supplier[];
  onCreateSupplier: (data: CreateSupplierData) => Promise<Supplier>;
  className?: string;
}

export function SupplierCombobox({
  value,
  onChange,
  suppliers,
  onCreateSupplier,
  className,
}: SupplierComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSupplier = value ? suppliers.find((s) => s.id === value) : null;

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const exactMatch = suppliers.some(
    (s) => s.name.toLowerCase() === inputValue.toLowerCase()
  );

  const showCreateOption = inputValue.trim() && !exactMatch && !showCreateForm;

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setInputValue('');
      setShowCreateForm(false);
      setNewName('');
      setNewLink('');
      setNewPhone('');
      setNewEmail('');
    }
  }, [open]);

  const handleSelect = (supplier: Supplier) => {
    onChange(supplier.id, supplier.name, supplier.link || '');
    setOpen(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, '', '');
  };

  const handleStartCreate = () => {
    setNewName(inputValue.trim());
    setNewLink('');
    setNewPhone('');
    setNewEmail('');
    setShowCreateForm(true);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const created = await onCreateSupplier({
        name,
        link: newLink.trim() || undefined,
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
      });
      onChange(created.id, created.name, created.link || '');
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showCreateForm) {
        setShowCreateForm(false);
      } else {
        setOpen(false);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          type="button"
          className={cn(
            'w-full justify-between h-auto min-h-10 px-3 py-2',
            !selectedSupplier && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {selectedSupplier ? (
              <Badge variant="secondary" className="mr-1">
                {selectedSupplier.name}
                <span
                  onClick={handleRemove}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRemove(e as any);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </span>
              </Badge>
            ) : (
              <span className="text-sm">Select or add supplier...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        {showCreateForm ? (
          <div className="p-3 space-y-2.5" onKeyDown={handleKeyDown}>
            <p className="text-sm font-medium">New Supplier</p>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Name *</Label>
              <Input
                autoFocus
                placeholder="Supplier name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Website</Label>
              <Input
                placeholder="https://..."
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input
                  placeholder="+1 555 000 0000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  placeholder="contact@..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-8"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreate();
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
              >
                {creating ? 'Saving...' : 'Save'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-2">
              <Input
                ref={inputRef}
                placeholder="Search suppliers..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9"
              />
            </div>
            <div className="max-h-[280px] overflow-auto">
              {filteredSuppliers.length > 0 ? (
                <div className="p-1">
                  {filteredSuppliers.map((supplier) => (
                    <button
                      key={supplier.id}
                      type="button"
                      className={cn(
                        'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                        value === supplier.id && 'bg-accent text-accent-foreground'
                      )}
                      onClick={() => handleSelect(supplier)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 shrink-0',
                          value === supplier.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="flex-1 text-left">{supplier.name}</span>
                      {supplier.link && (
                        <ExternalLink className="ml-1 h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                !inputValue && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No suppliers yet. Start typing to add one.
                  </div>
                )
              )}
              {showCreateOption && (
                <div className="border-t p-1">
                  <button
                    type="button"
                    className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={handleStartCreate}
                  >
                    <span className="mr-2">+</span>
                    Add &quot;{inputValue}&quot;
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
