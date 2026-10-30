<template>
	<div class="px-4 pb-6 pt-5">
		<header class="mb-5 px-1">
			<h1 class="text-sm font-bold uppercase tracking-widest">{{ $t('records.transaction_records') }}</h1>
			<p class="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
				<SvgIcon name="icon_arrows_horizontal" size="14px" class="shrink-0" />
				{{ $t('records.swipe_hint') }}
			</p>
		</header>

		<Waterfall ref="waterfallRef" dataPath="data.data" :apiFunction="fetchTrades" :finishedText="$t('records.no_more')">
			<template #default="{ list, finished }">
				<!-- 第一次載入：骨架屏 -->
				<ul v-if="!list.length && !finished" class="records-skeleton flex flex-col gap-3" aria-hidden="true">
					<li v-for="n in 3" :key="n" class="rounded-2xl border border-gray-100 bg-surface-card px-4 pb-3.5 pt-4">
						<div class="flex items-center gap-3.5">
							<span class="animate-gray size-11 shrink-0 rounded-[22%]" />
							<span class="min-w-0 flex-1">
								<span class="animate-gray block h-3.5 w-16 rounded-md" />
								<span class="animate-gray mt-2 block h-3 w-28 rounded-md" />
							</span>
							<span class="flex shrink-0 flex-col items-end">
								<span class="animate-gray block h-3.5 w-20 rounded-md" />
								<span class="animate-gray mt-2 block h-5 w-14 rounded-md" />
							</span>
						</div>
						<div class="mt-3.5 grid grid-cols-3 gap-4 border-t border-gray-100 pt-3">
							<span v-for="m in 3" :key="m" class="animate-gray block h-8 rounded-md" />
						</div>
					</li>
				</ul>

				<!-- 沒有任何紀錄 -->
				<div
					v-else-if="!list.length"
					class="records-empty flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-14 text-gray-400"
				>
					<SvgIcon name="icon_ghost" size="2.5rem" />
					<p class="text-sm">{{ $t('records.empty') }}</p>
					<NuxtLink
						:to="localePath('/add-transaction')"
						class="mt-1 inline-flex rounded-lg bg-linear-to-r from-accent to-accent-2 px-4 py-2 transition active:scale-95"
					>
						<span class="text-xs font-semibold text-on-primary">{{ $t('sidemenu.add_record') }}</span>
					</NuxtLink>
				</div>

				<!-- 依月份分組的紀錄 -->
				<section v-for="group in groupByMonth(list)" :key="group.key" class="mb-6">
					<h2 class="mb-3 flex items-center gap-3 px-1 text-xs font-semibold tracking-widest text-gray-400">
						<span>{{ group.label }}</span>
						<span class="h-px flex-1 bg-gray-200" aria-hidden="true" />
					</h2>

					<ul class="flex flex-col gap-3">
						<li
							v-for="(item, index) in group.items"
							:key="item.id"
							class="row-in"
							:style="{ '--i': Math.min(index, 8) }"
						>
							<van-swipe-cell
								class="record rounded-2xl border border-gray-100 bg-surface-card"
								:left-width="SWIPE_WIDTH"
								:right-width="SWIPE_WIDTH"
								@close="(details) => onClose(details, item)"
							>
								<div class="relative px-4 pb-3.5 pt-4">
									<!-- 左側買賣色條 -->
									<span
										aria-hidden="true"
										class="absolute inset-y-4 left-0 w-[3px] rounded-r-full"
										:class="item.type === 'buy' ? 'bg-emerald-500/70' : 'bg-red-500/70'"
									/>

									<div class="flex items-center gap-3.5">
										<!-- 圖磚：沒有 logo 的標的退回主色底 + 代號縮寫 -->
										<span
											class="logo-tile relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[22%] bg-linear-to-br from-accent to-accent-2"
										>
											<span
												class="text-[11px] font-bold tracking-wide text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.25)]"
											>
												{{ initials(item) }}
											</span>
											<img
												v-if="!failed[item.stockSymbol]"
												:src="logoUrl(item.stockSymbol)"
												:alt="`${item.stockSymbol} logo`"
												loading="lazy"
												draggable="false"
												class="absolute inset-0 size-full bg-white object-cover transition-opacity duration-300"
												:class="loaded[item.stockSymbol] ? 'opacity-100' : 'opacity-0'"
												@load="loaded[item.stockSymbol] = true"
												@error="failed[item.stockSymbol] = true"
											/>
										</span>

										<span class="min-w-0 flex-1">
											<span class="block truncate text-[15px] font-semibold leading-tight">{{ item.stockSymbol }}</span>
											<span v-if="item.company?.name" class="mt-1 block truncate text-xs leading-none text-gray-400">
												{{ item.company.name }}
											</span>
										</span>

										<span class="shrink-0 text-right">
											<span class="block text-[15px] font-semibold leading-tight tabular-nums">
												${{ formatMoney(tradeTotal(item)) }}
											</span>
											<span
												class="mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
												:class="item.type === 'buy' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'"
											>
												<SvgIcon name="icon_triangle" size="7px" :class="{ 'rotate-180': item.type !== 'buy' }" />
												{{ item.type === 'buy' ? $t('records.buy') : $t('records.sell') }}
											</span>
										</span>
									</div>

									<!-- 日期欄吃內容寬度，數量與價格均分剩下的；窄螢幕下日期不會被擠掉 -->
									<dl class="mt-3.5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] border-t border-gray-100 pt-3">
										<div class="min-w-0">
											<dt class="text-xs text-gray-400">{{ $t('records.quantity') }}</dt>
											<dd class="mt-0.5 truncate text-sm font-medium tabular-nums">
												{{ formatQuantity(item.quantity) }}
											</dd>
										</div>
										<div class="min-w-0 border-l border-gray-100 pl-3.5">
											<dt class="text-xs text-gray-400">{{ $t('records.price') }}</dt>
											<dd class="mt-0.5 truncate text-sm font-medium tabular-nums">
												${{ formatMoney(Number(item.price || 0)) }}
											</dd>
										</div>
										<div class="border-l border-gray-100 pl-3.5">
											<dt class="text-xs text-gray-400">{{ $t('records.date') }}</dt>
											<dd class="mt-0.5 text-sm font-medium tabular-nums">{{ formatDate(item.date) }}</dd>
										</div>
									</dl>
								</div>

								<template #left>
									<div
										class="flex h-full w-[76px] flex-col items-center justify-center gap-1 bg-linear-to-br from-accent to-accent-2 text-on-primary"
									>
										<SvgIcon name="icon_pencil" size="18px" />
										<span class="text-xs font-medium">{{ $t('records.update') }}</span>
									</div>
								</template>
								<template #right>
									<div class="flex h-full w-[76px] flex-col items-center justify-center gap-1 bg-red-500 text-white">
										<SvgIcon name="icon_trash" size="18px" />
										<span class="text-xs font-medium">{{ $t('records.delete') }}</span>
									</div>
								</template>
							</van-swipe-cell>
						</li>
					</ul>
				</section>
			</template>
		</Waterfall>

		<TransactionFormPopup
			v-model="showUpdatePopup"
			mode="trade"
			:item="selectedItemForUpdate"
			@submit-success="onUpdateSuccess"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref, reactive, computed, useTemplateRef } from 'vue'
	import { showConfirmDialog } from 'vant'
	import { formatDate } from '@/utils/date'
	import { formatMoney } from '~/utils/util'
	import Waterfall from '@/components/Waterfall/index.vue'
	import TransactionFormPopup from '@/components/TransactionFormPopup.vue'
	import { useI18n } from 'vue-i18n'
	import type { TradeWithCompany } from '@/types/trade'

	interface MonthGroup {
		key: string
		label: string
		items: TradeWithCompany[]
	}

	const { t, locale } = useI18n()
	const localePath = useLocalePath()
	const { $bffApi } = useNuxtApp()

	// 左右滑出的操作區寬度（px）
	const SWIPE_WIDTH = 76

	const fetchTrades = (params: Record<string, unknown>) => $bffApi.getTrades(params)

	definePageMeta({
		middleware: 'auth',
	})

	defineOptions({
		name: 'records',
	})

	const waterfallRef = useTemplateRef<InstanceType<typeof Waterfall>>('waterfallRef')
	const showUpdatePopup = ref(false)
	const selectedItemForUpdate = ref<TradeWithCompany | null>(null)

	// 相鄰、同月份的紀錄歸成一組；只看相鄰所以不依賴 API 的排序方向，分頁載入新資料時也會自然接上
	const monthFormatter = computed(() => new Intl.DateTimeFormat(locale.value, { year: 'numeric', month: 'long' }))
	const groupByMonth = (list: unknown[]): MonthGroup[] => {
		const groups: MonthGroup[] = []
		for (const item of list as TradeWithCompany[]) {
			const date = new Date(item.date)
			const valid = !Number.isNaN(date.getTime())
			const key = valid ? `${date.getFullYear()}-${date.getMonth()}` : 'unknown'

			let group = groups.at(-1)
			if (group?.key !== key) {
				group = { key, label: valid ? monthFormatter.value.format(date) : '—', items: [] }
				groups.push(group)
			}
			group.items.push(item)
		}
		return groups
	}

	const tradeTotal = (item: TradeWithCompany) => {
		const amount = Number(item.quantity) * Number(item.price)
		return Number.isFinite(amount) ? amount : 0
	}

	const formatQuantity = (quantity?: string) =>
		Number(quantity || 0).toLocaleString('en-US', { maximumFractionDigits: 8 })

	// logo 載入失敗的 symbol 退回縮寫圖磚；loaded 讓圖片載入完成才淡入，避免閃一下空白
	const failed = reactive<Record<string, boolean>>({})
	const loaded = reactive<Record<string, boolean>>({})
	const logoUrl = (symbol: string) => `/logo/${symbol.toLowerCase()}.svg`
	const initials = (item: TradeWithCompany) => (item.company?.symbol || item.stockSymbol).slice(0, 3).toUpperCase()

	const onClose = (details: any, item: TradeWithCompany) => {
		const { position } = details
		switch (position) {
			case 'left':
				selectedItemForUpdate.value = item
				showUpdatePopup.value = true
				break
			case 'cell':
				break
			case 'right':
				showConfirmDialog({
					title: t('records.confirm_title'),
					message: t('records.confirm_delete_message'),
				}).then(async () => {
					if (item.id) {
						await $bffApi.deleteTrade(item.id)
						waterfallRef.value?.refresh()
					}
				})
				break
		}
	}

	const onUpdateSuccess = () => {
		waterfallRef.value?.refresh()
	}
</script>

<style scoped>
	/* 圖磚：細描邊 + 內側頂部高光 + 分層柔影（與 VolatileAsset 一致） */
	.logo-tile {
		box-shadow:
			0 1px 2px rgb(16 24 40 / 0.06),
			0 4px 10px -3px rgb(16 24 40 / 0.14);
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

	/* 骨架屏顯示時，van-list 自己的 loading 文字就多餘了；空狀態下也不需要「到底了」 */
	:deep(.records-skeleton + .van-list__loading),
	:deep(.records-empty ~ .van-list__finished-text) {
		display: none;
	}

	/* 分頁載入中／到底的提示，換成與頁面一致的小字 */
	:deep(.van-list__loading),
	:deep(.van-list__finished-text) {
		padding: 0.5rem 0 0.25rem;
		font-size: 12px;
		letter-spacing: 0.1em;
		color: var(--color-gray-400);
	}

	/* 新載入的紀錄逐筆淡入上移 */
	.row-in {
		animation: row-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		animation-delay: calc(var(--i, 0) * 45ms);
	}

	@keyframes row-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.row-in {
			animation: none;
		}
	}
</style>
