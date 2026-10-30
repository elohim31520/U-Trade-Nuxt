<template>
	<section v-if="items.length">
		<SectionHeader :title="$t('market_quotes.title')">
			<template #aside>
				<!-- 時間靠瀏覽器時區算，SSR 的 HTML 會被 swr 快取共用，所以掛載後才填 -->
				<time v-if="updatedAt" class="shrink-0 text-xs tabular-nums text-gray-400">
					{{ $t('market_quotes.updated_at', { time: updatedAt }) }}
				</time>
			</template>
		</SectionHeader>

		<!-- 第一檔放大橫跨兩欄當主角，其餘兩欄並排 -->
		<div class="grid grid-cols-2 gap-3">
			<NuxtLink
				v-for="(item, index) in items"
				:key="item.symbol"
				:to="localePath(`/asset-price-chart/${item.symbol.toLowerCase()}`)"
				class="group relative isolate flex overflow-hidden rounded-2xl border border-gray-100 bg-surface-card p-4 shadow-card-soft outline-hidden transition duration-200 hover:border-gray-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
				:class="index === 0 ? 'col-span-2 items-end justify-between gap-3' : 'flex-col gap-4'"
			>
				<span
					v-if="index === 0"
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 -z-10 bg-radial-[100%_120%_at_100%_0%] from-primary/15 to-transparent to-70%"
				/>

				<SvgIcon
					name="icon_chevron_right"
					size="1rem"
					class="absolute right-3 top-4 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
				/>

				<!-- 縮寫磚 + 名稱 -->
				<span class="flex min-w-0 flex-col gap-3">
					<span
						class="grid size-9 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-[10px] font-semibold tracking-wide text-primary-600"
					>
						{{ item.badge }}
					</span>
					<span class="truncate text-xs font-medium text-gray-500">{{ item.name }}</span>
				</span>

				<!-- 價格：整數放大，小數與單位退成淡色小字 -->
				<!-- flex：元素之間不會被 Vue 補一個空白字元 -->
				<span
					class="flex shrink-0 items-baseline font-semibold leading-none tracking-tight tabular-nums text-gray-900"
					:class="index === 0 ? 'text-[32px]' : 'text-[22px]'"
				>
					<span v-if="item.price.prefix" class="mr-0.5 self-start text-[0.55em] font-medium text-gray-400">
						{{ item.price.prefix }}
					</span>
					<span>{{ item.price.int }}</span>
					<span class="text-[0.6em] font-medium text-gray-400">{{ item.price.dec }}</span>
					<span v-if="item.price.suffix" class="ml-0.5 text-[0.6em] font-medium text-gray-400">
						{{ item.price.suffix }}
					</span>
				</span>
			</NuxtLink>
		</div>
	</section>
</template>

<script lang="ts" setup>
	import { format } from 'date-fns'
	import type { MarketQuotes } from '@/types/market'

	interface QuoteMeta {
		badge: string
		name: string
		prefix?: string
		suffix?: string
		/** 小數位數：殖利率習慣顯示到 3 位，其餘 2 位 */
		digits: number
	}

	const { $publicKV } = useNuxtApp()
	const localePath = useLocalePath()
	const { t } = useI18n()

	// 顯示順序：先放最受關注的，API 回來的順序不固定；不在清單內的排最後
	const SYMBOL_ORDER = ['BTCUSD', 'XAUUSD', 'USOIL', 'DXY', 'US10Y']
	const rank = (symbol: string) => {
		const i = SYMBOL_ORDER.indexOf(symbol)
		return i === -1 ? SYMBOL_ORDER.length : i
	}

	// 單位依標的而定：美元指數是點數、10 年期公債是殖利率(%)，都不是美元價格
	const quoteMeta = computed<Record<string, QuoteMeta>>(() => ({
		BTCUSD: { badge: 'BTC', name: t('market_quotes.btcusd'), prefix: '$', digits: 2 },
		XAUUSD: { badge: 'XAU', name: t('market_quotes.xauusd'), prefix: '$', digits: 2 },
		USOIL: { badge: 'OIL', name: t('market_quotes.usoil'), prefix: '$', digits: 2 },
		DXY: { badge: 'DXY', name: t('market_quotes.dxy'), digits: 2 },
		US10Y: { badge: '10Y', name: t('market_quotes.us10y'), suffix: '%', digits: 3 },
	}))

	const formatPrice = (raw: string, meta?: QuoteMeta) => {
		const value = Number(raw)
		if (!Number.isFinite(value)) return { prefix: '', int: '--', dec: '', suffix: '' }

		const digits = meta?.digits ?? 2
		// 固定 en-US：千分位逗號與小數點在 server / client 一致，不會 hydration mismatch
		const [int = '', dec = ''] = value
			.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
			.split('.')

		return { prefix: meta?.prefix ?? '', int, dec: dec ? `.${dec}` : '', suffix: meta?.suffix ?? '' }
	}

	const { data: fetchedData } = await useAsyncData<MarketQuotes[]>(
		'market-quotes-data',
		async () => {
			const res = await $publicKV.getQuotes()
			return _get(res, 'data', [])
		},
		{
			default: () => [],
		}
	)

	const items = computed(() =>
		[...(fetchedData.value ?? [])]
			.sort((a, b) => rank(a.symbol) - rank(b.symbol))
			.map((quote) => {
				const meta = quoteMeta.value[quote.symbol]

				return {
					symbol: quote.symbol,
					badge: meta?.badge ?? quote.symbol.slice(0, 3),
					name: meta?.name ?? quote.symbol,
					price: formatPrice(quote.price, meta),
				}
			})
	)

	const updatedAt = ref('')

	onMounted(() => {
		const latest = Math.max(...(fetchedData.value ?? []).map((quote) => Date.parse(quote.createdAt)))
		if (Number.isFinite(latest)) updatedAt.value = format(latest, 'MM/dd HH:mm')
	})
</script>
