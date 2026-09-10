<template>
  <div class="douban-section">
    <nav class="category-nav" role="tablist">
      <button
        v-for="cat in CATEGORIES"
        :key="cat.id"
        :class="['tab-button', { 'is-active': selectedCategoryId === cat.id }]"
        role="tab"
        :aria-selected="selectedCategoryId === cat.id"
        @click="selectCategory(cat.id)">
        {{ cat.label }}
      </button>
    </nav>

    <div class="content-area">
      <div v-if="loading && items.length === 0" class="movie-grid">
        <div v-for="i in 10" :key="`sk-${i}`" class="movie-card skeleton-card">
          <div class="cover-placeholder"></div>
          <div class="card-info">
            <span class="sk-bar" style="width: 70%"></span>
            <span class="sk-bar" style="width: 45%"></span>
          </div>
        </div>
      </div>

      <div v-else-if="items.length > 0" class="movie-grid">
        <button
          v-for="item in items"
          :key="item.id || item.title"
          class="movie-card"
          :aria-label="`搜索 ${extractTerm(item.title)}`"
          @click="$emit('search', extractTerm(item.title))">
          <div class="card-cover">
            <img
              v-if="item.cover && !imgFailed.includes(item.id ?? 0)"
              :src="proxyCover(item.cover)"
              :alt="extractTerm(item.title)"
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="onImgError(item.id ?? 0)" />
            <div v-else class="cover-placeholder">🎬</div>
          </div>
          <div class="card-info">
            <span class="card-title">{{ item.title }}</span>
            <span v-if="item.desc" class="card-desc">{{ item.desc }}</span>
          </div>
        </button>
      </div>

      <div v-else-if="!loading" class="empty-state">
        <span>暂无数据</span>
      </div>
    </div>

    <div v-if="hasMore && items.length > 0" ref="loadTriggerRef" class="load-trigger">
      <span v-if="loadingMore">加载更多…</span>
    </div>
    <div v-else-if="items.length > 0" class="end-message">— 已经到底了 —</div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { apiGet, apiUrl } from "../api/client";

defineEmits(["search"]);

interface DoubanHotItem {
  id?: number;
  title: string;
  cover?: string;
  desc?: string;
}

const CATEGORIES = [
  { id: "douban-top250", label: "Top250" },
  { id: "douban-drama", label: "剧情" },
  { id: "douban-comedy", label: "喜剧" },
  { id: "douban-action", label: "动作" },
  { id: "douban-romance", label: "爱情" },
  { id: "douban-scifi", label: "科幻" },
  { id: "douban-animation", label: "动画" },
  { id: "douban-mystery", label: "悬疑" },
  { id: "douban-crime", label: "犯罪" },
  { id: "douban-war", label: "战争" },
  { id: "douban-documentary", label: "纪录片" },
  { id: "douban-tv", label: "电视剧" },
];

const loading = ref(false);
const loadingMore = ref(false);
const items = ref<DoubanHotItem[]>([]);
const hasMore = ref(true);
const imgFailed = ref<number[]>([]);
const selectedCategoryId = ref(CATEGORIES[0].id);
const currentPage = ref(1);
const loadTriggerRef = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;
let fetchSeq = 0;

function onImgError(id: number) {
  if (!imgFailed.value.includes(id)) imgFailed.value = [...imgFailed.value, id];
}

function extractTerm(title: string): string {
  return (
    title.replace(/^【[\d.]+】/, "").replace(/^#\d+\s*/, "").trim() || title
  );
}

/** 豆瓣图片不能直连（防盗链），走官方图片代理 */
function proxyCover(url: string): string {
  if (!url) return "";
  return apiUrl("/img", { url });
}

async function fetchPage(categoryId: string, page: number, append = false) {
  const mySeq = ++fetchSeq;
  if (page === 1) loading.value = true;
  else loadingMore.value = true;

  try {
    const data = await apiGet<{
      code: number;
      data?: { items?: DoubanHotItem[]; hasMore?: boolean };
    }>("/douban-hot", { category: categoryId, page, limit: 25 });

    // 请求期间切换了分类 → 丢弃过期响应
    if (mySeq !== fetchSeq) return;

    if (data?.code === 0 && data.data) {
      const newItems = data.data.items || [];
      items.value = append ? [...items.value, ...newItems] : newItems;
      hasMore.value =
        data.data.hasMore !== undefined ? data.data.hasMore : newItems.length >= 25;
      currentPage.value = page;
    } else {
      if (!append) items.value = [];
      hasMore.value = false;
    }
  } catch {
    if (!append) items.value = [];
    hasMore.value = false;
  } finally {
    if (mySeq === fetchSeq) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
}

async function selectCategory(categoryId: string) {
  if (categoryId === selectedCategoryId.value && items.value.length > 0) return;
  selectedCategoryId.value = categoryId;
  currentPage.value = 1;
  hasMore.value = true;
  items.value = [];
  loading.value = true;
  await fetchPage(categoryId, 1, false);
  setupObserver();
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return;
  await fetchPage(selectedCategoryId.value, currentPage.value + 1, true);
}

function setupObserver() {
  observer?.disconnect();
  const target = loadTriggerRef.value;
  if (!target) return;
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loading.value && !loadingMore.value) {
      loadMore();
    }
  });
  observer.observe(target);
}

onMounted(async () => {
  await fetchPage(selectedCategoryId.value, 1, false);
  setupObserver();
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<style scoped>
.douban-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tab-button {
  padding: 6px 14px;
  border: 1px solid var(--border-light);
  border-radius: 999px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.tab-button:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.tab-button.is-active {
  background: linear-gradient(135deg, var(--primary), #14b8a6);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 14px;
}

.movie-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  background: var(--bg-primary);
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.movie-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 22px rgba(17, 24, 39, 0.1);
}

.card-cover {
  width: 100%;
  aspect-ratio: 2 / 3;
  background: var(--bg-secondary);
  overflow: hidden;
}
.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.cover-placeholder {
  width: 100%;
  height: 100%;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    var(--bg-hover) 100%
  );
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px 10px;
}
.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-desc {
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skeleton-card {
  pointer-events: none;
}
.sk-bar {
  display: block;
  height: 10px;
  border-radius: 6px;
  margin-top: 6px;
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-hover) 37%,
    var(--bg-secondary) 63%
  );
  background-size: 400% 100%;
  animation: sk-shimmer 1.2s ease infinite;
}
@keyframes sk-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.load-trigger {
  display: flex;
  justify-content: center;
  padding: 12px;
  font-size: 13px;
  color: var(--text-tertiary);
}
.end-message {
  text-align: center;
  padding: 12px;
  font-size: 12px;
  color: var(--text-tertiary);
}
.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
}

@media (max-width: 640px) {
  .movie-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 10px;
  }
}
</style>
