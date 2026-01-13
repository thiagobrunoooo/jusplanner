import React from 'react';
import { cn } from '../../lib/utils';

// Base Skeleton component with shimmer animation
export const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                "relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-lg",
                "before:absolute before:inset-0 before:-translate-x-full",
                "before:animate-[shimmer_2s_infinite]",
                "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
                className
            )}
            {...props}
        />
    );
};

// Card skeleton for dashboard cards
export const CardSkeleton = ({ className }) => (
    <div className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6",
        className
    )}>
        <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
        <Skeleton className="h-12 w-32 mb-3" />
        <Skeleton className="h-2.5 w-full rounded-full" />
    </div>
);

// Metric card skeleton
export const MetricCardSkeleton = ({ className }) => (
    <div className={cn(
        "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60",
        className
    )}>
        <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-16" />
    </div>
);

// Chart skeleton
export const ChartSkeleton = ({ className }) => (
    <div className={cn(
        "bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800",
        className
    )}>
        <Skeleton className="h-5 w-40 mb-6" />
        <div className="h-64 flex items-end justify-around gap-2 px-4">
            {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
                <Skeleton
                    key={i}
                    className="w-8 rounded-t-lg"
                    style={{ height: `${h}%` }}
                />
            ))}
        </div>
    </div>
);

// Topic card skeleton for schedule
export const TopicCardSkeleton = ({ className }) => (
    <div className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6",
        className
    )}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-3 w-20 rounded-full" />
                    <Skeleton className="h-5 w-48" />
                </div>
            </div>
            <Skeleton className="w-6 h-6 rounded" />
        </div>
    </div>
);

// Subject tree skeleton
export const SubjectTreeSkeleton = ({ className }) => (
    <div className={cn("space-y-4", className)}>
        {[1, 2, 3, 4].map((i) => (
            <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="w-5 h-5 rounded" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// Dashboard skeleton combining all elements
export const DashboardSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        {/* Progress cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
        </div>
    </div>
);

// Schedule skeleton
export const ScheduleSkeleton = () => (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-80" />
            </div>
            <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-64 rounded-lg" />
                <Skeleton className="h-12 w-full xl:w-80 rounded-xl" />
            </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
                <Skeleton className="w-16 h-16 rounded-full" />
            </div>
        </div>

        {/* Topic cards */}
        <div className="space-y-4">
            <TopicCardSkeleton />
            <TopicCardSkeleton />
            <TopicCardSkeleton />
        </div>
    </div>
);

// Performance analytics skeleton
export const PerformanceSkeleton = () => (
    <div className="space-y-8">
        <Skeleton className="h-8 w-48" />

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
        </div>

        {/* Charts */}
        <ChartSkeleton className="h-96" />
        <ChartSkeleton />
    </div>
);

export default Skeleton;
