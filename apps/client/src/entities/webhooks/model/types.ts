import { ApiResponse } from '@repo/shared/types';

export interface Webhook {
  id: number;
  target_url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

export interface WebhookListData {
  webhooks: Webhook[];
}

export interface CreateWebhookRequest {
  target_url: string;
  events: string[];
}

export interface UpdateWebhookRequest {
  target_url?: string;
  events?: string[];
}

export interface CreateWebhookData extends Webhook {
  secret: string;
}

export type CreateWebhookResponse = ApiResponse<CreateWebhookData>;
export type UpdateWebhookResponse = ApiResponse<Webhook>;
export type WebhookListResponse = ApiResponse<WebhookListData>;

export type { WebhookFormType } from './schema';
