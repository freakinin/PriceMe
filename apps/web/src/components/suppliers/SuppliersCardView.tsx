import { Edit, Trash2, Mail, Phone, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type Supplier } from '@/hooks/useSuppliers';

interface Props {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  formatDate: (dateString?: string) => string;
}

export function SuppliersCardView({ suppliers, onEdit, onDelete, formatDate }: Props) {
  if (suppliers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">No suppliers found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {suppliers.map((supplier) => (
        <Card
          key={supplier.id}
          className="group relative flex flex-col transition-all duration-200 hover:shadow-md"
        >
          <CardContent className="p-0 flex flex-col flex-1">
            {/* Header: name + material count */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-base truncate flex-1">{supplier.name}</p>
                <Badge variant="outline" className="shrink-0 text-xs whitespace-nowrap">
                  <Package className="h-3 w-3 mr-1" />
                  {supplier.material_count ?? 0}
                </Badge>
              </div>
              {supplier.link && (
                <a
                  href={supplier.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-primary hover:underline mt-1 truncate"
                >
                  {supplier.link.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>

            <div className="border-t" />

            {/* Contact info */}
            <div className="px-4 py-3 space-y-2">
              {supplier.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <a href={`tel:${supplier.phone}`} className="text-sm truncate hover:underline">
                    {supplier.phone}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  <span className="text-sm text-muted-foreground/40">—</span>
                </div>
              )}
              {supplier.email ? (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <a
                    href={`mailto:${supplier.email}`}
                    className="text-sm text-primary hover:underline truncate"
                  >
                    {supplier.email}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  <span className="text-sm text-muted-foreground/40">—</span>
                </div>
              )}
            </div>

            {supplier.notes && (
              <>
                <div className="border-t" />
                <div className="px-4 py-2">
                  <p className="text-xs text-muted-foreground line-clamp-2">{supplier.notes}</p>
                </div>
              </>
            )}

            <div className="border-t mt-auto" />

            {/* Footer: date + actions */}
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{formatDate(supplier.created_at)}</span>
              <div className="flex items-center gap-0.5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => onEdit(supplier)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit supplier</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onDelete(supplier)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete supplier</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
