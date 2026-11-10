<template>
	<!-- TradingView 加密貨幣熱力圖：色塊大小 = 市值，顏色 = 24 小時漲跌。高度跟著外層，由呼叫端決定 -->
	<div ref="containerEl" class="tradingview-widget-container h-full w-full" />
</template>

<script setup lang="ts">
	const { locale } = useI18n()

	const containerEl = ref<HTMLElement | null>(null)

	// TradingView 的嵌入腳本要和 __widget 容器同層，並且把設定 JSON 寫在 script 本身；
	// 語系改變時整塊清掉重建，不然 iframe 會停在舊語言
	const render = () => {
		const container = containerEl.value
		if (!container) return

		container.replaceChildren()

		const widget = document.createElement('div')
		widget.className = 'tradingview-widget-container__widget h-full w-full'

		const script = document.createElement('script')
		script.type = 'text/javascript'
		script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js'
		script.async = true
		script.innerHTML = JSON.stringify({
			dataSource: 'Crypto',
			blockSize: 'market_cap_calc',
			blockColor: '24h_close_change|5',
			locale: locale.value === 'zh' ? 'zh_TW' : 'en',
			symbolUrl: '',
			colorTheme: 'dark',
			hasTopBar: false,
			isDataSetEnabled: false,
			isZoomEnabled: true,
			hasSymbolTooltip: true,
			isMonoSize: false,
			width: '100%',
			height: '100%',
		})

		container.append(widget, script)
	}

	onMounted(render)
	watch(locale, render)
	onBeforeUnmount(() => containerEl.value?.replaceChildren())
</script>
