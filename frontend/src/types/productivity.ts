export interface CalendarEventResponse {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  type: "interview" | "practice" | "custom";
  status: "scheduled" | "rescheduled" | "cancelled";
  meeting_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventCreate {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  type?: "interview" | "practice" | "custom";
  status?: "scheduled" | "rescheduled" | "cancelled";
  meeting_link?: string;
}

export interface CalendarEventUpdate {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  type?: "interview" | "practice" | "custom";
  status?: "scheduled" | "rescheduled" | "cancelled";
  meeting_link?: string;
}

export interface NotificationResponse {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface ReminderResponse {
  id: number;
  user_id: number;
  title: string;
  reminder_type: "streak" | "smart" | "missed_practice" | "custom";
  trigger_time: string;
  is_sent: boolean;
  ai_suggestion: string | null;
  created_at: string;
}

export interface GoalResponse {
  id: number;
  user_id: number;
  title: string;
  type: "weekly" | "monthly" | "company" | "coding" | "communication";
  target_value: number;
  current_value: number;
  deadline: string | null;
  status: "in_progress" | "completed" | "failed";
  created_at: string;
}

export interface GoalCreate {
  title: string;
  type: "weekly" | "monthly" | "company" | "coding" | "communication";
  target_value: number;
  deadline?: string;
}

export interface GoalUpdateProgress {
  current_value?: number;
  status?: "in_progress" | "completed" | "failed";
}

export interface TaskResponse {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  deadline: string | null;
  is_completed: boolean;
  is_daily_checklist: boolean;
  created_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  deadline?: string;
  is_daily_checklist?: boolean;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  deadline?: string;
  is_completed?: boolean;
}

export interface EmailLogResponse {
  id: number;
  user_id: number | null;
  recipient_email: string;
  template_type: string;
  subject: string;
  sent_at: string;
  status: string;
}
