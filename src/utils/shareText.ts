/**
 * 「获取」成功后的口令文案
 *
 * 各盘型官方口令格式不同（APP 靠读剪贴板识别，格式错了打不开或弹不出转存窗）：
 * - 夸克：多行，开头话术 + 「链接：」「提取码：」标签行
 * - 百度：单行「链接：xxx 提取码：xxx」+ 官方提示语
 * - 迅雷：链接带 ?pwd=xxx# + App 话术
 * - UC：多行「来自UC网盘分享文件：」开头
 *
 * 识别不了盘型时回退夸克格式。
 */

export type ShareDriver = "quark" | "baidu" | "xunlei" | "uc";

export function driverOf(text?: string): ShareDriver | null {
  if (!text) return null;
  if (text.includes("pan.quark.cn")) return "quark";
  if (text.includes("pan.baidu.com")) return "baidu";
  if (text.includes("pan.xunlei.com")) return "xunlei";
  if (text.includes("drive.uc.cn")) return "uc";
  return null;
}

/** 提示语里的 APP 名；识别不了就退回中性「对应网盘」 */
export function appNameOf(text?: string): string {
  const d = driverOf(text);
  if (d === "baidu") return "百度网盘";
  if (d === "quark") return "夸克";
  if (d === "xunlei") return "迅雷";
  if (d === "uc") return "UC网盘";
  return "对应网盘";
}

export function buildShareText(data: {
  share_url?: string;
  passcode?: string;
  name?: string;
}): string {
  const link = data.share_url || "";
  const name = (data.name || "").trim();
  const code = data.passcode || "";
  const driver = driverOf(link);

  if (driver === "baidu") {
    const base = code ? `链接：${link} 提取码：${code}` : `链接：${link}`;
    return name
      ? `${base} 我用百度网盘分享了「${name}」，复制这段内容后打开百度网盘手机App，操作更方便哦`
      : base;
  }

  if (driver === "xunlei") {
    const linkWithPwd = code
      ? `${link}${link.includes("?") ? "&" : "?"}pwd=${code}#`
      : link;
    return `${linkWithPwd} 复制这段内容后打开「手机迅雷 App」即可获取。无需下载在线查看，视频原画享倍速播放`;
  }

  if (driver === "uc") {
    const lines: string[] = ["来自UC网盘分享文件："];
    if (name) lines.push(`「${name}」`);
    lines.push("上传下载快，畅享原画播放和云解压，可电视投屏。点击链接立刻保存。");
    lines.push(`链接：${link}`);
    if (code) lines.push(`提取码：${code}`);
    return lines.join("\n");
  }

  const head = name
    ? `我用夸克网盘给你分享了「${name}」，点击链接或复制整段内容，打开「夸克APP」即可获取。`
    : "点击链接或复制整段内容，打开「夸克APP」即可获取。";
  return code
    ? `${head}
链接：${link}
提取码：${code}`
    : `${head}
链接：${link}`;
}
