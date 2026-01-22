export interface Cart {
  id: string;
  user_id: string;
  username: string;
  prompt: string;
  model: string;
  code: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
}

export enum ModelType {
  GEMINI_2_5 = "gemini-2.5",
  GEMINI_3 = "gemini-3"
}