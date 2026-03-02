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

const variants = {
    default: {
        topBorder:  'border-t-zinc-400',
        iconBg:     'bg-zinc-100',
        iconColor:  'text-zinc-500',
        valueColor: 'text-foreground',
        descColor:  'text-muted-foreground',
    },
    success: {
        topBorder:  'border-t-emerald-500',
        iconBg:     'bg-emerald-50',
        iconColor:  'text-emerald-600',
        valueColor: 'text-emerald-700',
        descColor:  'text-emerald-600/70',
    },
    warning: {
        topBorder:  'border-t-amber-400',
        iconBg:     'bg-amber-50',
        iconColor:  'text-amber-600',
        valueColor: 'text-amber-700',
        descColor:  'text-amber-600/70',
    },
    danger: {
        topBorder:  'border-t-red-500',
        iconBg:     'bg-red-50',
        iconColor:  'text-red-600',
        valueColor: 'text-red-700',
        descColor:  'text-red-500/70',
    },
    info: {
        topBorder:  'border-t-sky-500',
        iconBg:     'bg-sky-50',
        iconColor:  'text-sky-600',
        valueColor: 'text-sky-700',
        descColor:  'text-sky-600/70',
    },
    purple: {
        topBorder:  'border-t-violet-500',
        iconBg:     'bg-violet-50',
        iconColor:  'text-violet-600',
        valueColor: 'text-violet-700',
        descColor:  'text-violet-500/70',
    },
    orange: {
        topBorder:  'border-t-orange-500',
        iconBg:     'bg-orange-50',
        iconColor:  'text-orange-600',
        valueColor: 'text-orange-700',
        descColor:  'text-orange-500/70',
    },
} as const;

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    variant = 'default',
    className,
}: StatsCardProps) {
    const v = variants[variant];

    return (
        <div
            className={cn(
                'bg-card rounded-xl border border-border border-t-[3px] overflow-hidden',
                'shadow-sm hover:shadow-md transition-all duration-200 group',
                v.topBorder,
                className,
            )}
        >
            <div className="p-5">
                {/* Icon + Title row */}
                <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                        'transition-transform duration-200 group-hover:scale-105',
                        v.iconBg,
                    )}>
                        <Icon className={cn('h-[18px] w-[18px]', v.iconColor)} />
                    </div>
                </div>

                {/* Label */}
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {title}
                </p>

                {/* Value */}
                <p className={cn('text-2xl font-bold tracking-tight leading-none', v.valueColor)}>
                    {value}
                </p>

                {/* Description */}
                {description && (
                    <p className={cn('text-xs mt-2', v.descColor)}>
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
