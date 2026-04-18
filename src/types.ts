export interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  source?: 'local' | 'online';
  confidence?: number;
}

export interface User {
  id: number;
  username: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  sessionId: string;
}
