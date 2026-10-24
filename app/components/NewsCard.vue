<template>
    <article class="news-card relative rounded-2xl border border-slate-100 bg-white px-4 py-3.5"
        :class="{ 'news-card--top': item.isTop }">
        <!-- 置頂 -->
        <span v-if="item.isTop"
            class="mb-2 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary-600">
            <van-icon name="fire-o" size="12" />
            {{ $t('news.pinned') }}
        </span>

        <!-- 內文 -->
        <van-text-ellipsis :content="content" rows="4" :expand-text="$t('com.expand')"
            :collapse-text="$t('com.collapse')" class="news-text text-[14.5px] text-slate-700" />
    </article>
</template>

<script setup>
const props = defineProps({
    item: {
        type: Object,
        required: true
    }
})

const { locale } = useI18n()
const isZh = computed(() => locale.value.startsWith('zh'))
const content = computed(() => (isZh.value || !props.item.contentEn ? props.item.content : props.item.contentEn))
</script>

<style scoped>
/* 細描邊 + 分層柔影，與首頁最新資訊 / 熱門公司圖磚同一套陰影語言 */
.news-card {
    box-shadow:
        0 1px 2px rgb(16 24 40 / 0.04),
        0 8px 24px -12px rgb(16 24 40 / 0.1);
}

/* 置頂：暖色底 + 品牌色描邊 */
.news-card--top {
    border-color: rgb(248 131 121 / 0.45);
    background-image: linear-gradient(135deg, rgb(248 131 121 / 0.09), transparent 55%);
}

/* Vant 預設的藍色「展開」改成品牌色，行高放鬆一點 */
.news-text {
    --van-text-ellipsis-line-height: 1.75;
    --van-text-ellipsis-action-color: #f4584b;
}
</style>
