import { Result } from "../types";

export default {
  success<T>(data: T): Result<T> {
    return {
      code: 200,
      msg: "success",
      data,
    };
  },

  fail(msg: string, code: number = 500): Result<null> {
    return {
      code,
      msg,
      data: null,
    };
  },
};
