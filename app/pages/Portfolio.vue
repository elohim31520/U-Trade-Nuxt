<template>
	<div class="px-4 pb-6 pt-5">
		<header class="mb-4 px-1">
			<h1 class="text-sm font-bold uppercase tracking-widest">
				{{ $t('portfolio.my_portfolio') }}
			</h1>
		</header>

		<!-- 提示：未登入＝示例說明（附登入按鈕），已登入＝均價計算方式說明 -->
		<aside
			v-if="!dismissed[noticeKey]"
			class="mb-4 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/8 py-3.5 pl-4 pr-2"
		>
			<svg
				class="mt-0.5 shrink-0 text-primary-600"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="9.5" />
				<path d="M12 11v5.5M12 7.6v.1" />
			</svg>
			<div class="min-w-0 flex-1">
				<p class="text-[13px] leading-relaxed text-gray-600">{{ noticeText }}</p>
				<button
					v-if="!userStore.isLogin"
					type="button"
					class="mt-2.5 inline-flex rounded-lg bg-linear-to-r from-accent to-accent-2 px-3.5 py-1.5 transition active:scale-95"
					@click="openAuthModal('login')"
				>
					<span class="text-xs font-semibold text-on-primary">{{ $t('login.login') }}</span>
				</button>
			</div>
			<button
				type="button"
				class="grid size-8 shrink-0 place-items-center rounded-full text-gray-400 transition active:scale-90"
				aria-label="close"
				@click="dismissed[noticeKey] = true"
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<path d="m3 3 8 8M11 3l-8 8" />
				</svg>
			</button>
		</aside>

		<!-- 總覽：總值 + 持股佔比條 -->
		<section v-if="rows.length" class="mb-5 rounded-3xl border border-gray-100 bg-surface-card p-5 shadow-card-primary">
			<div class="flex items-center justify-between">
				<span class="text-xs tracking-widest text-gray-400">{{ $t('portfolio.total_value') }}</span>
				<span class="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium tabular-nums text-gray-500">
					{{ $t('portfolio.holdings_count', { count: rows.length }) }}
				</span>
			</div>

			<p class="mt-3 flex items-baseline font-semibold leading-none tabular-nums text-gray-900">
				<span class="mr-1 text-xl font-medium text-gray-400">$</span>
				<span class="text-[34px] tracking-tight">{{ totalParts.int }}</span>
				<span class="text-lg font-medium text-gray-400">.{{ totalParts.dec }}</span>
			</p>

			<div class="mt-5 flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
				<span
					v-for="row in rows"
					:key="row.symbol"
					class="alloc-seg h-full min-w-1 basis-0 rounded-full"
					:style="{ flexGrow: row.share, background: row.gradient }"
				/>
			</div>
			<ul class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
				<li v-for="row in rows" :key="row.symbol" class="flex items-center gap-1.5 text-xs text-gray-400">
					<span class="size-2 rounded-full" :style="{ background: row.gradient }" aria-hidden="true" />
					<span class="font-medium">{{ row.symbol }}</span>
					<span class="tabular-nums">{{ row.share.toFixed(1) }}%</span>
				</li>
			</ul>
		</section>

		<!-- 分段切換：滑動的底板跟著 active 項目走 -->
		<div role="tablist" class="relative mb-4 grid grid-cols-2 rounded-xl border border-gray-100 bg-gray-50 p-1">
			<span
				aria-hidden="true"
				class="seg-thumb absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg border border-gray-200 bg-surface-card"
				:class="activeTab === 0 ? 'translate-x-0' : 'translate-x-full'"
			/>

			<!-- 文字樣式放在內層 span：Vant 全域 reset 的 button { color/font: inherit } 沒包在 layer 裡，會蓋掉 button 本身的 text-* -->
			<button
				v-for="tab in tabs"
				:key="tab.value"
				type="button"
				role="tab"
				:aria-selected="activeTab === tab.value"
				class="seg-tab relative z-1 rounded-lg py-2"
				@click="activeTab = tab.value"
			>
				<span
					class="seg-label inline-flex items-center justify-center text-sm font-medium tracking-wide"
					:class="activeTab === tab.value ? 'text-gray-900' : 'text-gray-400'"
				>
					{{ tab.label }}
				</span>
			</button>
		</div>

		<!-- 持股詳情 -->
		<template v-if="activeTab === 0">
			<ul v-if="rows.length" class="flex flex-col gap-3">
				<li v-for="(row, index) in rows" :key="row.symbol" class="row-in" :style="{ '--i': index }">
					<van-swipe-cell
						class="holding rounded-2xl border border-gray-100 bg-surface-card"
						:disabled="!userStore.isLogin"
						:left-width="SWIPE_WIDTH"
						:right-width="SWIPE_WIDTH"
						@close="(details) => onClose(details, row.item)"
					>
						<div class="relative px-4 pb-3.5 pt-4">
							<!-- 左側持股色條，與佔比條同色 -->
							<span
								aria-hidden="true"
								class="absolute inset-y-4 left-0 w-[3px] rounded-r-full"
								:style="{ background: row.gradient }"
							/>

							<div class="flex items-center gap-3.5">
								<!-- 圖磚：沒有 logo 的標的（XAUUSD、BTCUSD …）退回持股色底 + 代號縮寫 -->
								<span
									class="logo-tile relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[22%]"
									:style="{ background: row.gradient }"
								>
									<span class="text-[11px] font-bold tracking-wide text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.25)]">
										{{ initials(row) }}
									</span>
									<img
										v-if="!failed[row.symbol]"
										:src="logoUrl(row.symbol)"
										:alt="`${row.symbol} logo`"
										loading="lazy"
										draggable="false"
										class="absolute inset-0 size-full bg-white object-cover transition-opacity duration-300"
										:class="loaded[row.symbol] ? 'opacity-100' : 'opacity-0'"
										@load="loaded[row.symbol] = true"
										@error="failed[row.symbol] = true"
									/>
								</span>

								<span class="min-w-0 flex-1">
									<span class="block truncate text-[15px] font-semibold leading-tight">{{ row.symbol }}</span>
									<span v-if="row.item.company?.name" class="mt-1 block truncate text-xs leading-none text-gray-400">
										{{ row.item.company.name }}
									</span>
								</span>

								<span class="shrink-0 text-right">
									<span class="block text-[15px] font-semibold leading-tight tabular-nums">
										${{ formatMoney(row.value) }}
									</span>
									<span
										class="mt-1.5 inline-block rounded-md bg-gray-50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-gray-500"
									>
										{{ row.share.toFixed(1) }}%
									</span>
								</span>
							</div>

							<dl class="mt-3.5 grid grid-cols-2 border-t border-gray-100 pt-3">
								<div>
									<dt class="text-xs text-gray-400">{{ $t('portfolio.quantity') }}</dt>
									<dd class="mt-0.5 text-sm font-medium tabular-nums">{{ formatQuantity(row.item.quantity) }}</dd>
								</div>
								<div class="border-l border-gray-100 pl-4">
									<dt class="text-xs text-gray-400">{{ $t('portfolio.average_price') }}</dt>
									<dd class="mt-0.5 text-sm font-medium tabular-nums">
										${{ formatMoney(Number(row.item.averagePrice || 0)) }}
									</dd>
								</div>
							</dl>
						</div>

						<template #left>
							<div
								class="flex h-full w-[76px] flex-col items-center justify-center gap-1 bg-linear-to-br from-accent to-accent-2 text-on-primary"
							>
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
									<path d="m13.5 6.5 4 4" />
								</svg>
								<span class="text-xs font-medium">{{ $t('portfolio.update') }}</span>
							</div>
						</template>
						<template #right>
							<div class="flex h-full w-[76px] flex-col items-center justify-center gap-1 bg-red-500 text-white">
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path
										d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"
									/>
								</svg>
								<span class="text-xs font-medium">{{ $t('portfolio.delete') }}</span>
							</div>
						</template>
					</van-swipe-cell>
				</li>
			</ul>

			<div
				v-else
				class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-14 text-gray-400"
			>
				<SvgIcon name="icon_ghost" size="2.5rem" />
				<p class="text-sm">{{ $t('portfolio.loading_or_no_holding') }}</p>
			</div>

			<p
				v-if="userStore.isLogin && rows.length"
				class="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4" />
				</svg>
				{{ $t('portfolio.swipe_hint') }}
			</p>
		</template>

		<!-- 圖表分析 -->
		<section v-else class="rounded-3xl border border-gray-100 bg-surface-card p-5 shadow-card-primary">
			<PortfolioChart />
		</section>

		<TransactionFormPopup
			v-model="showUpdatePopup"
			:item="selectedItemForUpdate"
			@submit-success="onUpdateSuccess"
			:api-function="
				(payload) =>
					$bffApi.updatePortfolio({
						stockSymbol: payload.stockSymbol,
						quantity: payload.quantity,
						averagePrice: payload.price,
					})
			"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref, reactive, computed, onMounted, watch, onActivated } from 'vue'
	import { showConfirmDialog, showToast } from 'vant'
	import { usePortfolioStore } from '@/stores/portfolio'
	import { formatMoney } from '~/utils/util'
	import type { PortfolioItem } from '@/types/portfolio'
	import type { AllocationRow } from '@/composables/usePortfolioAllocation'
	import { useI18n } from 'vue-i18n'
	import { useUserStore } from '@/stores/user'

	const { t } = useI18n()
	const portfolioStore = usePortfolioStore()
	const userStore = useUserStore()
	const { $bffApi } = useNuxtApp()
	const { open: openAuthModal } = useAuthModal()
	const { rows, total } = usePortfolioAllocation()

	// 左右滑出的操作區寬度（px）
	const SWIPE_WIDTH = 76

	// 未登入（示例說明）與已登入（均價說明）各自記得有沒有被關掉，彈窗登入後才會看到另一則
	const dismissed = reactive({ guest: false, member: false })
	const noticeKey = computed(() => (userStore.isLogin ? 'member' : 'guest'))
	const noticeText = computed(() => (userStore.isLogin ? t('portfolio.notice') : t('portfolio.login_for_portfolio')))

	defineOptions({
		name: 'portfolio',
	})

	const activeTab = ref(0)
	const tabs = computed(() => [
		{ value: 0, label: t('portfolio.holding_details') },
		{ value: 1, label: t('portfolio.chart_analysis') },
	])

	const showUpdatePopup = ref(false)
	const selectedItemForUpdate = ref<PortfolioItem | null>(null)
	const isDataRefreshed = ref(false)

	// 整數與小數拆開，小數部分用較小較淡的字
	const totalParts = computed(() => {
		const [int, dec] = formatMoney(total.value).split('.')
		return { int: int ?? '0', dec: dec ?? '00' }
	})

	const formatQuantity = (quantity?: number) =>
		Number(quantity || 0).toLocaleString('en-US', { maximumFractionDigits: 8 })

	// logo 載入失敗的 symbol 退回縮寫圖磚；loaded 讓圖片載入完成才淡入，避免閃一下空白
	const failed = reactive<Record<string, boolean>>({})
	const loaded = reactive<Record<string, boolean>>({})
	const logoUrl = (symbol: string) => `/logo/${symbol.toLowerCase()}.svg`
	const initials = (row: AllocationRow) => (row.item.company?.symbol || row.symbol).slice(0, 3).toUpperCase()

	const onClose = (details: any, item: PortfolioItem) => {
		if (!userStore.isLogin) return
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
					title: t('portfolio.confirm'),
					message: t('portfolio.confirm_delete'),
				})
					.then(() => {
						if (!item.id) {
							showToast(t('portfolio.missing_item_id'))
							return Promise.reject('Missing item id')
						}
						return $bffApi.deletePortfolio(item.id)
					})
					.then(() => {
						portfolioStore.fetchMyPortfolio()
						showToast(t('portfolio.delete_success'))
					})
				break
		}
	}

	const onUpdateSuccess = () => {
		portfolioStore.fetchMyPortfolio()
	}

	const fetchData = () => {
		if (userStore.isLogin) {
			portfolioStore.fetchMyPortfolio()
		} else {
			portfolioStore.fetchMockPortfolio()
		}
	}

	onMounted(() => {
		fetchData()
	})

	// 彈窗登入後頁面不會重新掛載，改抓自己的資料取代 mock
	watch(() => userStore.isLogin, fetchData)

	onActivated(() => {
		if (userStore.isLogin && !isDataRefreshed.value) {
			fetchData()
			isDataRefreshed.value = true
		}
	})
</script>

<style scoped>
	/* 分段切換底板 */
	.seg-thumb {
		box-shadow: 0 1px 2px rgb(16 24 40 / 0.06);
		transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.seg-tab {
		-webkit-tap-highlight-color: transparent;
	}

	.seg-label {
		transition: color 0.3s;
	}

	/* 佔比條：圖層段落之間的縫由 gap 提供，進場時由左向右展開 */
	.alloc-seg {
		transform-origin: left center;
		animation: alloc-in 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}

	@keyframes alloc-in {
		from {
			opacity: 0;
			transform: scaleX(0.3);
		}
	}

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

	/* 切換 tab 後，列表逐筆淡入上移 */
	.row-in {
		animation: row-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		animation-delay: calc(var(--i) * 45ms);
	}

	@keyframes row-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.seg-thumb,
		.seg-label {
			transition: none;
		}

		.row-in,
		.alloc-seg {
			animation: none;
		}
	}
</style>
