import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Status, Task } from '../types';
import { Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

interface TaskStatusDropdownProps {
  task: Task;
  onStatusChange?: (taskId: number, newStatusId: number, newStatusName: string) => void;
  isEditable?: boolean;
  className?: string;
  showBadge?: boolean;
}

export default function TaskStatusDropdown({
  task,
  onStatusChange,
  isEditable = true,
  className,
  showBadge = false
}: TaskStatusDropdownProps) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>(String(task.status_id || ''));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const res = await api.get<{ success: boolean; data: Status[] }>('/api/tasks/statuses');
      if (res.success) {
        setStatuses(res.data);
      }
    } catch (err) {
      console.error('Error fetching task statuses:', err);
    }
  };

  const handleStatusChange = async (newStatusId: string) => {
    if (!isEditable || loading) return;

    setLoading(true);
    try {
      const statusId = Number(newStatusId);
      const res = await api.patch<{ success: boolean; data: Task }>(
        `/api/tasks/${task.id}/status`,
        { status_id: statusId }
      );

      if (res.success) {
        setSelectedStatus(newStatusId);
        const newStatus = statuses.find(s => s.id === statusId);
        if (onStatusChange && newStatus) {
          onStatusChange(task.id, statusId, newStatus.name);
        }
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      // Revert to previous status on error
      setSelectedStatus(String(task.status_id || ''));
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = statuses.find(s => s.id === Number(selectedStatus));

  if (!isEditable) {
    // Display as badge only
    return (
      <Badge variant={getTaskStatusVariant(Number(selectedStatus))}>
        {currentStatus?.name || task.status_name || 'غير محدد'}
      </Badge>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <Select
        options={[
          { value: '', label: 'اختر الحالة...' },
          ...statuses.map(s => ({ value: s.id, label: s.name }))
        ]}
        value={selectedStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={loading}
        className="text-sm"
      />
    </div>
  );
}

// Helper function to get badge variant based on status
export function getTaskStatusVariant(statusId: number | string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  const id = Number(statusId);
  
  // Common status IDs (adjust based on your database)
  // 1: New/Pending, 2: In Progress, 3: Done/Completed, 4: Cancelled
  switch (id) {
    case 1:
      return 'info'; // جديد
    case 2:
      return 'warning'; // قيد التنفيذ
    case 3:
      return 'success'; // مكتمل
    case 4:
      return 'danger'; // ملغي
    default:
      return 'default';
  }
}
