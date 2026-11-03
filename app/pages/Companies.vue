<template>
	<div class="px-4 pb-6 pt-4">
		<header class="mb-4 px-1">
			<div class="flex items-center gap-2.5">
				<h1 class="text-[26px] font-bold leading-tight tracking-tight text-gray-900">{{ $t('companies.title') }}</h1>

				<!-- 目前顯示的公司數（搜尋時會跟著變） -->
				<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary-600">
					{{ filtered.length }}
				</span>
			</div>
			<p class="mt-1.5 text-[13px] leading-snug text-gray-500">{{ $t('companies.subtitle') }}</p>
		</header>

		<!-- 搜尋：代號或公司名稱 -->
		<label class="relative mb-3 block">
			<span class="sr-only">{{ $t('companies.search_placeholder') }}</span>
			<SvgIcon
				name="icon_search"
				size="1rem"
				class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
			/>
			<input
				v-model="keyword"
				type="search"
				enterkeyhint="search"
				autocomplete="off"
				autocapitalize="off"
				spellcheck="false"
				:placeholder="$t('companies.search_placeholder')"
				class="h-11 w-full rounded-xl border border-gray-100 bg-surface-card pl-10 pr-10 text-base text-gray-900 shadow-card-soft outline-hidden transition duration-200 placeholder:text-gray-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none [&::-webkit-search-cancel-button]:hidden"
			/>
			<button
				v-if="keyword"
				type="button"
				:aria-label="$t('companies.clear')"
				class="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full outline-hidden transition duration-200 [-webkit-tap-highlight-color:transparent] active:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
				@click="keyword = ''"
			>
				<SvgIcon name="icon_close" size="0.75rem" class="text-gray-400" />
			</button>
		</label>

		<!-- 依字母分組：右側 A–Z 索引縮進 16px 的邊距裡，不壓到卡片；字母標題黏在 header 底下。
			 Vant 的 CSS 沒包在 layer 裡，會蓋過 Tailwind utility，所以索引的 padding 要加 !；
			 class 名稱裡的 __ 在 Tailwind 任意值裡要寫成 \_\_，否則會被當成空格 -->
		<van-index-bar
			v-if="groups.length"
			:index-list="indexList"
			:sticky-offset-top="48"
			class="[--van-index-anchor-font-size:12px] [--van-index-anchor-line-height:30px] [--van-index-anchor-padding:0_1.25rem] [--van-index-anchor-sticky-background:color-mix(in_oklch,var(--color-surface)_92%,transparent)] [--van-index-anchor-sticky-text-color:var(--color-primary-600)] [--van-index-anchor-text-color:var(--color-gray-400)] [--van-index-bar-index-active-color:var(--color-primary-600)] [--van-index-bar-index-font-size:10.5px] [--van-index-bar-index-line-height:1.35] [&_.van-index-anchor--sticky]:backdrop-blur-md [&_.van-index-anchor]:tracking-widest [&_.van-index-bar\_\_index]:px-1! [&_.van-index-bar\_\_sidebar]:text-gray-400"
		>
			<template v-for="group in groups" :key="group.letter">
				<van-index-anchor :index="group.letter" />

				<!-- 同一個字母的公司併成一張卡片，用細線分隔，比一家一個框乾淨 -->
				<ul
					class="mb-2 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-surface-card shadow-card-soft"
				>
					<li v-for="company in group.items" :key="company.symbol">
						<NuxtLink
							:to="localePath(`/company-metrics/${company.symbol}`)"
							class="group flex items-center gap-3 px-3.5 py-2.5 outline-hidden transition-colors duration-150 hover:bg-gray-50 active:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-reduce:transition-none"
						>
							<!-- 公司 logo -->
							<span
								class="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[22%] bg-white shadow-[0_1px_2px_rgb(16_24_40/0.06),0_4px_10px_-3px_rgb(16_24_40/0.14)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] after:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.35)]"
							>
								<img
									v-if="!failed[company.symbol]"
									:src="logoUrl(company.symbol)"
									:alt="`${company.name} logo`"
									loading="lazy"
									draggable="false"
									class="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
									@error="failed[company.symbol] = true"
								/>
								<SvgIcon v-else name="icon_ghost" size="1.5rem" class="text-gray-300" />
							</span>

							<!-- 代號 / 名稱 -->
							<span class="min-w-0 flex-1">
								<span class="block text-[13px] font-semibold uppercase leading-none tracking-wider text-gray-900">
									{{ company.symbol }}
								</span>
								<span class="mt-1.5 block truncate text-xs leading-none text-gray-400">{{ company.name }}</span>
							</span>

							<SvgIcon
								name="icon_chevron_right"
								size="1rem"
								class="shrink-0 text-gray-300 transition duration-200 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none"
							/>
						</NuxtLink>
					</li>
				</ul>
			</template>
		</van-index-bar>

		<!-- 搜尋不到 -->
		<div v-else class="flex flex-col items-center gap-3 py-20 text-gray-400">
			<SvgIcon name="icon_ghost" size="2.5rem" class="text-gray-300" />
			<p class="text-sm">{{ $t('companies.empty') }}</p>
		</div>

		<van-back-top right="1rem" bottom="3.5rem" />
	</div>
</template>

<script setup lang="ts">
	import type { Company } from '../types/api'

	const localePath = useLocalePath()
	const { $publicKV } = useNuxtApp()

	defineOptions({
		name: 'companies',
	})

	const { data: companies } = await useAsyncData<Company[]>('company-symbols', async () => {
		const res = await $publicKV.getCompanySymbols()
		return res.data
	})

	const keyword = ref('')

	// 依代號排序後，再依代號或公司名稱過濾（不分大小寫）；資料本身不保證照字母排
	const filtered = computed(() => {
		const list = [...(companies.value ?? [])].sort((a, b) => a.symbol.localeCompare(b.symbol))
		const q = keyword.value.trim().toLowerCase()
		if (!q) return list
		return list.filter((c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
	})

	// 依代號首字母分組，組別照字母排序
	const groups = computed(() => {
		const map = new Map<string, Company[]>()
		for (const company of filtered.value) {
			const letter = company.symbol?.[0]?.toUpperCase() ?? '#'
			const items = map.get(letter)
			if (items) items.push(company)
			else map.set(letter, [company])
		}
		return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([letter, items]) => ({ letter, items }))
	})

	const indexList = computed(() => groups.value.map((g) => g.letter))

	// logo 載入失敗的 symbol，改顯示預設圖示
	const failed = reactive<Record<string, boolean>>({})

	const logoUrl = (symbol: string) => `/logo/${symbol.toLowerCase()}.svg`

	const { t } = useI18n()

	usePageSeo(
		computed(() => ({
			title: t('companies.meta_title'),
			description: t('companies.meta_description'),
		}))
	)
</script>
