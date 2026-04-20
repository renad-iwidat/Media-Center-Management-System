// Content Types
export interface Content {
  id: bigint;
  title: string;
  content_type_id?: bigint;
  owner_type?: string;
  owner_id?: bigint;
  status_id?: bigint;
  is_final?: boolean;
  sequence_order?: number;
  media_unit_id?: bigint;
  created_by?: bigint;
  created_at?: Date;
  tags?: string[];
  // New fields
  task_id?: bigint;
  cloud_url?: string;
  file_size?: number;
  duration?: number;
  version?: number;
  is_archived?: boolean;
  archived_at?: Date;
}

export interface ContentType {
  id: bigint;
  name: string;
}

export interface ContentStatus {
  id: bigint;
  name: string;
  description?: string;
}

export interface ContentSource {
  id: bigint;
  content_id?: bigint;
  published_item_id?: bigint;
}

export interface ContentTag {
  content_id: bigint;
  tag_id: bigint;
}

export interface ContentTask {
  id?: bigint;
  content_id: bigint;
  task_id: bigint;
  // New fields
  usage_type?: string; // 'input', 'output', 'reference', 'attachment'
  linked_at?: Date;
  linked_by?: bigint;
  notes?: string;
}

// Published Items Types
export interface PublishedItem {
  id: bigint;
  media_unit_id?: bigint;
  raw_data_id?: bigint;
  queue_id?: bigint;
  content_type_id?: bigint;
  title?: string;
  content?: string;
  tags?: string[];
  is_active?: boolean;
  published_at?: Date;
}

// Episode & Program Types
export interface Episode {
  id: bigint;
  program_id?: bigint;
  title: string;
  episode_number?: number;
  air_date?: Date;
  created_at?: Date;
}

export interface Program {
  id: bigint;
  title: string;
  description?: string;
  media_unit_id?: bigint;
  created_at?: Date;
  air_time?: string;
}

// Guest Types
export interface Guest {
  id: bigint;
  name: string;
  title?: string;
  bio?: string;
  created_at?: Date;
  phone?: string;
}

export interface EpisodeGuest {
  episode_id: bigint;
  guest_id: bigint;
}
