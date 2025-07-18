import { env } from "cloudflare:workers";

/**
 * 又拍云 API 地址
 */
export const UpyunBaseUrl = `https://v0.api.upyun.com/${env.BUCKET}/`;
