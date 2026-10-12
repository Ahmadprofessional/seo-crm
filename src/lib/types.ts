// Keyword row as stored in Google Sheets
export interface Keyword {
  id: string;
  keyword: string;
  volume: number;
  category: string;
  status: string;
  priority: string;
  target_url: string;
  assigned_to: string;
  content: string;
  meta_title: string;
  meta_description: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// For creating a new keyword (id, timestamps generated server-side)
export interface KeywordCreate {
  keyword: string;
  volume: number;
  category: string;
  status?: string;
  priority?: string;
  target_url?: string;
  assigned_to?: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
  notes?: string;
}

// For updating a keyword (all fields optional except id)
export interface KeywordUpdate {
  id: string;
  keyword?: string;
  volume?: number;
  category?: string;
  status?: string;
  priority?: string;
  target_url?: string;
  assigned_to?: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
  notes?: string;
}

// Activity log row
export interface ActivityRow {
  timestamp: string;
  user: string;
  keyword_id: string;
  action: string;
  old_value: string;
  new_value: string;
}

// Settings from the Settings tab
export interface Settings {
  statuses: string[];
  categories: string[];
  users: string[];
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalKeywords: number;
  totalVolume: number;
  publishedCount: number;
  researchCount: number;
  statusCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  topKeywords: Keyword[];
}

// Column headers for each tab
export const KEYWORD_HEADERS = [
  'id', 'keyword', 'volume', 'category', 'status', 'priority',
  'target_url', 'assigned_to', 'content', 'meta_title',
  'meta_description', 'notes', 'created_at', 'updated_at',
] as const;

export const ACTIVITY_HEADERS = [
  'timestamp', 'user', 'keyword_id', 'action', 'old_value', 'new_value',
] as const;

export const SETTINGS_HEADERS = ['statuses', 'categories', 'users'] as const;

// Default values
export const DEFAULT_STATUSES = ['Research', 'Planned', 'Drafting', 'Review', 'Published'];
export const DEFAULT_CATEGORIES = [
  'Aesthetic Clinic',
  'Location',
  'Dermatologist',
  'Botox & Anti-wrinkle',
  'Dermal & Lip Fillers',
  'Filler Dissolving',
  'Non-surgical Rhinoplasty',
  'Laser Hair Removal',
];
export const PRIORITIES = ['Low', 'Medium', 'High'] as const;
export type Priority = typeof PRIORITIES[number];
