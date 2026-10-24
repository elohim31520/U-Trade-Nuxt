<template>
    <div class="min-h-screen bg-slate-50">
        <!-- 搜尋組件 -->
        <NewsSearch v-if="isSearching" @close="isSearching = false" />

        <template v-else>
            <!-- 頁首：標題 + 搜尋入口 -->
            <header class="bg-linear-to-b from-primary/20 via-primary/5 to-transparent px-4 pt-6 pb-5">
                <h1 class="text-[26px] font-bold leading-tight tracking-tight text-slate-900">{{ t('news.title') }}</h1>
                <p class="mt-1 text-[13px] text-slate-500">{{ t('news.subtitle') }}</p>

                <button type="button"
                    class="news-search mt-4 flex h-11 w-full items-center gap-2.5 rounded-full border border-white bg-white/90 px-4 text-left text-sm text-slate-400 transition-colors active:bg-white"
                    @click="isSearching = true">
                    <van-icon name="search" size="18" />
                    {{ t('news.searchPlaceholder') }}
                </button>
            </header>

            <template v-if="firstPageList.length">
                <!-- SSR 第一頁（內距放在外層 div：全域 `ol, ul { padding: 0 }` 未分層，會蓋掉 ol 上的 px-4） -->
                <div class="px-4">
                    <NewsTimeline :items="firstPageList" />
                </div>

                <!-- CSR 後續分頁（Waterfall）；與第一頁同一天的新聞接在同一組日期下 -->
                <ClientOnly>
                    <Waterfall ref="waterfallRef" dataPath="data.rows" :initialPage="2"
                        :finished-text="t('common.noMore')" :loading-text="t('news.loading')"
                        :apiFunction="(params) => $publicApi.getNews(params)">
                        <template #default="{ list }">
                            <div class="px-4">
                                <NewsTimeline :items="list" :after="firstPageList.at(-1)" />
                            </div>
                        </template>
                    </Waterfall>
                </ClientOnly>
            </template>

            <div v-else class="flex flex-col items-center justify-center gap-3 pt-20 text-slate-400">
                <van-icon name="description-o" size="48" />
                <p class="text-sm">{{ t('news.empty') }}</p>
            </div>
        </template>
    </div>
</template>

<script setup>
const { $publicKV } = useNuxtApp()
const { t } = useI18n()

const waterfallRef = ref(null)
const isSearching = ref(false)

const { data: fetchedData } = await useAsyncData(
    'news-first-page',
    () => $publicKV.getNews()
)

const firstPageList = computed(() => fetchedData.value?.data?.rows ?? [])

usePageSeo(computed(() => ({
    title: t('news.meta_title'),
    description: t('news.meta_description'),
})))
</script>

<style scoped>
/* 搜尋入口：白底細描邊 + 柔影，浮在暈染背景上 */
.news-search {
    box-shadow:
        0 1px 2px rgb(16 24 40 / 0.04),
        0 6px 16px -8px rgb(16 24 40 / 0.12);
}
</style>
