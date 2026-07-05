export type AuthClaims = Record<string, unknown> & {
  sub?: string;
  sid?: string;
  org_id?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  role?: string;
};

export type AuthContext = {
  userId: string | null;
  sessionId: string | null;
  orgId: string | null;
  authType: 'session' | 'api_key' | null;
  role: string | null;
  claims: AuthClaims | null;
};
