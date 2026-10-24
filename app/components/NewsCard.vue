<template>
    <article
        class="news-card group relative bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-100 transition-transform duration-150 active:scale-[0.98]">
        <div class="h-1 w-full bg-linear-to-r from-pink-500 via-orange-400 to-[#F88379]" />
        <div class="p-4">
            <!-- 標籤 + 時間 -->
            <div class="flex items-center justify-between mb-3">
                <span
                    class="inline-flex items-center gap-1 text-[11px] font-semibold tracking-widest uppercase text-primary bg-amber-50 px-2 py-0.5 rounded-full border border-[#F88379]">
                    <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    News
                </span>
                <time class="text-[11px] text-slate-400 tabular-nums">
                    {{ formatDate(item.createdAt) }}
                </time>
            </div>

            <!-- 內文 -->
            <van-text-ellipsis :content="isZh ? item.content : item.contentEn" rows="4" :expand-text="$t('com.expand')"
                :collapse-text="$t('com.collapse')" class="text-[14px] leading-relaxed text-slate-700 font-medium" />

            <!-- 底部資訊 -->
            <div class="flex items-center mt-4 pt-3 border-t border-slate-100">
                <div class="flex items-center gap-1.5 text-slate-400">
                    <van-icon name="eye-o" size="14" />
                    <ClientOnly>
                        <span class="text-xs">{{ _random(100, 10000) }}</span>
                    </ClientOnly>
                </div>
            </div>
        </div>

        <!-- 置頂 badge -->
        <div v-if="item.isTop"
            class="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            Top
        </div>
    </article>
</template>

<script setup>
import { formatDate } from '@/utils/date'

const props = defineProps({
    item: {
        type: Object,
        required: true
    }
})

const { locale } = useI18n()
const isZh = computed(() => locale.value.startsWith('zh'))
</script>