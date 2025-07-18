export interface AppEnv {
  Bindings: {
    BUCKET: string;
    OPERATOR: string;
    PASSWORD: string;
    DOMAIN: string;
    AUTH_CODE: string;
  };
}

export interface Result<T> {
  code: number;
  msg: string;
  data: T;
}
