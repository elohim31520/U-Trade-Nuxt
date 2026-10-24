import { computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'

export const THEME_STORAGE_KEY = 'theme'

/** 'default' = 不帶 data-theme 的原本淺色主題；其餘名稱對應 assets/themes/<name>.css */
export const THEMES = ['default', 'arctic-cyan'] as const
export type ThemeName = (typeof THEMES)[number]

/**
 * 放進 <head> 同步執行，在第一次繪製前就把 data-theme 補到 <html>，避免先閃一下淺色再換色。
 * 不在 SSR 輸出 data-theme：首頁等路由有 swr 快取，HTML 會被所有人共用，不能帶個人偏好。
 */
export const themeInitScript = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t&&t!=='default')document.documentElement.setAttribute('data-theme',t)}catch(e){}`

function applyTheme(name: ThemeName) {
	if (name === 'default') document.documentElement.removeAttribute('data-theme')
	else document.documentElement.setAttribute('data-theme', name)
}

export function useTheme() {
	// initOnMounted：SSR 與 hydration 都先用 'default'，掛載後才讀 localStorage，避免 hydration mismatch
	const stored = useStorage<string>(THEME_STORAGE_KEY, 'default', undefined, { initOnMounted: true })

	const themeName = computed<ThemeName>(() =>
		(THEMES as readonly string[]).includes(stored.value) ? (stored.value as ThemeName) : 'default',
	)

	if (import.meta.client) {
		watch(themeName, applyTheme, { flush: 'sync' })
	}

	function setTheme(name: ThemeName) {
		stored.value = name
	}

	return { themeName, setTheme }
}
