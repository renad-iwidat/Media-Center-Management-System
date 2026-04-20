/**
 * Manual Input Model
 * نموذج بيانات الإدخال اليدوي
 */

export type InputType = 'text' | 'audio' | 'video';

export interface ManualInputData {
  source_id: number;
  source_type_id: number;
  category_id: number;
  url: null;
  title: string;
  content: string;
  image_url?: string;
  tags?: string[];
  fetch_status: 'fetched';
  created_by: number;
  media_unit_id: number;
  uploaded_file_id?: number;
}

export interface ManualInputResponse {
  id: number;
  source_id: number;
  source_type_id: number;
  category_id: number;
  title: string;
  fetch_status: string;
  fetched_at: Date;
}

export interface CategoryData {
  id: number;
  name: string;
  slug: string;
  flow: 'automated' | 'editorial';
  is_active: boolean;
}

export interface SourceData {
  id: number;
  name: string;
  source_type_id: number;
  is_active: boolean;
  input_type?: InputType;
}

export interface ManualInputSources {
  text: SourceData;
  audio: SourceData;
  video: SourceData;
}
