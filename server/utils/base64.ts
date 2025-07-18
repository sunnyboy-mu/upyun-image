export function base64Encode(input: string): string {
  const base64Chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes: number[] = [];

  // 将字符串转换为字节数组
  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i);
    if (charCode > 0xff) {
      throw new Error("Character code out of range 0-255");
    }
    bytes.push(charCode);
  }

  // 计算需要填充的字节数
  const pad = (3 - (bytes.length % 3)) % 3;
  // 填充0字节使其长度为3的倍数
  const paddedBytes = [...bytes];
  for (let i = 0; i < pad; i++) {
    paddedBytes.push(0);
  }

  let result = "";
  // 处理每个3字节组
  for (let i = 0; i < paddedBytes.length; i += 3) {
    const b1 = paddedBytes[i];
    const b2 = paddedBytes[i + 1];
    const b3 = paddedBytes[i + 2];

    // 计算4个6位索引
    const i1 = (b1 & 0xfc) >> 2;
    const i2 = ((b1 & 0x03) << 4) | ((b2 & 0xf0) >> 4);
    const i3 = ((b2 & 0x0f) << 2) | ((b3 & 0xc0) >> 6);
    const i4 = b3 & 0x3f;

    // 转换为Base64字符
    result +=
      base64Chars[i1] + base64Chars[i2] + base64Chars[i3] + base64Chars[i4];
  }

  // 替换填充字节对应的位置为等号
  if (pad > 0) {
    result = result.slice(0, result.length - pad) + (pad === 2 ? "==" : "=");
  }

  return result;
}
