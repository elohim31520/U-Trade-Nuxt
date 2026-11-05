<template>
	<section
		class="overflow-hidden rounded-2xl border border-gray-100 bg-surface-card shadow-card-soft motion-safe:animate-row-in"
	>
		<header class="px-4 pt-4">
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0">
					<h3 class="text-[15px] font-semibold leading-tight tracking-tight text-gray-900">{{ title }}</h3>
					<p v-if="subtitle" class="mt-1 text-xs leading-snug text-gray-400">{{ subtitle }}</p>
				</div>

				<!-- 名詞說明預設收起，取代原本佔一大塊版面的黃色提示條 -->
				<button
					v-if="info"
					type="button"
					:aria-expanded="open"
					:aria-label="$t('company_metrics.info_label')"
					class="-mr-1.5 -mt-1 grid size-8 shrink-0 place-items-center rounded-full outline-hidden transition duration-200 [-webkit-tap-highlight-color:transparent] active:scale-90 focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
					:class="open ? 'bg-primary/10' : 'hover:bg-gray-50'"
					@click="open = !open"
				>
					<SvgIcon
						name="icon_info"
						size="1.125rem"
						class="transition-colors duration-200 motion-reduce:transition-none"
						:class="open ? 'text-primary-600' : 'text-gray-400'"
					/>
				</button>
			</div>

			<!-- 圖例：線段／色塊跟圖上的系列同色 -->
			<ul v-if="legend?.length" class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
				<li v-for="item in legend" :key="item.label" class="flex items-center gap-1.5 text-xs text-gray-500">
					<span aria-hidden="true" class="h-[3px] w-3.5 rounded-full" :style="{ background: item.color }" />
					{{ item.label }}
				</li>
			</ul>

			<div
				v-if="info"
				class="grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
				:class="open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
				:aria-hidden="!open"
			>
				<div class="overflow-hidden">
					<p class="mt-3 rounded-xl bg-primary/8 px-3 py-2.5 text-xs leading-relaxed text-gray-600">{{ info }}</p>
				</div>
			</div>
		</header>

		<div class="px-2 pb-3 pt-3">
			<slot />
		</div>
	</section>
</template>

<script setup lang="ts">
	defineProps<{
		title: string
		subtitle?: string
		/** 名詞說明；有給才會出現右上角的 ⓘ 按鈕 */
		info?: string
		legend?: { label: string; color: string }[]
	}>()

	const open = ref(false)
</script>
