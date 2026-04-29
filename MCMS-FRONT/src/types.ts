export interface User {
  id: number;
  name: string;
  email: string;
  roles: { id: number; name: string }[];
  permissions?: string[];
  days_of_work?: string;
  start_time?: string;
  end_time?: string;
  last_login?: string;
}

export interface DashboardData {
  orders: {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
    overdue: number;
    completion_rate: number;
  };
  tasks: {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
    overdue: number;
    completion_rate: number;
  };
  content: {
    total: number;
    total_size_mb: number;
    archived: number;
  };
  users: {
    total: number;
  };
  performance: {
    avg_task_duration_minutes: number;
    on_time_percentage: number;
  };
  top_performers: {
    user_id: number;
    name: string;
    completed_tasks: number;
    on_time_percentage: number;
  }[];
  reuse: {
    total_reuses: number;
    top_reused: { id: number; title: string; reuse_count: number }[];
  };
}

export interface TrendData {
  month: string;
  orders: number;
  tasks: number;
  content: number;
}

export interface UserPerformance {
  user_id: number;
  user_name: string;
  email: string;
  role_name: string;
  total_tasks_assigned: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  average_completion_time: number;
  on_time_percentage: number;
  content_produced_count: number;
  ai_usage_count: number;
}

export interface OverdueTask {
  id: number;
  title: string;
  user_name: string;
  deadline: string;
  delay_days: number;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
  error?: string;
}

export interface ProfileResponse {
  success: boolean;
  data: User;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'order' | 'shooting' | 'content' | 'deadline';
  is_read: boolean;
  created_at: string;
  link?: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unread_count: number;
  };
}

export interface Lookup {
  id: number;
  name: string;
  color?: string;
}

export interface Order {
  id: number;
  title: string;
  description: string;
  desk_id: number;
  desk_name?: string;
  status_id: number;
  status_name?: string;
  priority_id: number;
  priority_name?: string;
  media_unit_id: number;
  media_unit_name?: string;
  created_by: number;
  created_by_name?: string;
  deadline: string;
  program_id?: number;
  program_name?: string;
  episode_id?: number;
  episode_title?: string;
  notes?: string;
  completion_percentage: number;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  order_id: number;
  order_title?: string;
  assigned_to: number;
  assigned_to_name?: string;
  status_id: number;
  status_name?: string;
  priority_id: number;
  priority_name?: string;
  deadline: string;
  task_type_id?: number;
  task_type_name?: string;
  created_at: string;
}

export interface HistoryLog {
  id: number;
  old_status_id: number | null;
  old_status_name: string | null;
  new_status_id: number;
  new_status_name: string;
  changed_by: number;
  changed_by_name: string;
  changed_at: string;
}

export interface OrderDetails extends Order {
  tasks: Task[];
  progress: {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
    percentage: number;
  };
  history: HistoryLog[];
}

export interface Comment {
  id: number;
  user_id: number;
  user_name: string;
  comment: string;
  created_at: string;
}

export interface Attachment {
  id: number;
  user_id: number;
  user_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export interface TaskRelation {
  id: number;
  task_id: number;
  related_task_id: number;
  related_task_title: string;
  relation_type: 'depends_on' | 'blocks' | 'related_to' | 'subtask_of' | 'parent_of';
}

export interface AssignmentHistory {
  id: number;
  assigned_by: number;
  assigned_by_name: string;
  assigned_to: number;
  assigned_to_name: string;
  assigned_at: string;
}

export interface TaskDetails extends Task {
  comments: Comment[];
  attachments: Attachment[];
  relations: TaskRelation[];
  assignments: AssignmentHistory[];
  history: HistoryLog[];
  can_delete?: boolean;
}

export interface Desk extends Lookup {
  description?: string;
  manager_id?: number;
  manager_name?: string;
}

export interface MediaUnit extends Lookup {
  description?: string;
}

export interface Program extends Lookup {
  title?: string;
  description?: string;
  media_unit_id?: number;
  media_unit_name?: string;
  air_time?: string;
  episode_count?: number;
}

export interface ProgramRole {
  user_id: number;
  user_name: string;
  role_id: number;
  role_name: string;
}

export interface Episode {
  id: number;
  title: string;
  program_id: number;
  program_title?: string;
  episode_number?: number;
  air_date?: string;
  status_name?: string; // Derived from linked order
  guest_count?: number;
  content_count?: number;
}

export interface Guest {
  id: number;
  name: string;
  title?: string;
  bio?: string;
  phone?: string;
}

export interface Team extends Lookup {
  desk_id: number;
  desk_name?: string;
  manager_id?: number;
  manager_name?: string;
  member_count?: number;
}

export interface Role extends Lookup {
  description?: string;
}

export interface ProgramDetails extends Program {
  episodes: Episode[];
  team: ProgramRole[];
}

export interface EpisodeDetails extends Episode {
  guests: Guest[];
  tasks: Task[];
  content: Content[];
}

export interface DeskDetails extends Desk {
  teams: Team[];
}

export interface TeamDetails extends Team {
  members: User[];
}

export interface UserKPI {
  total_tasks_assigned: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  average_completion_time: number;
  on_time_percentage: number;
  content_produced_count: number;
  ai_usage_count: number;
}

export interface UserPermissionGroup {
  category: string;
  permissions: {
    key: string;
    label: string;
    has: boolean;
  }[];
}

export interface UserWithRoles extends Omit<User, 'roles'> {
  role_id?: number;
  role_name?: string;
  work_days: string;
  start_time: string;
  end_time: string;
  roles: Role[];
}

export interface Status extends Lookup {}

export interface Shooting {
  id: number;
  order_id: number;
  order_title?: string;
  task_id?: number;
  task_title?: string;
  task_status_name?: string;
  location: string;
  start_time: string;
  end_time?: string;
  equipment: string[];
  crew: string[];
  notes?: string;
  source_type: 'internal' | 'external';
  created_by: number;
  created_by_name?: string;
  content_count?: number;
  created_at: string;
}

export interface Content {
  id: number;
  title: string;
  content_type_id: number;
  content_type_name?: string;
  task_id?: number;
  task_title?: string;
  shooting_id?: number;
  media_unit_id?: number;
  media_unit_name?: string;
  created_by: number;
  created_by_name?: string;
  cloud_url?: string;
  file_size?: number;
  duration?: number;
  tags: string[];
  is_final: boolean;
  archived: boolean;
  output_type?: 'report' | 'social' | 'video' | 'archive';
  reuse_count: number;
  created_at: string;
}

export interface ContentType extends Lookup {}

export interface ContentReuse {
  id: number;
  task_id: number;
  task_title: string;
  reused_by: number;
  reused_by_name: string;
  reused_at: string;
}

export interface ContentTaskLink {
  task_id: number;
  task_title: string;
  linked_by: number;
  linked_by_name: string;
  usage_type: string;
  linked_at: string;
}

export interface ShootingDetails extends Shooting {
  produced_content: Content[];
}

export interface ContentDetails extends Content {
  reuse_history: ContentReuse[];
  linked_tasks: ContentTaskLink[];
}
