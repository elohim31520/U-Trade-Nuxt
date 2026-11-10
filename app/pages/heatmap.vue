<template>
	<div class="px-4 pb-6 pt-4">
		<header class="mb-6 px-1">
			<h1 class="text-[26px] font-bold leading-tight tracking-tight text-gray-900">{{ $t('heatmap.title') }}</h1>
			<p class="mt-1.5 text-[13px] leading-snug text-gray-500">{{ $t('heatmap.subtitle') }}</p>
		</header>

		<div class="space-y-9">
			<section>
				<SectionHeader :title="$t('heatmap.sp500_title')" :subtitle="$t('heatmap.sp500_subtitle')" />
				<!-- TradingView 的熱力圖固定是深色底，外框裁出圓角，讓它像刻意的一塊深色面板 -->
				<div class="h-[480px] overflow-hidden rounded-2xl border border-gray-100 shadow-card-soft">
					<HeatMap class="h-full" />
				</div>
			</section>

			<section>
				<SectionHeader :title="$t('heatmap.crypto_title')" :subtitle="$t('heatmap.crypto_subtitle')" />
				<div class="h-[480px] overflow-hidden rounded-2xl border border-gray-100 shadow-card-soft">
					<CryptoHeatMap />
				</div>
			</section>
		</div>

		<p class="mt-6 px-1 text-center text-xs text-gray-400">
			{{ $t('heatmap.source') }}
			<a href="https://www.tradingview.com/" target="_blank" rel="noopener nofollow" class="text-primary-600">
				TradingView
			</a>
		</p>
	</div>
</template>

<script setup lang="ts">
	const { t } = useI18n()

	usePageSeo(
		computed(() => ({
			title: t('heatmap.meta_title'),
			description: t('heatmap.meta_description'),
		}))
	)
</script>
