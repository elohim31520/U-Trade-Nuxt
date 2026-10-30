<template>
	<header class="mb-3.5 flex items-end justify-between gap-3 px-1">
		<div class="flex min-w-0 items-stretch gap-2.5">
			<span aria-hidden="true" class="w-[3px] shrink-0 rounded-full bg-linear-to-b from-primary to-primary-600" />
			<div class="min-w-0 py-px">
				<h2 class="text-[17px] font-semibold leading-tight tracking-tight text-gray-900">{{ title }}</h2>
				<p v-if="subtitle" class="mt-1 text-xs leading-snug text-gray-400">{{ subtitle }}</p>
			</div>
		</div>

		<!-- 右側：預設是「查看更多」連結（有給 to 才出現），要放別的（例如數量徽章）用 aside slot 蓋掉 -->
		<slot name="aside">
			<NuxtLink
				v-if="to"
				:to="localePath(to)"
				class="group inline-flex shrink-0 items-center gap-0.5 rounded-full py-1 pl-2 pr-0.5 text-xs font-medium tracking-[0.04em] text-primary-600 transition-opacity duration-200 [-webkit-tap-highlight-color:transparent] active:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
			>
				<span>{{ $t('see_more.text') }}</span>
				<SvgIcon
					name="icon_chevron_right"
					size="0.875rem"
					class="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
				/>
			</NuxtLink>
		</slot>
	</header>
</template>

<script setup lang="ts">
	const localePath = useLocalePath()

	defineProps<{
		title: string
		subtitle?: string
		/** 「查看更多」連結的目的地（不含語系前綴） */
		to?: string
	}>()
</script>
