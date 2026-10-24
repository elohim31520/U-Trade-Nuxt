<template>
	<section v-if="items.length">
		<header class="mb-4 px-1">
			<h2 class="text-lg font-bold leading-tight tracking-tight text-gray-900">{{ $t('news.title') }}</h2>
			<p class="mt-1 text-xs text-gray-400">{{ $t('news.subtitle') }}</p>
		</header>

		<ol
			class="news-card divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-surface-card">
			<li v-for="vo in items" :key="vo.id">
				<!-- 同一天只在第一則前標一次日期 -->
				<time v-if="vo.showDay" :datetime="vo.day"
					class="block bg-gray-50 px-4 py-1.5 text-[11px] font-medium tabular-nums tracking-wider text-gray-400">
					{{ formatMonthDay(vo.day) }}
				</time>
				<div class="px-4 py-3.5">
					<van-text-ellipsis rows="2" :content="getDisplayContent(vo)" :expand-text="$t('com.expand')"
						:collapse-text="$t('com.collapse')" position="end"
						class="news-text text-[13.5px] text-gray-700" />
				</div>
			</li>
		</ol>
	</section>
</template>

<script setup lang="ts">
import type { News, NewsResponse } from '~/types/news'
import { formatDate, formatMonthDay } from '@/utils/date'

// 首頁只放精選，完整列表由下方「查看更多」進 /news
const PREVIEW_COUNT = 6

const { $publicKV } = useNuxtApp()
const { locale } = useI18n()

const getDisplayContent = (vo: News) => {
	if (locale.value === 'en' && vo.contentEn) {
		return vo.contentEn
	}

	return vo.content
}

const {
	data: fetchedData,
	pending,
	error,
} = await useAsyncData<NewsResponse>(
	'news-data',
	async () => {
		try {
			const res = await $publicKV.getNews()
			return res.data
		} catch (error) {
			console.error(`Failed to fetch News:`, error)
			throw error
		}
	}
)

const items = computed(() => {
	const rows = (fetchedData.value?.rows ?? []).slice(0, PREVIEW_COUNT)

	return rows.map((vo, index) => {
		const day = formatDate(vo.publishedAt ?? vo.createdAt)
		const prevDay = index > 0 ? formatDate(rows[index - 1]!.publishedAt ?? rows[index - 1]!.createdAt) : null

		return { ...vo, day, showDay: day !== prevDay }
	})
})
</script>

<style scoped>
/* 外框：細描邊 + 分層柔影，與熱門公司圖磚同一套陰影語言 */
.news-card {
	box-shadow:
		0 1px 2px rgb(16 24 40 / 0.04),
		0 8px 24px -12px rgb(16 24 40 / 0.1);
}

/* Vant 預設的藍色「展開」改成品牌色，行高放鬆一點 */
.news-text {
	--van-text-ellipsis-line-height: 1.7;
	--van-text-ellipsis-action-color: var(--color-primary-600);
}
</style>
