import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettings } from '@/hooks/useSettings';
import { getCurrencySymbol } from '@/utils/currency';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CategoryCombobox } from '@/components/CategoryCombobox';

// Helper function to format numbers for display (remove trailing zeros)
const formatNumberForInput = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return '';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return '';
  // Round to 2 decimal places and remove trailing zeros
  const rounded = Math.round(num * 100) / 100;
  return rounded % 1 === 0 ? rounded.toString() : rounded.toString().replace(/\.?0+$/, '');
};

const materialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.preprocess(
    (val) => (val === '' || val === null ? 0 : Number(val)),
    z.number().nonnegative('Price must be 0 or greater')
  ),
  quantity: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseFloat(val) : Number(val);
      return isNaN(num) ? 0 : num;
    },
    z.number().nonnegative('Quantity must be 0 or greater')
  ),
  unit: z.string().min(1, 'Unit is required'),
  price_per_unit: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseFloat(val) : Number(val);
      return isNaN(num) ? 0 : num;
    },
    z.number().nonnegative('Price per unit must be 0 or greater').optional()
  ),
  width: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().nonnegative('Width must be 0 or greater').optional()
  ),
  length: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().nonnegative('Length must be 0 or greater').optional()
  ),
  details: z.string().optional(),
  supplier: z.string().optional(),
  supplier_link: z.string().url('Invalid URL').optional().or(z.literal('')),
  stock_level: z.preprocess(
    (val) => (val === '' || val === null ? 0 : Number(val)),
    z.number().nonnegative().optional()
  ),
  reorder_point: z.preprocess(
    (val) => (val === '' || val === null ? 0 : Number(val)),
    z.number().nonnegative().optional()
  ),
  last_purchased_date: z.string().optional(),
  last_purchased_price: z.preprocess(
    (val) => (val === '' || val === null ? undefined : Number(val)),
    z.number().nonnegative().optional()
  ),
  category: z.string().optional(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

interface EditMaterialDialogProps {
  material: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingCategories: string[];
}

const DEFAULT_UNITS = [
  // Volume
  'ml', 'L', 'fl oz', 'pt', 'qt', 'gal',
  // Weight
  'g', 'kg', 'oz', 'lb',
  // Length
  'mm', 'cm', 'm', 'in', 'ft', 'yd',
  // Area
  'm²', 'ft²',
  // Count/Pieces
  'pcs', 'piece', 'unit', 'set', 'pack', 'box', 'roll', 'sheet', 'yard'
];

// Units that should show width/length dimensions
const DIMENSION_UNITS = ['m²', 'ft²', 'sheet', 'roll', 'yard', 'mm', 'cm', 'm', 'in', 'ft', 'yd'];

const shouldShowDimensions = (unit: string): boolean => {
  return DIMENSION_UNITS.includes(unit);
};

export default function EditMaterialDialog({
  material,
  open,
  onOpenChange,
  onSuccess,
  existingCategories,
}: EditMaterialDialogProps) {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      price: 0,
      quantity: 0,
      unit: '',
      price_per_unit: 0,
      details: '',
      supplier: '',
      supplier_link: '',
      stock_level: 0,
      reorder_point: 0,
      last_purchased_date: '',
      last_purchased_price: undefined,
      category: '',
    },
  });

  useEffect(() => {
    if (material && open) {
      const pricePerUnit = material.price_per_unit || 0;
      const quantity = material.quantity || 0;
      const calculatedPrice = pricePerUnit * quantity;
      
      form.reset({
        name: material.name || '',
        price: calculatedPrice,
        quantity: quantity,
        unit: material.unit || '',
        price_per_unit: pricePerUnit,
        width: material.width || undefined,
        length: material.length || undefined,
        details: material.details || '',
        supplier: material.supplier || '',
        supplier_link: material.supplier_link || '',
        stock_level: material.stock_level || 0,
        reorder_point: material.reorder_point || 0,
        last_purchased_date: material.last_purchased_date || '',
        last_purchased_price: material.last_purchased_price || undefined,
        category: material.category || '',
      });
    } else if (open) {
      form.reset({
        name: '',
        price: 0,
        quantity: 0,
        unit: '',
        price_per_unit: 0,
        width: undefined,
        length: undefined,
        details: '',
        supplier: '',
        supplier_link: '',
        stock_level: 0,
        reorder_point: 0,
        last_purchased_date: '',
        last_purchased_price: undefined,
        category: '',
      });
    }
  }, [material, open, form]);

  const onSubmit = async (data: MaterialFormValues) => {
    try {
      setSaving(true);
      
      // Calculate price from price_per_unit * quantity
      const pricePerUnit = data.price_per_unit || 0;
      const quantity = data.quantity || 0;
      const calculatedPrice = pricePerUnit * quantity;
      
      const submitData = {
        ...data,
        price: calculatedPrice,
        price_per_unit: pricePerUnit,
      };
      
      if (material) {
        // Update existing material
        await api.put(`/materials/${material.id}`, submitData);
        toast({
          variant: 'success',
          title: 'Success',
          description: 'Material updated successfully',
        });
      } else {
        // Create new material
        await api.post('/materials', submitData);
        toast({
          variant: 'success',
          title: 'Success',
          description: 'Material created successfully',
        });
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Error saving material:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save material',
      });
    } finally {
      setSaving(false);
    }
  };

  // Always use DEFAULT_UNITS, but merge with user's custom units if they exist
  const userUnits = settings.units && settings.units.length > 0 ? settings.units : [];
  const units = [...new Set([...DEFAULT_UNITS, ...userUnits])].sort();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" side="right">
        <SheetHeader>
          <SheetTitle>
            {material ? 'Edit Material' : 'Add New Material'}
          </SheetTitle>
          <SheetDescription>
            {material 
              ? 'Update the material information below.'
              : 'Fill in the details to add a new material to your inventory.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-4 mt-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <CategoryCombobox
                        value={field.value || ''}
                        onChange={field.onChange}
                        existingCategories={existingCategories}
                        onCreateCategory={(newCategory) => {
                          // The category will be added to the list when the material is saved
                          field.onChange(newCategory);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price_per_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per Unit ({getCurrencySymbol(settings.currency)}) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={formatNumberForInput(field.value)}
                        onChange={(e) => {
                          const pricePerUnit = e.target.value ? parseFloat(e.target.value) : 0;
                          field.onChange(pricePerUnit);
                          // Auto-calculate total price
                          const quantity = form.getValues('quantity') || 0;
                          form.setValue('price', parseFloat((pricePerUnit * quantity).toFixed(2)));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                        value={formatNumberForInput(field.value)}
                        onChange={(e) => {
                          const quantity = e.target.value ? parseFloat(e.target.value) : 0;
                          field.onChange(quantity);
                          // Auto-calculate total price
                          const pricePerUnit = form.getValues('price_per_unit') || 0;
                          form.setValue('price', parseFloat((pricePerUnit * quantity).toFixed(2)));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {shouldShowDimensions(form.watch('unit')) && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width ({form.watch('unit') === 'm²' || form.watch('unit') === 'ft²' ? form.watch('unit').replace('²', '') : form.watch('unit') || 'mm'})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          {...field}
                          value={formatNumberForInput(field.value)}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              field.onChange(undefined);
                            } else {
                              const num = parseFloat(value);
                              field.onChange(isNaN(num) ? undefined : num);
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              field.onChange(undefined);
                            }
                            field.onBlur();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length ({form.watch('unit') === 'm²' || form.watch('unit') === 'ft²' ? form.watch('unit').replace('²', '') : form.watch('unit') || 'mm'})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          {...field}
                          value={formatNumberForInput(field.value)}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              field.onChange(undefined);
                            } else {
                              const num = parseFloat(value);
                              field.onChange(isNaN(num) ? undefined : num);
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              field.onChange(undefined);
                            }
                            field.onBlur();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Price ({getCurrencySymbol(settings.currency)})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={formatNumberForInput(field.value)}
                      readOnly
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Automatically calculated from Price per Unit × Quantity
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Additional notes or details" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Supplier name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplier_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Link</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." type="url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Level</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                        value={formatNumberForInput(field.value)}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reorder_point"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      Reorder Point
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>The minimum stock level at which you should reorder this material. When stock level drops to or below this point, the material will be flagged as "Low Stock".</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                        value={formatNumberForInput(field.value)}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="last_purchased_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Purchased Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value ? (typeof field.value === 'string' ? field.value.split('T')[0] : new Date(field.value).toISOString().split('T')[0]) : ''}
                        onChange={(e) => {
                          field.onChange(e.target.value || undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_purchased_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Purchased Price ({getCurrencySymbol(settings.currency)})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={formatNumberForInput(field.value)}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
              >
                {saving ? 'Saving...' : material ? 'Update' : 'Create'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

