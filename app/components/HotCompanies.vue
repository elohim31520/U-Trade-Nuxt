<template>
	<section>
		<SectionHeader
			:title="$t('hot_companies.explore_hot_companies')"
			:subtitle="$t('hot_companies.subtitle')"
			:to="moreTo"
		>
			<template v-if="!moreTo" #aside>
				<span class="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
					{{ companies.length }}
				</span>
			</template>
		</SectionHeader>

		<div class="grid grid-cols-4 gap-x-3 gap-y-4">
			<NuxtLink
				v-for="company in companies"
				:key="company.id"
				:to="localePath(`/company-metrics/${company.id}`)"
				class="group flex min-w-0 flex-col items-center outline-hidden"
			>
				<span
					class="logo-tile relative block aspect-square w-full overflow-hidden rounded-[22%] bg-white transition duration-300 ease-out group-hover:-translate-y-1 group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-primary"
				>
					<img
						:src="company.useLogoPath ? `/logo/${company.id}.svg` : `/hot/${company.id}.webp`"
						:alt="`${company.name} logo`"
						loading="lazy"
						draggable="false"
						class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
					/>
				</span>
				<span
					class="mt-2 max-w-full truncate text-xs font-semibold uppercase leading-none tracking-wider text-gray-800"
				>
					{{ company.id }}
				</span>
				<span class="mt-1 max-w-full truncate text-[10.5px] leading-tight text-gray-400">
					{{ company.name }}
				</span>
			</NuxtLink>
		</div>
	</section>
</template>

<script setup lang="ts">
	const localePath = useLocalePath()

	defineProps<{
		/** 標題列「查看更多」的目的地；不給就在右側顯示公司數量徽章 */
		moreTo?: string
	}>()

	const companies = [
		// --- 熱門建議標的 ---
		{ id: 'spcx', name: 'SpaceX', useLogoPath: true },
		{ id: 'sndk', name: 'Sandisk', useLogoPath: true },
		{ id: 'mu', name: 'Micron', useLogoPath: true },
		{ id: 'cohr', name: 'Coherent', useLogoPath: true },
		{ id: 'lite', name: 'Lumentum', useLogoPath: true },
		{ id: 'tsm', name: 'TSMC', useLogoPath: true },
		{ id: 'amd', name: 'AMD', useLogoPath: true },
		{ id: 'mstr', name: 'Strategy', useLogoPath: true },
		{ id: 'hood', name: 'Robinhood', useLogoPath: true },
		{ id: 'vst', name: 'Vistra', useLogoPath: true },
		{ id: 'app', name: 'AppLovin', useLogoPath: true },
		{ id: 'sofi', name: 'SoFi', useLogoPath: true },
		{ id: 'avgo', name: 'Broadcom', useLogoPath: true },
		{ id: 'crwv', name: 'CoreWeave', useLogoPath: true },
		{ id: 'oklo', name: 'Oklo', useLogoPath: true },
		{ id: 'tsla', name: 'Tesla' },
		{ id: 'nvda', name: 'NVIDIA' },
		{ id: 'pltr', name: 'Palantir' },
		{ id: 'amzn', name: 'Amazon' },
		{ id: 'goog', name: 'Alphabet' },
		{ id: 'meta', name: 'Meta' },
		{ id: 'msft', name: 'Microsoft' },
		{ id: 'aapl', name: 'Apple', useLogoPath: true },
	]
</script>

<style scoped>
	/* 圖磚：細描邊 + 內側頂部高光 + 分層柔影，讓各家品牌底色看起來是同一套 */
	.logo-tile {
		box-shadow:
			0 1px 2px rgb(16 24 40 / 0.06),
			0 6px 16px -4px rgb(16 24 40 / 0.12);
	}

	.logo-tile::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		box-shadow:
			inset 0 0 0 1px rgb(0 0 0 / 0.06),
			inset 0 1px 0 rgb(255 255 255 / 0.35);
	}

	.group:hover .logo-tile {
		box-shadow:
			0 2px 4px rgb(16 24 40 / 0.06),
			0 14px 26px -6px rgb(16 24 40 / 0.22);
	}

	@media (prefers-reduced-motion: reduce) {
		.logo-tile,
		.logo-tile img {
			transition: none;
		}
	}
</style>
