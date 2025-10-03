export interface WhoAmI {
  sub: string;
  email: string;
  role: string | null;
  roleConfirmed: boolean;
}
