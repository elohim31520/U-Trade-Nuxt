import { computed } from 'vue'
import { useTheme, type ThemeName } from './useTheme'

/**
 * 公司指標圖表用的整組配色。canvas 吃不到 CSS 變數，所以跟 useChartColor 一樣依主題名稱查表；
 * 數值對應 main.css（預設主題）與 assets/themes/arctic-cyan.css 的色票，改了那邊記得同步。
 */
export interface ChartPalette {
	/** 主系列（前瞻類指標）：品牌主色 */
	primary: string
	/** 次系列（歷史類指標） */
	secondary: string
	/** 上漲 / 下跌，與頁面上 emerald / red 的漲跌色一致 */
	up: string
	down: string
	/** 次要資訊：座標軸文字、沒有語意的 sparkline */
	muted: string
	/** 格線 */
	grid: string
	tooltipBg: string
	tooltipBorder: string
	tooltipText: string
}

const PALETTE: Record<ThemeName, ChartPalette> = {
	default: {
		primary: '#F4584B',
		secondary: '#5B8DEF',
		up: '#10B981',
		down: '#EF4444',
		muted: '#9CA3AF',
		grid: '#EEF0F3',
		tooltipBg: '#FFFFFF',
		tooltipBorder: '#EEF0F3',
		tooltipText: '#111827',
	},
	'arctic-cyan': {
		primary: '#62C8D8',
		secondary: '#B39CFF',
		up: '#65D4A5',
		down: '#FF6D78',
		muted: '#7F959B',
		grid: 'rgba(106, 210, 224, 0.1)',
		tooltipBg: '#19323B',
		tooltipBorder: 'rgba(106, 210, 224, 0.26)',
		tooltipText: '#EDF9FB',
	},
}

export function useChartPalette() {
	const { themeName } = useTheme()
	return computed(() => PALETTE[themeName.value])
}

/** '#rrggbb' + 透明度 -> 'rgba(r, g, b, a)'，給 canvas 漸層用（只吃 6 碼 hex） */
export function withAlpha(hex: string, alpha: number) {
	const n = parseInt(hex.slice(1), 16)
	return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/** 所有指標圖共用的 tooltip 外觀：圓角、柔影、跟著主題換底色 */
export function chartTooltip(p: ChartPalette) {
	return {
		confine: true,
		backgroundColor: p.tooltipBg,
		borderColor: p.tooltipBorder,
		borderWidth: 1,
		padding: [8, 12],
		textStyle: { color: p.tooltipText, fontSize: 12 },
		extraCssText: 'border-radius:12px;box-shadow:0 8px 24px -8px rgba(16,24,40,.28);',
	}
}

/** 圖表 tooltip 的一列：色點 + 名稱 + 數值 */
export function tooltipRow(color: string, name: string, value: string) {
	return (
		`<div style="display:flex;align-items:center;gap:8px;margin-top:5px">` +
		`<span style="width:8px;height:8px;border-radius:50%;background:${color}"></span>` +
		`<span style="flex:1;opacity:.65">${name}</span>` +
		`<b style="font-variant-numeric:tabular-nums">${value}</b></div>`
	)
}

/** ct（"2026-11-04T07:01"）-> 座標軸用的 "11/04"，直接切字串避開時區換算 */
export const toAxisDate = (ct: string) => ct.slice(5, 10).replace('-', '/')
