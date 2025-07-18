import { Context, Next } from "hono";
import { AppEnv } from "../types";
import R from "../utils/result";
import { base64Encode } from "../utils/base64";

/**
 * 认证中间件
 * @param c Hono 上下文
 * @param next 下一个中间件函数
 * @returns Promise<Response>
 */
export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(R.fail("未经授权的访问", 401));
  }

  const token = authHeader.substring(7);

  if (base64Encode(c.env.AUTH_CODE) !== token) {
    return c.json(R.fail("无效的令牌", 401));
  }
  return next();
}
