type DateParam = Date | string | number;

/**
 * 获取当前时间的时间戳字符串
 * @returns 返回当前时间的时间戳字符串
 */
export function getNowTime(): string {
  return new Date().getTime().toString();
}

/**
 * 日期格式化函数
 * @param format 格式字符串（示例：YYYY-MM-DD HH:mm:ss）
 * @param date 可选日期参数（支持 Date 对象、时间戳、日期字符串）
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  format: string = "YYYY-MM-DD",
  date?: DateParam
): string {
  // 处理日期输入
  let targetDate: Date;
  try {
    targetDate = date ? new Date(date) : new Date();
    if (isNaN(targetDate.getTime())) throw new Error("Invalid date");
  } catch (e) {
    console.warn("Invalid date input, using current time");
    targetDate = new Date();
  }

  // 补零函数
  const pad = (n: number, length: number = 2) =>
    n.toString().padStart(length, "0");

  // 月份缩写
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // 创建替换映射（按优先级从长到短排序）
  const replacements: { [key: string]: string } = {
    YYYY: targetDate.getFullYear().toString(),
    YY: targetDate.getFullYear().toString().slice(-2),
    MMMM: months[targetDate.getMonth()],
    MMM: months[targetDate.getMonth()].slice(0, 3),
    MM: pad(targetDate.getMonth() + 1),
    M: (targetDate.getMonth() + 1).toString(),
    DD: pad(targetDate.getDate()),
    D: targetDate.getDate().toString(),
    HH: pad(targetDate.getHours()),
    H: targetDate.getHours().toString(),
    hh: pad(targetDate.getHours() % 12 || 12),
    h: (targetDate.getHours() % 12 || 12).toString(),
    mm: pad(targetDate.getMinutes()),
    m: targetDate.getMinutes().toString(),
    ss: pad(targetDate.getSeconds()),
    s: targetDate.getSeconds().toString(),
    SSS: pad(targetDate.getMilliseconds(), 3),
    a: targetDate.getHours() >= 12 ? "PM" : "AM",
  };

  // 按优先级顺序替换（优先处理较长格式）
  return Object.keys(replacements)
    .sort((a, b) => b.length - a.length)
    .reduce(
      (str, key) => str.replace(new RegExp(key, "g"), replacements[key]),
      format
    );
}
