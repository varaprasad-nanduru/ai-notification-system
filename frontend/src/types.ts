export type Priority = 'high' | 'medium' | 'low';
export type Category =
  | 'security'
  | 'system'
  | 'social'
  | 'commerce'
  | 'alert'
  | 'info'
  | 'warning';

export interface Notification {
  id: string;
  title: string;
  message: string;
  source: string;
  created_at: string;
  is_read: boolean;
  priority: Priority;
  category: Category;
  is_spam: boolean;
  urgency_score: number;
  ai_reason: string;
}

export type WSMessage =
  | { type: 'initial'; data: Notification[] }
  | { type: 'new'; data: Notification }
  | { type: 'update'; data: Notification }
  | { type: 'delete'; data: { id: string } };

export type FilterOption = 'all' | 'unread' | 'high' | 'medium' | 'low';
