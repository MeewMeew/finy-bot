import type { API, CreatePollResponse, GroupMessage, Mention, Message, MessageContent } from "zca-js";

// Main Configuration Interface
export interface Config {
  prefix: string; // Command prefix
  admins: string[]; // List of admin user IDs
  customerCare: CustomerCareConfig; // Customer care configuration
  userAgent: string; // User agent string for the API
  knownPhoneNumbers: Record<string, string>; // List of known phone numbers
  polls: PollConfig[]; // List of poll configurations
}

// Customer Care Configuration
export interface CustomerCareConfig {
  index: number; // Current template index for tracking
  delay: number; // Delay between messages in seconds
  templates: CustomerCareTemplate[]; // List of message templates
  schedule: ScheduleConfig; // Scheduling configuration
  phoneNumbers: string[]; // List of customer phone numbers
}

// Poll Configuration
export interface PollConfig {
  pollId: string; // Poll ID for the poll
  threadId: string; // Thread ID for the poll
  question: string; // Poll question
  options: string[]; // Poll options
  schedule: ScheduleConfig; // Scheduling configuration
}

export interface ScheduleConfig {
  lastCronTime: string | null; // Last cron time
  data: ScheduleData; // Scheduling configuration
}

// Schedule Frequency
export type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';

// Schedule Type
export type ScheduleType = 'cskh' | 'poll';

// Schedule Configuration
export type ScheduleData =
  | [] // No schedule
  | [ScheduleFrequency, string] // Frequency and time (e.g., 'daily', '08:00')
  | ['weekly' | 'monthly', string, number] // Weekly/Monthly + time + day (e.g., 'weekly', '08:00', 5 for Friday)
  | ['yearly', string, number, number]; // Yearly + time + month + day



// Customer Care Template
export interface CustomerCareTemplate {
  text: string; // Template text
  image: string; // Image URL or path
}

// Phone Data Structure (Excel Import)
export interface Phone {
  Phone: string; // Phone number field from Excel
}

// Global Data (Placeholder for shared runtime data)
export interface GlobalData {
  // Define shared state or temporary data here if needed
}

// Module Function Props
export interface ModuleProps {
  api: API; // Zalo API instance
  args: string[]; // Command arguments
  data: GlobalData; // Shared runtime data
  event: Message; // Message triggering the module
  send: (msg: string | MessageContent, quote?: boolean) => any; // Message sending function
}

export interface ScheduleModuleProps {
  api: API; // Zalo API instance
  data: GlobalData; // Shared runtime data  
}