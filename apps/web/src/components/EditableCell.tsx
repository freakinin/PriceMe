import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface EditableCellProps {
    value: string | number | null | undefined;
    onSave: (value: string | number) => Promise<void>;
    type?: 'text' | 'number' | 'select';
    formatDisplay?: (value: string | number | null | undefined) => ReactNode;
    className?: string;
    options?: string[];
}

export function EditableCell({
    value,
    onSave,
    type = 'text',
    formatDisplay,
    className = '',
    options,
}: EditableCellProps) {
    const formatEditValue = (val: string | number | null | undefined): string => {
        if (val === null || val === undefined || val === '') return '';
        if (type === 'number') {
            const num = typeof val === 'string' ? parseFloat(val) : val;
            if (isNaN(num)) return '';
            // Remove trailing zeros and unnecessary decimals
            return num % 1 === 0 ? Math.round(num).toString() : parseFloat(num.toFixed(2)).toString();
        }
        return val.toString();
    };

    const [editValue, setEditValue] = useState<string>(formatEditValue(value));
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectOpen, setSelectOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const cellRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setEditValue(formatEditValue(value));
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (isSaving) return;

        setIsSaving(true);
        try {
            let valueToSave: string | number;
            if (type === 'number') {
                valueToSave = parseFloat(editValue) || 0;
            } else {
                valueToSave = editValue;
            }
            await onSave(valueToSave);
            setIsEditing(false);
        } catch (error) {
            // Revert on error
            setEditValue(formatEditValue(value));
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditValue(formatEditValue(value));
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        } else if (e.key === 'Tab') {
            // Allow tab to move to next cell
            handleSave();
        }
    };

    if (isEditing || (type === 'select' && selectOpen)) {
        if (type === 'select' && options) {
            return (
                <div ref={cellRef} className="absolute inset-0">
                    <Select
                        open={selectOpen}
                        value={editValue}
                        onValueChange={(val) => {
                            setEditValue(val);
                            // Auto-save on select change
                            setTimeout(() => {
                                onSave(val).then(() => {
                                    setIsEditing(false);
                                    setSelectOpen(false);
                                });
                            }, 0);
                        }}
                        onOpenChange={(open) => {
                            setSelectOpen(open);
                            if (!open && !isSaving) {
                                setIsEditing(false);
                            }
                        }}
                    >
                        <SelectTrigger className="h-full w-full border-none shadow-none rounded-none px-2 py-1 text-sm focus:ring-0 focus:outline-none">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        return (
            <div ref={cellRef} className="absolute inset-0">
                <input
                    ref={inputRef}
                    type={type === 'number' ? 'number' : 'text'}
                    step={type === 'number' ? '0.01' : undefined}
                    className={`h-full w-full border-none outline-none text-sm bg-transparent focus:bg-background focus:outline-none focus:ring-0 ${className.includes('text-right') ? 'text-right' : ''} ${className.includes('text-center') ? 'text-center' : ''}`}
                    style={{ borderRadius: 0 }}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    disabled={isSaving}
                />
            </div>
        );
    }

    // Format number display to remove trailing zeros
    const formatNumberDisplay = (val: string | number | null | undefined): string => {
        if (val === null || val === undefined) return '-';
        let num: number;
        if (typeof val === 'number') {
            num = val;
        } else {
            num = parseFloat(val);
            if (isNaN(num)) return val.toString();
        }
        // Remove trailing zeros: 4.0000 -> 4, 4.5000 -> 4.5, 4.1230 -> 4.123
        return num % 1 === 0
            ? num.toString()
            : num.toString().replace(/\.?0+$/, '');
    };

    const displayValue = formatDisplay
        ? formatDisplay(value)
        : (type === 'number' ? formatNumberDisplay(value) : (value?.toString() || '-'));

    const handleClick = () => {
        if (type === 'select' && options) {
            // For select, immediately open the dropdown
            setSelectOpen(true);
            setIsEditing(true);
        } else {
            setIsEditing(true);
        }
    };

    return (
        <div
            className={`relative flex items-center h-full w-full cursor-cell hover:bg-muted/30 transition-colors ${className}`}
            onClick={handleClick}
            onDoubleClick={handleClick}
        >
            <div className="flex-1 truncate text-sm">
                {typeof displayValue === 'string' ? <span>{displayValue}</span> : displayValue}
            </div>
        </div>
    );
}
