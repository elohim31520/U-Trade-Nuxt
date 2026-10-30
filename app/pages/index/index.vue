<template>
	<div class="space-y-9 px-4 pb-6 pt-4">
		<!-- 開場：品牌色暈光 + 細點陣，標題下方一行說明這頁有什麼 -->
		<section
			class="relative isolate overflow-hidden rounded-3xl border border-primary/22 bg-surface-card px-5 pb-6 pt-5 shadow-[0_1px_2px_rgb(16_24_40/0.04),0_14px_32px_-18px_color-mix(in_oklch,var(--color-primary)_55%,transparent)] motion-safe:animate-row-in"
		>
			<!-- 裝飾層：兩團暈光 + 右上往左下淡出的點陣。顏色走 primary / accent-2，兩套主題都會跟著換 -->
			<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
				<span class="absolute inset-0 bg-radial-[120%_100%_at_100%_0%] from-primary/20 to-transparent to-62%" />
				<span class="absolute inset-0 bg-radial-[90%_90%_at_0%_100%] from-accent-2/12 to-transparent to-60%" />
				<span
					class="absolute inset-0 bg-[image:radial-gradient(color-mix(in_oklch,var(--color-primary)_45%,transparent)_1px,transparent_1.5px)] bg-size-[14px_14px] opacity-55 [mask-image:linear-gradient(to_bottom_left,#000,transparent_60%)]"
				/>
			</div>

			<div class="flex items-center justify-between gap-3">
				<p class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
					<span class="size-1.5 rounded-full bg-primary" aria-hidden="true" />
					{{ $t('home.eyebrow') }}
				</p>
				<!-- 日期靠瀏覽器時區算，SSR 的 HTML 會被 swr 快取共用，所以掛載後才填 -->
				<time v-if="today" :datetime="isoDate" class="text-xs tabular-nums text-gray-400">{{ today }}</time>
			</div>
			<h1 class="mt-5 text-[28px] font-bold leading-tight tracking-tight text-gray-900">
				{{ $t('home.title') }}
			</h1>
			<p class="mt-2 text-[13px] leading-relaxed text-gray-500">{{ $t('home.subtitle') }}</p>
		</section>

		<News more-to="/news" />

		<MomentumChart />

		<section>
			<SectionHeader :title="$t('home.heatmap_title')" :subtitle="$t('home.heatmap_subtitle')" />
			<!-- TradingView 的熱力圖固定是深色底，外框裁出圓角，讓它像刻意的一塊深色面板 -->
			<div class="overflow-hidden rounded-2xl border border-gray-100 shadow-card-soft">
				<HeatMap class="h-[425px]" />
			</div>
		</section>

		<MarketQuotes />

		<MarketBreadth />

		<VolatileAsset more-to="/volatile-stock" />

		<!-- 公司入口 -->
		<HotCompanies more-to="/companies" />
	</div>
</template>

<script setup lang="ts">
	const { t, locale } = useI18n()

	usePageSeo(
		computed(() => ({
			title: t('home.meta_title'),
			description: t('home.meta_description'),
		}))
	)

	const today = ref('')
	const isoDate = ref('')

	onMounted(() => {
		const now = new Date()
		isoDate.value = now.toISOString().slice(0, 10)
		today.value = new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-TW' : 'en-US', {
			month: 'short',
			day: 'numeric',
			weekday: 'short',
		}).format(now)
	})
</script>
