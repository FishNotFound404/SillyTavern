export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  token: string;
  refreshToken: string;
  user: User;
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  personality?: string;
  scenario?: string;
  firstMessage?: string;
  avatarUrl?: string;
  worldInfo?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags: string[];
}

export interface Conversation {
  id: string;
  title?: string;
  character?: Character;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  tokensUsed?: number;
}

export interface File {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}
