/**
 * types.ts
 * 
 * TypeScript data types and configurations for the Telegram Funnel Bot Simulator.
 */

export interface SimulatedConfig {
  dbHost: string;
  dbName: string;
  dbUser: string;
  telegramToken: string;
  channelId: string;
}

export enum BotStep {
  STEP_1 = 1, // Joined, received Welcome (GET BONUS)
  STEP_2 = 2, // Clicked GET BONUS, received Photo 1 + Redirect
  STEP_3 = 3, // Stagnated 10s, received Photo 2 (Salary)
  STEP_4 = 4  // Passed 5s, received Media Group album
}

export interface SimulatedUser {
  id: number;
  userId: number;
  username: string;
  firstName: string;
  step: BotStep;
  actionTimestamp: string; // ISO String
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  joinedSimSecsAgo: number; // For visualization
}

export interface CallbackLog {
  id: number;
  userId: number;
  callbackData: string;
  createdAt: string;
}

export interface WorkerLog {
  id: number;
  userId: number;
  actionType: string;
  createdAt: string;
}

export interface SystemLog {
  id: number;
  timestamp: string;
  type: 'webhook' | 'worker' | 'error';
  message: string;
}

export type ActiveTab = 'simulator' | 'code' | 'database' | 'logs' | 'architecture';
export type ActiveCodeFile = 'install.php' | 'db_connect.php' | 'telegram_api.php' | 'webhook_handler.php' | 'timer_worker.php' | 'cron_job.sh';
export type ActiveDbTable = 'users' | 'callback_logs' | 'worker_logs';
