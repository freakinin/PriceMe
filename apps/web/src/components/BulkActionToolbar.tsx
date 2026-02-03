import { Button } from '@/components/ui/button';
import { X, Trash2, Edit } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BulkActionToolbarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onDelete: () => void;
    onUpdateStatus?: (status: string) => void;
    onEdit?: () => void;
    entityName?: string; // e.g. "Products" or "Materials"
}

export function BulkActionToolbar({
    selectedCount,
    onClearSelection,
    onDelete,
    onUpdateStatus,
    onEdit,
    entityName = 'items',
}: BulkActionToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-popover border shadow-lg rounded-full px-4 py-2 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex items-center gap-2 border-r pr-4">
                <span className="font-medium text-sm">
                    {selectedCount} {entityName} selected
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onClearSelection}>
                    <X className="h-3 w-3" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
                {onUpdateStatus && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                                <Edit className="h-3.5 w-3.5 mr-2" />
                                Change Status
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                            <DropdownMenuItem onClick={() => onUpdateStatus('draft')}>Draft</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus('in_progress')}>In Progress</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus('on_sale')}>On Sale</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus('inactive')}>Inactive</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {onEdit && (
                    <Button variant="outline" size="sm" className="h-8" onClick={onEdit}>
                        <Edit className="h-3.5 w-3.5 mr-2" />
                        Edit
                    </Button>
                )}

                <Button variant="destructive" size="sm" className="h-8" onClick={onDelete}>
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                </Button>
            </div>
        </div>
    );
}
