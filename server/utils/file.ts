/**
 * 获取文件扩展名
 * @param filename - 文件名（包含扩展名）
 * @returns 文件扩展名（不包含点），如果无扩展名则返回空字符串
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop() || "";
}
