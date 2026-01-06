import { useState, useEffect } from 'react';
import { Search, Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface UserMaterial {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  price_per_unit: number;
  width?: number;
  length?: number;
  category?: string;
}

const formatMaterialSize = (material: UserMaterial): string => {
  if (material.width && material.length) {
    const unit = material.unit === 'm²' || material.unit === 'ft²' 
      ? material.unit.replace('²', '') 
      : material.unit;
    return `${material.width} × ${material.length} ${unit}`;
  }
  return '';
};

interface MaterialSelectorProps {
  onSelect: (material: UserMaterial, quantity: number) => void;
  disabled?: boolean;
}

export function MaterialSelector({ onSelect, disabled }: MaterialSelectorProps) {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState<UserMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState<Record<number, number>>({});

  useEffect(() => {
    if (open) {
      fetchMaterials();
    }
  }, [open]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await api.get('/materials');
      if (response.data.status === 'success') {
        setMaterials(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (material.category && material.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = (material: UserMaterial) => {
    const quantity = selectedQuantity[material.id] || 1;
    onSelect(material, quantity);
    setSelectedQuantity((prev) => {
      const next = { ...prev };
      delete next[material.id];
      return next;
    });
    setSearchQuery('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-start"
        >
          <Package className="mr-2 h-4 w-4" />
          Select from Library
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-[400px] overflow-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? 'No materials found' : 'No materials in library'}
            </div>
          ) : (
            <div className="p-2">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleSelect(material)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{material.name}</span>
                        {material.category && (
                          <Badge variant="secondary" className="text-xs">
                            {material.category}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatMaterialSize(material) && (
                          <span className="mr-2">{formatMaterialSize(material)}</span>
                        )}
                        {formatCurrency(material.price_per_unit, settings.currency)} / {material.unit}
                        {material.quantity > 0 && (
                          <span className="ml-2">
                            • Stock: {material.quantity} {material.unit}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Qty"
                        value={selectedQuantity[material.id] || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          const qty = parseFloat(e.target.value) || 0;
                          setSelectedQuantity((prev) => ({
                            ...prev,
                            [material.id]: qty,
                          }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-20 h-8 text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(material);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}


