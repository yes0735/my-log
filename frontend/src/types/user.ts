export interface User {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl?: string;
  provider: 'LOCAL' | 'GOOGLE' | 'GITHUB' | 'KAKAO';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
