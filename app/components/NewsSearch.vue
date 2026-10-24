<template>
    <div class="min-h-screen bg-slate-50">
        <!-- Search Header -->
        <div
            class="sticky top-12 z-10 bg-surface-card/80 backdrop-blur-md border-b border-slate-100 px-2 py-2 flex items-center">
            <van-search v-model="searchKeyword" :placeholder="t('news.searchPlaceholder')" show-action
                :action-text="t('common.cancel', '取消')" autofocus class="flex-1 bg-transparent! px-0!"
                @search="onSearch" @action="$emit('close')" />
        </div>

        <!-- 未輸入提示 -->
        <div v-if="!searchKeyword" class="flex flex-col items-center justify-center pt-24 gap-3 text-slate-400">
            <van-icon name="search" size="48" />
            <p class="text-sm">{{ t('news.searchHint', '輸入關鍵字搜尋新聞') }}</p>
        </div>

        <!-- 無結果 -->
        <div v-else-if="finished && searchList.length === 0"
            class="flex flex-col items-center justify-center pt-24 gap-3 text-slate-400">
            <van-icon name="description-o" size="48" />
            <p class="text-sm">{{ t('news.noResult', '找不到相關新聞') }}</p>
        </div>

        <!-- 結果列表 -->
        <van-list v-else v-model:loading="loading" :finished="finished" :finished-text="t('common.noMore', '沒有更多了')"
            :immediate-check="false" @load="loadMore" class="px-4 pt-5 pb-6">
            <NewsTimeline :items="searchList" />
        </van-list>
    </div>
</template>

<script setup>
import { nextTick } from "vue";
const { $publicApi } = useNuxtApp()
const { t, locale } = useI18n()

defineEmits(['close'])

const searchKeyword = ref('')
const searchList = ref([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const PAGE_SIZE = 10

function onSearch() {
    if (!searchKeyword.value.trim()) return
    searchList.value = []
    page.value = 1
    finished.value = false
    loading.value = true
    nextTick(() => {
        loadMore()
    })
}

async function loadMore() {
    if (!searchKeyword.value.trim()) {
        loading.value = false
        return
    }
    if (finished.value) return

    loading.value = true
    try {
        const res = await $publicApi.getNews({
            keyword: searchKeyword.value.trim(),
            page: page.value,
            size: PAGE_SIZE,
            lang: locale.value,
        })
        const rows = res?.data?.rows ?? []
        const total = res?.data?.total ?? 0

        searchList.value.push(...rows)
        page.value++

        if (searchList.value.length >= total || rows.length < PAGE_SIZE) {
            finished.value = true
        }
    } catch (error) {
        console.error(error)
        finished.value = true
    } finally {
        loading.value = false
    }
}
</script>