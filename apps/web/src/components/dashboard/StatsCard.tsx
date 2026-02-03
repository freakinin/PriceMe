import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange';
    className?: string;
}

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    variant = 'default',
    className
}: StatsCardProps) {

    const variants = {
        default: {
            color: 'text-foreground',
        },
        success: {
            color: 'text-green-600 dark:text-green-400',
        },
        warning: {
            color: 'text-yellow-600 dark:text-yellow-400',
        },
        danger: {
            color: 'text-red-600 dark:text-red-400',
        },
        info: {
            color: 'text-blue-600 dark:text-blue-400',
        },
        purple: {
            color: 'text-purple-600 dark:text-purple-400',
        },
        orange: {
            color: 'text-orange-600 dark:text-orange-400',
        },
    };

    const currentVariant = variants[variant];

    return (
        <Card className={cn('bg-card hover:bg-accent/50 transition-colors', className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold tracking-tight">{value}</p>
                        {description && (
                            <p className={cn("text-xs text-muted-foreground", currentVariant.color)}>{description}</p>
                        )}
                    </div>
                    <Icon className={cn('h-5 w-5 text-muted-foreground/70')} />
                </div>
            </CardContent>
        </Card>
    );
}
