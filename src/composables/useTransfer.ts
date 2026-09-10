/**
 * 「获取」交互（返利闭环的前端一半）
 *
 * 前端只持有一个轻量状态：key → idle | loading | done | dead。
 * 真正的转存编排全在服务端 POST /api/transfer（鉴权/限频/缓存/回退），
 * 前端不做任何链接解析——没有 tid 的链接不出现「获取」按钮。
 *
 * 为什么第三方站点也必须走这个接口：
 * 服务端对已接入转存的盘型会剥离真实直链、只下发 tid，
 * 因此只有调 /api/transfer 才能换回可用的分享链接。
 *
 * 成功：弹窗里展示「复制」按钮，用户点击才写入剪贴板；
 * 失败：确定性失效给出原因并禁用按钮，其余情况静默回退原链接。
 */
import { computed, ref } from "vue";
import { apiPost } from "../api/client";
import { ApiError } from "../api/client";
import { appNameOf, buildShareText } from "../utils/shareText";

export type TransferStatus = "idle" | "loading" | "done" | "dead";

/** 模块级单例：跨 ResultGroup 实例共享状态与弹窗 */
const statusMap = ref<Record<string, TransferStatus>>({});
/** key → 已生成的口令文本（done 后再点不再请求后端） */
const shareTextCache = ref<Record<string, string>>({});
/** key → 失效原因（dead 后再点直接展示） */
const deadMsgCache = ref<Record<string, string>>({});

/** 全局在跑的「获取」动作数：>0 时禁止再发起新的获取 */
const busyCount = ref(0);
const anyBusy = computed(() => busyCount.value > 0);

type TransferDialogStatus = "loading" | "ready" | "copied" | "dead" | "error";

const dialogOpen = ref(false);
const dialogStatus = ref<TransferDialogStatus>("loading");
const dialogMsg = ref("");
const dialogKey = ref("");

function openTransferDialog(key: string, ready = false): void {
  dialogKey.value = key;
  dialogStatus.value = ready ? "ready" : "loading";
  dialogMsg.value = "";
  dialogOpen.value = true;
}

function closeTransferDialog(): void {
  dialogOpen.value = false;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 兜底：非安全上下文 / 权限被拒时用 execCommand
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

/** 弹窗内「复制」按钮 */
async function copyFromDialog(): Promise<boolean> {
  const text = shareTextCache.value[dialogKey.value];
  if (!text) return false;
  const copied = await copyText(text);
  const app = appNameOf(text);
  dialogStatus.value = "copied";
  dialogMsg.value = copied ? `已复制，请打开${app}APP粘贴保存` : "复制失败，请重试一次";
  return copied;
}

function failTransferDialog(
  msg: string,
  status: TransferDialogStatus = "error"
): void {
  dialogStatus.value = status;
  dialogMsg.value = msg;
}

/** 弹窗视图层绑定 */
export function useTransferDialog() {
  return {
    dialogOpen,
    dialogStatus,
    dialogMsg,
    closeTransferDialog,
    copyFromDialog,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useTransfer() {
  function statusOf(key?: string): TransferStatus {
    return (key && statusMap.value[key]) || "idle";
  }

  /**
   * 点击「获取」：有 tid → 真实转存换链接；没有 tid → 转约 1 秒圈后
   * 直接复制原链接（用户无感知差别）。
   */
  async function requestTransfer(item: {
    tid?: string;
    url: string;
    name?: string;
  }): Promise<void> {
    const key = item.tid || item.url;
    if (!key) return;
    const current = statusOf(key);

    if (current === "done" && shareTextCache.value[key]) {
      openTransferDialog(key, true);
      return;
    }
    if (current === "dead") {
      openTransferDialog(key, false);
      failTransferDialog(deadMsgCache.value[key] || "该资源已失效，无法获取", "dead");
      return;
    }
    if (current === "loading") return;
    if (busyCount.value > 0) return;

    busyCount.value++;
    statusMap.value[key] = "loading";
    openTransferDialog(key);

    try {
      // 未接转存的盘型：转约 1 秒圈，进「复制」态
      if (!item.tid) {
        shareTextCache.value[key] = item.url;
        await sleep(900 + Math.random() * 500);
        statusMap.value[key] = "done";
        openTransferDialog(key, true);
        return;
      }

      let shareText = item.url;
      try {
        const resp = await apiPost<{ code: number; data: any }>("/transfer", {
          id: item.tid,
        });
        if (resp.code === 1 && resp.data?.dead) {
          const msg =
            typeof resp.data.message === "string" && resp.data.message
              ? resp.data.message
              : "该资源暂无法获取";
          deadMsgCache.value[key] = msg;
          statusMap.value[key] = "dead";
          failTransferDialog(msg, "dead");
          return;
        }
        if (resp.code === 0 && resp.data?.share_url) {
          shareText = buildShareText(resp.data);
        }
      } catch (e) {
        // HTTP 错误（配额/tid 过期等）：后端响应里带原链接则兜底
        if (e instanceof ApiError && e.data?.url) shareText = e.data.url;
      }

      if (!shareText) {
        statusMap.value[key] = "idle";
        failTransferDialog("内容已过期，请重新搜索后再获取");
        return;
      }
      shareTextCache.value[key] = shareText;
      statusMap.value[key] = "done";
      openTransferDialog(key, true);
    } finally {
      busyCount.value = Math.max(0, busyCount.value - 1);
    }
  }

  return { statusMap, statusOf, requestTransfer, anyBusy };
}
