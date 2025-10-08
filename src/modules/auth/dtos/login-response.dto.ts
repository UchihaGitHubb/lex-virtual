export class LoginResponseDto {
  message: string;
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string | null;
    roleConfirmed: boolean;
  };
}
