// Order Types
export interface Order {
  id: bigint;
  title: string;
  description?: string;
  desk_id?: bigint;
  media_unit_id?: bigint;
  program_id?: bigint;
  episode_id?: bigint;
  status_id?: bigint;
  priority_id?: bigint;
  deadline?: Date;
  created_by?: bigint;
  created_at?: Date;
  // New tracking fields
  started_at?: Date;
  completed_at?: Date;
  is_overdue?: boolean;
  is_archived?: boolean;
  archived_at?: Date;
  quality_score?: number;
  notes?: string;
}

export interface OrderStatus {
  id: bigint;
  name: string;
  description?: string;
}

export interface OrderHistory {
  id: bigint;
  order_id?: bigint;
  old_status_id?: bigint;
  new_status_id?: bigint;
  changed_by?: bigint;
  changed_at?: Date;
}

// Task Types
export interface Task {
  id: bigint;
  order_id?: bigint;
  title: string;
  description?: string;
  assigned_to?: bigint;
  status_id?: bigint;
  priority_id?: bigint;
  deadline?: Date;
  sequence_order?: number;
  created_at?: Date;
  task_type_id?: bigint;
  // New tracking fields
  started_at?: Date;
  completed_at?: Date;
  is_overdue?: boolean;
  estimated_duration?: number;
  actual_duration?: number;
}

export interface TaskStatus {
  id: bigint;
  name: string;
  description?: string;
}

export interface TaskType {
  id: bigint;
  name: string;
}

export interface TaskHistory {
  id: bigint;
  task_id?: bigint;
  old_status_id?: bigint;
  new_status_id?: bigint;
  changed_by?: bigint;
  changed_at?: Date;
}

export interface TaskAssignment {
  id: bigint;
  task_id?: bigint;
  assigned_to?: bigint;
  assigned_by?: bigint;
  assigned_at?: Date;
}

export interface TaskComment {
  id: bigint;
  task_id?: bigint;
  user_id?: bigint;
  comment?: string;
  created_at?: Date;
}

export interface TaskAttachment {
  id: bigint;
  task_id?: bigint;
  file_url?: string;
  file_type?: string;
  uploaded_by?: bigint;
  created_at?: Date;
}

export interface TaskRelation {
  id: bigint;
  task_id?: bigint;
  related_to_type?: string;
  related_to_id?: bigint;
  // New fields
  relation_type?: string; // 'depends_on', 'blocks', 'related_to', 'subtask_of', 'parent_of'
  description?: string;
  is_active?: boolean;
  created_at?: Date;
  created_by?: bigint;
}

// Shooting Types
export interface Shooting {
  id: bigint;
  order_id?: bigint;
  task_id?: bigint;
  location?: string;
  start_time?: Date;
  end_time?: Date;
  equipment?: string[];
  crew?: string[];
  notes?: string;
  created_by?: bigint;
  created_at?: Date;
}

// Desk & Team Types
export interface Desk {
  id: bigint;
  name: string;
  description?: string;
  manager_id?: bigint;
  created_at?: Date;
}

export interface Team {
  id: bigint;
  desk_id?: bigint;
  name: string;
  manager_id?: bigint;
  created_at?: Date;
}

export interface TeamUser {
  team_id: bigint;
  user_id: bigint;
}

// Priority Types
export interface PriorityLevel {
  id: bigint;
  name: string;
}

// KPI Types
export interface TaskKPI {
  id: bigint;
  task_id: bigint;
  order_id?: bigint;
  created_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  estimated_duration?: number;
  actual_duration?: number;
  is_on_time?: boolean;
  is_overdue?: boolean;
  delay_minutes?: number;
  content_produced_count?: number;
  content_size_total?: number;
  quality_score?: number;
  updated_at?: Date;
}

export interface OrderKPI {
  id: bigint;
  order_id: bigint;
  created_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  estimated_duration?: number;
  actual_duration?: number;
  is_on_time?: boolean;
  is_overdue?: boolean;
  delay_minutes?: number;
  total_tasks?: number;
  completed_tasks?: number;
  pending_tasks?: number;
  overdue_tasks?: number;
  content_produced_count?: number;
  content_size_total?: number;
  quality_score?: number;
  updated_at?: Date;
}

export interface UserKPI {
  id: bigint;
  user_id: bigint;
  total_tasks_assigned?: number;
  completed_tasks?: number;
  pending_tasks?: number;
  overdue_tasks?: number;
  average_completion_time?: number;
  on_time_percentage?: number;
  quality_score?: number;
  content_produced_count?: number;
  content_size_total?: number;
  ai_usage_count?: number;
  updated_at?: Date;
}
