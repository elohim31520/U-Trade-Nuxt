<template>
    <div class="min-h-screen bg-slate-50">
        <!-- Header -->
        <div
            class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center gap-3">
            <div class="w-1 h-6 rounded-full bg-linear-to-b from-pink-500 to-[#F88379]" />
            <h1 class="text-lg font-bold text-slate-800 tracking-tight flex-1">{{ t('news.title') }}</h1>
            <van-icon name="search" size="20" class="text-slate-500 cursor-pointer" @click="isSearching = true" />
        </div>

        <!-- 搜尋組件 -->
        <NewsSearch v-if="isSearching" @close="isSearching = false" />

        <!-- SSR 第一頁 -->
        <template v-else>
            <div class="news-list px-4 pt-4 space-y-4">
                <NewsCard v-for="item in firstPageList" :key="item.id" :item="item" />
            </div>

            <!-- CSR 後續分頁（Waterfall） -->
            <ClientOnly>
                <Waterfall ref="waterfallRef" dataPath="data.rows" :initialPage="2"
                    :apiFunction="(params) => $publicApi.getNews(params)">
                    <template #default="{ list }">
                        <div class="news-list px-4 pb-6 space-y-4">
                            <NewsCard v-for="item in list" :key="item.id" :item="item" />
                        </div>
                    </template>
                </Waterfall>
            </ClientOnly>
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