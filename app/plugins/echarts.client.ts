import { use, registerTheme } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent, MarkLineComponent, DataZoomComponent } from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'

// 數值對應 assets/themes/arctic-cyan.css 的 --c-text / --c-text-mid / --c-line / --c-line-hi / --c-bg-card-hi。
// canvas 吃不到 CSS 變數，所以這裡抄一份；改了那邊的色票記得同步。
const ARCTIC_CYAN_THEME = (() => {
	const text = '#edf9fb'
	const textMid = 'rgba(237, 249, 251, 0.72)'
	const line = 'rgba(106, 210, 224, 0.1)'
	const lineHi = 'rgba(106, 210, 224, 0.26)'
	const axis = {
		axisLine: { lineStyle: { color: lineHi } },
		axisTick: { lineStyle: { color: lineHi } },
		axisLabel: { color: textMid },
		splitLine: { lineStyle: { color: line } },
	}
	return {
		textStyle: { color: textMid },
		title: { textStyle: { color: text }, subtextStyle: { color: textMid } },
		legend: { textStyle: { color: textMid } },
		categoryAxis: axis,
		valueAxis: axis,
		timeAxis: axis,
		logAxis: axis,
		tooltip: { backgroundColor: '#19323b', borderColor: lineHi, textStyle: { color: text } },
	}
})()

export default defineNuxtPlugin((nuxtApp) => {
	// 1. 註冊 ECharts 功能
	use([
		CanvasRenderer,
		LineChart,
		BarChart,
		GridComponent,
		TooltipComponent,
		TitleComponent,
		LegendComponent,
		MarkLineComponent,
		DataZoomComponent,
		PieChart
	])

	// 2. 深色主題：vue-echarts 讀 THEME_KEY，主題名一變就會重新 init 圖表
	registerTheme('arctic-cyan', ARCTIC_CYAN_THEME)
	const { themeName } = useTheme()
	nuxtApp.vueApp.provide(THEME_KEY, () => (themeName.value === 'default' ? null : themeName.value))

	nuxtApp.vueApp.component('v-chart', VChart)
})
