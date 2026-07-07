import type {
  CalendarEventResponse,
  CalendarEventCreate,
  CalendarEventUpdate,
  NotificationResponse,
  ReminderResponse,
  GoalResponse,
  GoalCreate,
  GoalUpdateProgress,
  TaskResponse,
  TaskCreate,
  TaskUpdate,
  EmailLogResponse,
} from "@/types/productivity";

import { apiFetch as globalApiFetch } from "@/lib/api";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await globalApiFetch(path, {
    ...options,
    json: options.body ? JSON.parse(options.body as string) : undefined
  } as unknown as Parameters<typeof globalApiFetch>[1]);

  if (res.status === 204) {
    return undefined as unknown as T;
  }
  return (await res.json()) as T;
}

// 1. Calendar APIs
export const listCalendarEvents = (): Promise<CalendarEventResponse[]> =>
  apiFetch<CalendarEventResponse[]>("/api/productivity/calendar");

export const createCalendarEvent = (
  payload: CalendarEventCreate
): Promise<CalendarEventResponse> =>
  apiFetch<CalendarEventResponse>("/api/productivity/calendar", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateCalendarEvent = (
  eventId: number,
  payload: CalendarEventUpdate
): Promise<CalendarEventResponse> =>
  apiFetch<CalendarEventResponse>(`/api/productivity/calendar/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const cancelCalendarEvent = (
  eventId: number
): Promise<{ detail: string }> =>
  apiFetch<{ detail: string }>(`/api/productivity/calendar/${eventId}`, {
    method: "DELETE",
  });

// 2. Goals APIs
export const listGoals = (): Promise<GoalResponse[]> =>
  apiFetch<GoalResponse[]>("/api/productivity/goals");

export const createGoal = (payload: GoalCreate): Promise<GoalResponse> =>
  apiFetch<GoalResponse>("/api/productivity/goals", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateGoalProgress = (
  goalId: number,
  payload: GoalUpdateProgress
): Promise<GoalResponse> =>
  apiFetch<GoalResponse>(`/api/productivity/goals/${goalId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteGoal = (goalId: number): Promise<{ detail: string }> =>
  apiFetch<{ detail: string }>(`/api/productivity/goals/${goalId}`, {
    method: "DELETE",
  });

// 3. Tasks APIs
export const listTasks = (): Promise<TaskResponse[]> =>
  apiFetch<TaskResponse[]>("/api/productivity/tasks");

export const createTask = (payload: TaskCreate): Promise<TaskResponse> =>
  apiFetch<TaskResponse>("/api/productivity/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateTask = (
  taskId: number,
  payload: TaskUpdate
): Promise<TaskResponse> =>
  apiFetch<TaskResponse>(`/api/productivity/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteTask = (taskId: number): Promise<{ detail: string }> =>
  apiFetch<{ detail: string }>(`/api/productivity/tasks/${taskId}`, {
    method: "DELETE",
  });

// 4. Notifications APIs
export const listNotifications = (): Promise<NotificationResponse[]> =>
  apiFetch<NotificationResponse[]>("/api/productivity/notifications");

export const markNotificationRead = (
  notifId: number
): Promise<NotificationResponse> =>
  apiFetch<NotificationResponse>(`/api/productivity/notifications/${notifId}/read`, {
    method: "PATCH",
  });

export const clearAllNotifications = (): Promise<{ detail: string }> =>
  apiFetch<{ detail: string }>("/api/productivity/notifications/clear-all", {
    method: "POST",
  });

// 5. Reminders APIs
export const listReminders = (): Promise<ReminderResponse[]> =>
  apiFetch<ReminderResponse[]>("/api/productivity/reminders");

export const triggerStreakReminder = (): Promise<ReminderResponse> =>
  apiFetch<ReminderResponse>("/api/productivity/reminders/streak", {
    method: "POST",
  });

export const generateSmartReminder = (): Promise<ReminderResponse> =>
  apiFetch<ReminderResponse>("/api/productivity/reminders/generate-smart", {
    method: "POST",
  });

// 6. Email APIs
export const listEmailLogs = (): Promise<EmailLogResponse[]> =>
  apiFetch<EmailLogResponse[]>("/api/productivity/emails/logs");

export const triggerTestEmail = (
  templateType: string,
  recipientEmail?: string
): Promise<unknown> => {
  const query = recipientEmail ? `?recipient_email=${encodeURIComponent(recipientEmail)}` : "";
  return apiFetch<unknown>(`/api/productivity/emails/trigger-test?template_type=${templateType}${query}`, {
    method: "POST",
  });
};
