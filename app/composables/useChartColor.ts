import { computed } from 'vue'
import { useTheme, type ThemeName } from './useTheme'

/**
 * 圖表主色。canvas 吃不到 CSS 變數，所以依主題名稱查表。
 * 預設主題是品牌珊瑚色；arctic-cyan 用該主題的主色（assets/themes/arctic-cyan.css 的 --c-primary）。
 */
const CHART_COLOR: Record<ThemeName, string> = {
	default: '#F88379',
	'arctic-cyan': '#62c8d8',
}

export function useChartColor() {
	const { themeName } = useTheme()
	return computed(() => CHART_COLOR[themeName.value])
}
