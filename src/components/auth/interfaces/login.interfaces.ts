export interface ILoginResult {
  uniqueId: string;
  nickname: string;
  emailAddress: string;
  profileImageURL: string;
}

export interface ILoginResponse {
  isNewUser: boolean;
  accessToken: string;
  nickname: string;
  profileImageURL: string;
}
