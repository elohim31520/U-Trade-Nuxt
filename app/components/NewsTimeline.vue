<template>
	<ol class="news-timeline">
		<!-- 日期之間的留白放在有日期帶的群組頂端，跨頁接續的同一天才不會多出一截間距 -->
		<li v-for="group in groups" :key="group.day" class="relative pb-3 pl-7" :class="{ 'pt-4': group.label }">
			<!-- 軸線：從日期圓點往下接到群組底部，接續上一頁的群組沒有日期帶，從頂端開始 -->
			<span aria-hidden="true" class="absolute bottom-0 left-[5.5px] w-px bg-slate-200"
				:class="group.label ? 'top-8' : 'top-0'" />

			<header v-if="group.label" class="relative mb-3 flex h-8 items-center">
				<span aria-hidden="true"
					class="absolute -left-7 size-3 rounded-full border-[2.5px] border-primary-600 bg-white shadow-[0_0_0_4px_rgb(248_131_121/0.18)]" />
				<time :datetime="group.day" class="flex items-center gap-2.5">
					<span class="text-[28px] font-bold leading-none tracking-tight tabular-nums text-slate-800">
						{{ group.label.day }}
					</span>
					<span class="flex flex-col gap-1 leading-none">
						<span class="text-xs font-semibold text-slate-600">{{ group.label.month }}</span>
						<span class="text-[11px] text-slate-400">{{ group.label.weekday }}</span>
					</span>
				</time>
			</header>

			<ul class="space-y-3">
				<li v-for="(vo, i) in group.items" :key="vo.id" class="news-item"
					:style="{ '--i': Math.min(group.start + i, 6) }">
					<NewsCard :item="vo" />
				</li>
			</ul>
		</li>
	</ol>
</template>

<script setup lang="ts">
import type { News } from '~/types/news'
import { formatDate } from '@/utils/date'

interface DayLabel {
	day: number
	month: string
	weekday: string
}

interface Group {
	day: string
	/** 接續上一頁同一天的新聞時為 null，不重複標日期 */
	label: DayLabel | null
	/** 此群組第一則在整份列表中的序號，用來錯開進場動畫 */
	start: number
	items: News[]
}

const props = defineProps<{
	items: News[]
	/** 分頁載入時傳入上一頁最後一則，讓跨頁的同一天合併成一組 */
	after?: News | null
}>()

const { locale } = useI18n()

const monthFormat = computed(() => new Intl.DateTimeFormat(locale.value, { month: 'short' }))
const weekdayFormat = computed(() => new Intl.DateTimeFormat(locale.value, { weekday: 'long' }))

const getDay = (vo: News) => formatDate(vo.publishedAt ?? vo.createdAt)

const getLabel = (day: string): DayLabel | null => {
	const [y = 0, m = 1, d = 1] = day.split('-').map(Number)
	const date = new Date(y, m - 1, d)
	if (Number.isNaN(date.getTime())) return null

	return {
		day: d,
		month: monthFormat.value.format(date),
		weekday: weekdayFormat.value.format(date),
	}
}

const groups = computed(() => {
	const result: Group[] = []
	let prevDay = props.after ? getDay(props.after) : null

	props.items.forEach((vo, index) => {
		const day = getDay(vo)

		if (day !== prevDay) {
			result.push({ day, label: getLabel(day), start: index, items: [] })
		} else if (!result.length) {
			result.push({ day, label: null, start: index, items: [] })
		}

		result.at(-1)!.items.push(vo)
		prevDay = day
	})

	return result
})
</script>

<style scoped>
/* 進場：由下往上淡入，同一批次依序錯開 */
.news-item {
	animation: news-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: calc(var(--i, 0) * 50ms);
}

@keyframes news-rise {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
}

@media (prefers-reduced-motion: reduce) {
	.news-item {
		animation: none;
	}
}
</style>
