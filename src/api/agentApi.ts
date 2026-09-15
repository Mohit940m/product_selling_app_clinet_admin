import axios from 'axios';
import type { ChatResponse, ConversationDetail, ConversationSummary, ChatAction } from '../components/assistant/types';

const AGENT_BASE_URL = import.meta.env.VITE_AGENT_URL ?? 'http://localhost:4100';

// The seller assistant (product_selling_app_agent, /api/v1/seller-chat). One
// turn can run several tool calls plus model calls, so allow longer than sellerApi.
const agentApi = axios.create({
  baseURL: `${AGENT_BASE_URL}/api/v1/seller-chat`,
  timeout: 90000,
});

agentApi.interceptors.request.use((config) => {
  let token: string | null = null;
  try {
    token = localStorage.getItem('sellerToken');
  } catch {
    // Storage blocked: the agent will answer 401.
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const sendChat = async (body: { conversationId?: string | null; message?: string; action?: ChatAction }) => {
  const { data } = await agentApi.post<ChatResponse>('/message', {
    ...body,
    conversationId: body.conversationId ?? undefined,
  });
  return data;
};

export const listConversations = async () => {
  const { data } = await agentApi.get<{ conversations: ConversationSummary[] }>('/conversations');
  return data.conversations;
};

export const getConversation = async (id: string) => {
  const { data } = await agentApi.get<{ conversation: ConversationDetail }>(`/conversations/${id}`);
  return data.conversation;
};

export const deleteConversation = async (id: string) => {
  await agentApi.delete(`/conversations/${id}`);
};

/** A readable message for any failed agent call. */
export const agentErrorMessage = (err: unknown) => {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Can’t reach the assistant service. Is it running?';
    return err.response.data?.message ?? 'The assistant couldn’t respond. Please try again.';
  }
  return 'The assistant couldn’t respond. Please try again.';
};
