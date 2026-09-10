<template>
  <div class="result-card">
    <div class="card-header">
      <div class="platform-badge" :style="{ background: color }">
        <img class="platform-icon" :src="icon" :alt="title" loading="lazy" />
      </div>
      <div class="header-info">
        <h3 class="platform-title">{{ title }}</h3>
        <span class="resource-count">{{ items.length }} 个资源</span>
      </div>
    </div>

    <ul class="resource-list">
      <li v-for="r in visibleItems" :key="r.tid || r.url" class="resource-item">
        <div class="resource-content">
          <!-- 有 tid 的条目直链已被服务端剥离，渲染为可点击文本（点击=获取） -->
          <a
            v-if="r.url"
            class="resource-link"
            :href="r.url"
            target="_blank"
            rel="noopener noreferrer nofollow"
            :title="r.note || r.url">
            <span class="link-text">{{ r.note || r.url }}</span>
            <svg class="external-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
          <span
            v-else
            class="resource-link resource-link--tid"
            :title="r.note || '网盘资源'"
            @click="handleGet(r)">
            <span class="link-text">{{ r.note || "网盘资源" }}</span>
          </span>

          <div class="resource-meta">
            <div class="meta-tags">
              <span class="meta-tag date">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {{ formatDate(r.datetime) || "时间未知" }}
              </span>

              <span v-if="r.password" class="meta-tag password">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                提取码: {{ r.password }}
              </span>
            </div>

            <button
              class="transfer-btn"
              :class="{
                'transfer-btn--loading': getStatus(r) === 'loading',
                'transfer-btn--dead': getStatus(r) === 'dead',
                'transfer-btn--done': getStatus(r) === 'done',
              }"
              :disabled="isTransferBtnDisabled(r)"
              :title="btnTitle(r)"
              @click.prevent="handleGet(r)">
              <svg v-if="getStatus(r) === 'loading'" class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3v12"></path>
                <path d="M7 10l5 5 5-5"></path>
                <path d="M5 21h14"></path>
              </svg>
              {{ transferBtnLabel(r) }}
            </button>
          </div>
        </div>
      </li>
    </ul>

    <div v-if="!expanded && items.length > initialVisible" class="card-footer">
      <button class="load-more-btn" @click="$emit('toggle')">
        显示更多 ({{ items.length - initialVisible }})
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12l7 7 7-7"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTransfer } from "../composables/useTransfer";
import type { MergedLink } from "../types";

const props = defineProps<{
  title: string;
  color: string;
  icon: string;
  items: MergedLink[];
  expanded: boolean;
  initialVisible: number;
}>();

defineEmits(["toggle"]);

const { statusOf: transferStatus, requestTransfer, anyBusy: transferBusy } = useTransfer();

function getStatus(r: MergedLink) {
  return transferStatus(r.tid || r.url);
}

/** 自身 loading/dead，或全局有其它「获取」在跑（done 本地复制除外） */
function isTransferBtnDisabled(r: MergedLink): boolean {
  const st = getStatus(r);
  return st === "loading" || st === "dead" || (transferBusy.value && st !== "done");
}

function transferBtnLabel(r: MergedLink): string {
  const st = getStatus(r);
  if (st === "loading") return "获取中…";
  if (st === "done") return "已获取";
  if (st === "dead") return "已失效";
  return transferBusy.value ? "排队中…" : "获取";
}

function btnTitle(r: MergedLink): string {
  const st = getStatus(r);
  if (st === "dead") return "该资源已失效，无法获取";
  if (st === "done") return "点击查看并复制获取的内容";
  if (st === "loading") return "正在获取";
  if (transferBusy.value) return "正在获取其他资源，请稍候";
  return "获取资源";
}

async function handleGet(r: MergedLink) {
  await requestTransfer({ tid: r.tid, url: r.url, name: r.note });
}

const visibleItems = computed(() =>
  props.expanded ? props.items : props.items.slice(0, props.initialVisible)
);

function formatDate(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())} ${p(dt.getHours())}:${p(dt.getMinutes())}:${p(dt.getSeconds())}`;
}
</script>

<style scoped>
.result-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(17, 24, 39, 0.06);
  overflow: hidden;
  transition: box-shadow var(--transition-normal), transform var(--transition-normal);
}
.result-card:hover {
  box-shadow: 0 14px 28px rgba(17, 24, 39, 0.1);
  transform: translateY(-3px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-surface-elevated);
  border-bottom: 1px solid var(--border-light);
  position: relative;
}
.card-header::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: linear-gradient(90deg, var(--primary), transparent 70%);
  opacity: 0.25;
}

.platform-badge {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 5px 10px rgba(17, 24, 39, 0.2);
  flex-shrink: 0;
}
.platform-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.header-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.platform-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}
.resource-count {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.resource-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.resource-item {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-light);
  transition: background var(--transition-fast);
}
.resource-item:last-child {
  border-bottom: none;
}
.resource-item:hover {
  background: var(--bg-hover);
}
.resource-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-link {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--primary);
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: anywhere;
  transition: color var(--transition-fast), gap var(--transition-fast);
}
.resource-link:hover {
  color: var(--primary-dark);
  gap: 8px;
}
.link-text {
  flex: 1;
  min-width: 0;
}
.external-icon {
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  flex-shrink: 0;
  stroke: currentColor;
}
.resource-link:hover .external-icon {
  opacity: 1;
  transform: translateX(0);
}

.resource-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.meta-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}
.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 999px;
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}
.meta-tag svg {
  stroke: currentColor;
  opacity: 0.7;
}
.meta-tag.date {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.15);
  color: var(--primary);
}
.meta-tag.password {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
  color: var(--success);
}
.resource-link--tid {
  cursor: pointer;
}

.transfer-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  color: var(--primary);
  border: 1px solid rgba(15, 118, 110, 0.35);
  background: rgba(15, 118, 110, 0.06);
  transition: background-color var(--transition-fast), border-color var(--transition-fast),
    color var(--transition-fast), transform var(--transition-fast);
}
.transfer-btn:hover:not(:disabled) {
  background: rgba(15, 118, 110, 0.12);
  border-color: var(--primary);
  transform: translateY(-1px);
}
.transfer-btn:disabled {
  cursor: not-allowed;
}
.transfer-btn svg {
  stroke: currentColor;
}
.transfer-btn--loading {
  opacity: 0.7;
  cursor: wait;
}
.transfer-btn--done {
  color: var(--success);
  border-color: var(--success);
  background: rgba(16, 185, 129, 0.08);
}
.transfer-btn--dead {
  color: #999;
  border-color: var(--border-light);
  background: transparent;
  text-decoration: line-through;
  text-decoration-color: #ccc;
}
.transfer-btn--dead:hover:not(:disabled) {
  background: transparent;
  border-color: var(--border-light);
  color: #999;
  transform: none;
}

.spin {
  animation: transfer-spin 0.8s linear infinite;
}
@keyframes transfer-spin {
  to {
    transform: rotate(360deg);
  }
}

.card-footer {
  padding: 12px 16px;
  background: var(--bg-surface-subtle);
  border-top: 1px solid var(--border-light);
  text-align: center;
}
.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, var(--primary), #14b8a6);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.load-more-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(15, 118, 110, 0.4);
}
.load-more-btn svg {
  stroke: currentColor;
}

@media (max-width: 640px) {
  .card-header {
    padding: 12px;
    gap: 10px;
  }
  .platform-badge {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }
  .platform-title {
    font-size: 15px;
  }
  .resource-item {
    padding: 12px;
  }
  .resource-link {
    font-size: 13px;
  }
  .meta-tag {
    padding: 3px 6px;
    font-size: 10px;
  }
  .transfer-btn {
    padding: 5px 8px;
    font-size: 11px;
  }
}
</style>
