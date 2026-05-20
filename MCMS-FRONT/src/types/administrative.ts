// Administrative Procedures Types - Frontend
// أنواع نظام الإجراءات الإدارية

export interface AdminProcCategory {
  id: number | string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminProcOrder {
  id: number | string;
  category_id: number | string;
  title: string;
  description?: string;
  status_id: number | string;
  priority_id?: number | string;
  deadline?: string;
  created_by: number | string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  is_archived?: boolean;
  archived_at?: string;
  notes?: string;
  updated_at?: string;
  // حقول العطاءات
  tender_id?: string;
  donor_client?: string;
  announcement_link?: string;
  submission_deadline?: string;
  initial_notes?: string;
  // حقول الموارد البشرية
  hr_type?: string;
  leave_type?: string;
  employee_id?: number | string;
  employee_name?: string;
  start_date?: string;
  end_date?: string;
  days_count?: number;
  leave_time_from?: string;
  leave_time_to?: string;
  reason?: string;
  substitute_id?: number | string;
  substitute_name?: string;
  // Joined fields
  category_name?: string;
  status_name?: string;
  priority_name?: string;
  created_by_name?: string;
  tasks_count?: number;
  completed_tasks_count?: number;
}

export interface AdminProcTaskAssignment {
  id: number | string;
  admin_task_id: number | string;
  assigned_to: number | string;
  assigned_by: number | string;
  assigned_at?: string;
  assigned_to_name?: string;
  assigned_by_name?: string;
}

export interface AdminProcTask {
  id: number | string;
  admin_order_id: number | string;
  title: string;
  description?: string;
  status_id: number | string;
  priority_id?: number | string;
  deadline?: string;
  sequence_order?: number;
  created_by: number | string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  is_archived?: boolean;
  archived_at?: string;
  estimated_duration?: number;
  actual_duration?: number;
  // Joined fields
  status_name?: string;
  priority_name?: string;
  created_by_name?: string;
  assignees?: AdminProcTaskAssignment[];
  comments_count?: number;
  attachments_count?: number;
  order_title?: string;
  category_name?: string;
}

export interface AdminProcMention {
  id: number | string;
  comment_id: number | string;
  mentioned_user_id: number | string;
  mentioned_by_user_id: number | string;
  entity_type: 'order' | 'task';
  entity_id: number | string;
  created_at?: string;
  mentioned_user_name?: string;
  mentioned_by_user_name?: string;
}

export interface AdminProcTaskComment {
  id: number | string;
  admin_task_id: number | string;
  user_id: number | string;
  comment: string;
  is_edited?: boolean;
  edited_by?: number | string;
  edited_by_name?: string;
  edited_at?: string;
  created_at?: string;
  updated_at?: string;
  user_name?: string;
  mentions?: AdminProcMention[];
}

export interface AdminProcTaskAttachment {
  id: number | string;
  admin_task_id: number | string;
  title?: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: number | string;
  uploaded_by: number | string;
  created_at?: string;
  updated_at?: string;
  uploaded_by_name?: string;
}

export interface AdminProcTaskHistory {
  id: number | string;
  admin_task_id: number | string;
  old_status_id?: number | string;
  new_status_id: number | string;
  changed_by: number | string;
  changed_at?: string;
  notes?: string;
  old_status_name?: string;
  new_status_name?: string;
  changed_by_name?: string;
}

export interface AdminProcArchive {
  id: number | string;
  admin_order_id?: number | string;
  admin_task_id?: number | string;
  admin_attachment_id?: number | string;
  category_id?: number | string;
  entity_type: 'order' | 'task' | 'attachment';
  entity_data?: any;
  archived_by: number | string;
  archived_at?: string;
  reason?: string;
  archived_by_name?: string;
  
  // معلومات الملف (لو entity_type = 'attachment')
  title?: string;
  description?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number | string;
  file_name?: string;
  s3_key?: string;
  s3_bucket?: string;
  uploaded_by?: number | string;
  uploaded_by_name?: string;
  tags?: string[];
  
  // Joined fields
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  order_title?: string;
  task_title?: string;
}

export interface AdminProcAccess {
  id: number | string;
  user_id: number | string;
  granted_by: number | string;
  granted_at?: string;
  is_active?: boolean;
  user_name?: string;
  granted_by_name?: string;
}

// Response types
export interface AdminProcResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp?: string;
}

export interface AdminProcListResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
  error?: string;
  timestamp?: string;
}
