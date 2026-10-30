<template>
	<div ref="wrapRef" class="relative">
		<button type="button"
			class="flex w-full items-center gap-2.5 rounded-lg border bg-surface-card px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors duration-150"
			:class="open ? 'border-gray-300' : 'border-gray-200 hover:border-gray-300'"
			:aria-label="$t('sidemenu.theme')" aria-haspopup="listbox" :aria-expanded="open" @click="open = !open">
			<span class="theme-swatch h-3 w-4.5 shrink-0 rounded-xs" :data-theme-swatch="themeName" />
			<span class="flex-1 truncate text-left">{{ labelOf(themeName) }}</span>
			<SvgIcon name="icon_arrow_right" size="0.75rem"
				class="shrink-0 text-gray-500 transition-transform duration-150"
				:class="open ? '-rotate-90' : 'rotate-90'" />
		</button>

		<!-- 選單固定往上展開：選擇器在側邊選單最底部，往下會被 popup 裁掉 -->
		<div v-if="open" role="listbox"
			class="absolute bottom-[calc(100%+6px)] left-0 right-0 z-10 rounded-lg border border-gray-200 bg-surface-card p-1 shadow-card-primary">
			<button v-for="name in THEMES" :key="name" type="button" role="option" :aria-selected="name === themeName"
				class="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors duration-150"
				:class="name === themeName ? 'text-primary-600' : 'text-gray-600 hover:bg-gray-50'"
				@click="select(name)">
				<span class="theme-swatch h-3 w-4.5 shrink-0 rounded-xs" :data-theme-swatch="name" />
				<span class="flex-1 truncate">{{ labelOf(name) }}</span>
				<SvgIcon v-if="name === themeName" name="icon_check" size="16px" class="shrink-0 text-primary" />
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { THEMES, useTheme, type ThemeName } from '@/composables/useTheme'

const { t } = useI18n()
const { themeName, setTheme } = useTheme()

const wrapRef = ref<HTMLElement | null>(null)
const open = ref(false)

onClickOutside(wrapRef, () => {
	open.value = false
})

// 預設主題的名稱跟著語系；arctic-cyan 是品牌命名，兩種語系都一樣
const labelOf = (name: ThemeName) => (name === 'default' ? t('sidemenu.theme_default') : 'Arctic Cyan')

function select(name: ThemeName) {
	setTheme(name)
	open.value = false
}
</script>

<style scoped>
/* 色票：左上三角 = 主色，右下三角 = 底色；顏色直接寫死，不跟當前主題走，才能同時預覽兩個主題 */
.theme-swatch {
	background: linear-gradient(135deg,
			var(--skin-color) 0%,
			var(--skin-color) 48%,
			var(--skin-surface) 48%,
			var(--skin-surface) 100%);
	border: 1px solid color-mix(in oklch, currentColor 24%, transparent);
}

.theme-swatch[data-theme-swatch='default'] {
	--skin-color: #f88379;
	--skin-surface: #f3f4f6;
}

.theme-swatch[data-theme-swatch='arctic-cyan'] {
	--skin-color: #62c8d8;
	--skin-surface: #0c1a21;
}
</style>
