import React from 'react';
import { TaskType } from '../types';
import { cn } from '../lib/utils';

interface TaskTypeIndicatorProps {
  taskType: TaskType | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function TaskTypeIndicator({ 
  taskType, 
  size = 'md', 
  showLabel = true,
  className 
}: TaskTypeIndicatorProps) {
  if (!taskType) {
    return <span className="text-xs text-slate-400 font-bold">بدون نوع</span>;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg font-bold text-white w-fit',
      sizeClasses[size],
      className
    )} style={{ backgroundColor: taskType.color || '#3d6a8a' }}>
      {taskType.icon && <span className={iconSizes[size]}>{taskType.icon}</span>}
      {showLabel && <span>{taskType.name}</span>}
    </div>
  );
}
