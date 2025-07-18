import { env } from "cloudflare:workers";
import { base64Encode } from "./base64";
import { UpyunBaseUrl } from "../config";
import { formatDate, getNowTime } from "./date";
import { getFileExtension } from "./file";
import R from "./result";

/**
 * 基本认证 Authorization
 */
function getAuthorization(): string {
  return `Basic ${base64Encode(`${env.OPERATOR}:${env.PASSWORD}`)}`;
}

/**
 * 上传文件
 * @param file
 */
export async function upload(
  file: File,
  folder: string = formatDate("YYYY/MM/DD")
) {
  const headers = {
    Date: new Date().toISOString(),
    "Content-Length": file.size.toString(),
    Authorization: getAuthorization(),
  };

  if (!folder.endsWith("/")) {
    folder += "/";
  }
  const filePath = `${folder}${getNowTime()}.${getFileExtension(file.name)}`;
  try {
    const res = await fetch(UpyunBaseUrl + filePath, {
      method: "PUT",
      headers,
      body: file,
    });
    if (res.status === 200) {
      return R.success<string>(`${env.DOMAIN}/${filePath}`);
    } else {
      return R.fail(res.statusText);
    }
  } catch (error: Error | any) {
    return R.fail(error?.message);
  }
}
