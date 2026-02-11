import * as React from "react"
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useCategories } from "@/hooks/useCategories"
import { useToast } from "@/components/ui/use-toast"

interface CategorySelectProps {
    value?: number | null
    onChange: (value: number | null) => void
    className?: string
    placeholder?: string
    isLoading?: boolean
}

export function CategorySelect({ value, onChange, className, placeholder = "Select category...", isLoading = false }: CategorySelectProps) {
    const { categories, createCategory } = useCategories()
    const { toast } = useToast()
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    // Internal value for optimistic UI updates
    const [internalValue, setInternalValue] = React.useState(value)

    React.useEffect(() => {
        setInternalValue(value)
    }, [value])

    // Optimistic cache for newly created categories (before re-fetch)
    const [tempCategory, setTempCategory] = React.useState<{ id: number, name: string } | null>(null)
    const [isCreating, setIsCreating] = React.useState(false)

    const selectedCategory = categories.find((c) => c.id === internalValue) || (internalValue === tempCategory?.id ? tempCategory : null)

    // Consider busy if external loading prop is true or we are creating locally
    const isBusy = isLoading || isCreating

    const handleCreate = async () => {
        if (!inputValue.trim()) return

        try {
            // Optimistically close
            setOpen(false)
            setIsCreating(true)

            const newCategory = await createCategory({
                name: inputValue.trim(),
                description: ""
            })

            // Handle backend response structure (may be { status: 'success', data: { ... } } or just { ... })
            const createdCategory = newCategory.data || newCategory;

            if (createdCategory && createdCategory.id) {
                setTempCategory(createdCategory) // Optimistic update
                setInternalValue(createdCategory.id) // Instant UI update
                onChange(createdCategory.id)

                toast({
                    title: "Category created",
                    description: `Category "${createdCategory.name}" has been created.`,
                })
                setInputValue("")
            } else {
                console.error("Created category but no ID returned", newCategory);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to create category",
            })
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        "w-full justify-between disabled:opacity-100",
                        (!internalValue && !isBusy) && "text-muted-foreground",
                        className
                    )}
                    disabled={isBusy}
                >
                    {isBusy ? (
                        <div className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#F89C75]" />
                            <span>Updating...</span>
                        </div>
                    ) : (
                        selectedCategory ? selectedCategory.name : placeholder
                    )}
                    {!isBusy && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[200px] p-0"
                align="start"
            >
                <Command>
                    <div className="flex items-center border-b px-3" data-cmdk-input-wrapper="">
                        <CommandPrimitive.Input
                            placeholder="Search category..."
                            value={inputValue}
                            onValueChange={setInputValue}
                            className={cn(
                                "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            )}
                        />
                    </div>
                    <CommandList>
                        <CommandEmpty className="py-2 px-2 text-sm">
                            <p className="text-muted-foreground text-center pb-2">No category found.</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start h-8"
                                onClick={handleCreate}
                            >
                                <Plus className="mr-2 h-3 w-3" />
                                Create "{inputValue}"
                            </Button>
                        </CommandEmpty>
                        <CommandGroup>
                            {categories.map((category) => (
                                <CommandItem
                                    key={category.id}
                                    value={category.name}
                                    onSelect={() => {
                                        const newValue = category.id === internalValue ? null : category.id
                                        setInternalValue(newValue) // Instant UI update
                                        onChange(newValue)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            internalValue === category.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {category.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
