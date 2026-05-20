// Administrative Procedures Types
// Separate system from main orders/tasks

export interface AdminProcCategory {
  id: bigint;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AdminProcOrder {
  id: bigint;
  category_id: bigint;
  category_name?: string;
  title: string;
  description?: string;
  status_id: bigint;
  status_name?: string;
  priority_id?: bigint;
  priority_name?: string;
  deadline?: Date;
  created_by: bigint;
  created_by_name?: string;
  created_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  is_archived?: boolean;
  archived_at?: Date;
  notes?: string;
  updated_at?: Date;
  tasks_count?: number;
  completed_tasks_count?: number;
}

export interface AdminProcTask {
  id: bigint;
  admin_order_id: bigint;
  order_title?: string;
  category_name?: string;
  title: string;
  description?: string;
  status_id: bigint;
  status_name?: string;
  priority_id?: bigint;
  priority_name?: string;
  deadline?: Date;
  sequence_order?: number;
  created_by: bigint;
  created_by_name?: string;
  created_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  is_archived?: boolean;
  archived_at?: Date;
  estimated_duration?: number;
  actual_duration?: number;
  updated_at?: Date;
  assignees?: AdminProcTaskAssignment[];
  comments_count?: number;
  attachments_count?: number;
}

export interface AdminProcTaskAssignment {
  id: bigint;
  admin_task_id: bigint;
  assigned_to: bigint;
  assigned_to_name?: string;
  assigned_by: bigint;
  assigned_by_name?: string;
  assigned_at?: Date;
}

export interface AdminProcTaskComment {
  id: bigint;
  admin_task_id: bigint;
  user_id: bigint;
  user_name?: string;
  comment: string;
  is_edited?: boolean;
  edited_by?: bigint;
  edited_by_name?: string;
  edited_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  mentions?: AdminProcMention[];
}

export interface AdminProcTaskAttachment {
  id: bigint;
  admin_task_id: bigint;
  title?: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: bigint;
  uploaded_by: bigint;
  uploaded_by_name?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface AdminProcTaskHistory {
  id: bigint;
  admin_task_id: bigint;
  old_status_id?: bigint;
  old_status_name?: string;
  new_status_id: bigint;
  new_status_name?: string;
  changed_by: bigint;
  changed_by_name?: string;
  changed_at?: Date;
  notes?: string;
}

export interface AdminProcArchive {
  id: bigint;
  admin_order_id?: bigint;
  admin_task_id?: bigint;
  entity_type: string;
  entity_data: any;
  archived_by: bigint;
  archived_by_name?: string;
  archived_at?: Date;
  reason?: string;
}

export interface AdminProcMention {
  id: bigint;
  comment_id: bigint;
  mentioned_user_id: bigint;
  mentioned_user_name?: string;
  mentioned_by_user_id: bigint;
  entity_type: string;
  entity_id: bigint;
  created_at?: Date;
}

export interface AdminProcAccess {
  id: bigint;
  user_id: bigint;
  user_name?: string;
  granted_by: bigint;
  granted_by_name?: string;
  granted_at?: Date;
  is_active?: boolean;
}

// DTOs for creating/updating
export interface CreateAdminProcOrderDTO {
  category_id: bigint;
  title: string;
  description?: string;
  status_id: bigint;
  priority_id?: bigint;
  deadline?: Date;
  created_by: bigint;
  notes?: string;
  // حقول العطاءات
  tender_id?: string;
  donor_client?: string;
  announcement_link?: string;
  submission_deadline?: Date;
  initial_notes?: string;
  // حقول الموارد البشرية
  hr_type?: string;
  leave_type?: string;
  employee_id?: bigint;
  start_date?: Date;
  end_date?: Date;
  days_count?: number;
  leave_time_from?: string;
  leave_time_to?: string;
  reason?: string;
  substitute_id?: bigint;
}

export interface UpdateAdminProcOrderDTO {
  title?: string;
  description?: string;
  status_id?: bigint;
  priority_id?: bigint;
  deadline?: Date;
  notes?: string;
}

export interface CreateAdminProcTaskDTO {
  admin_order_id: bigint;
  title: string;
  description?: string;
  status_id: bigint;
  priority_id?: bigint;
  deadline?: Date;
  sequence_order?: number;
  created_by: bigint;
  estimated_duration?: number;
  assigned_users?: bigint[];
}

export interface UpdateAdminProcTaskDTO {
  title?: string;
  description?: string;
  status_id?: bigint;
  priority_id?: bigint;
  deadline?: Date;
  sequence_order?: number;
  estimated_duration?: number;
}

export interface CreateAdminProcTaskCommentDTO {
  admin_task_id: bigint;
  user_id: bigint;
  comment: string;
  mentioned_user_ids?: bigint[];
}

export interface CreateAdminProcTaskAttachmentDTO {
  admin_task_id: bigint;
  title?: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: bigint;
  uploaded_by: bigint;
}

export interface AdminProcOrderFilters {
  category_id?: bigint;
  status_id?: bigint;
  is_archived?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AdminProcTaskFilters {
  status_id?: bigint;
  is_archived?: boolean;
  limit?: number;
  offset?: number;
}

// Response types
export interface AdminProcResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface AdminProcListResponse<T> {
  success: boolean;
  data: T[];
  error?: string;
  timestamp?: string;
}
