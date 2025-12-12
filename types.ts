export interface GameState {
  status: 'idle' | 'generating' | 'ready' | 'error';
  code: string | null;
  error: string | null;
  prompt: string;
}

export interface GeneratedResponse {
  code: string;
}
