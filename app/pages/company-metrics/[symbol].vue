<template>
	<div class="p-4 space-y-4">
		<div class="mb-[3.75rem]">
			<TradingviewGadget :symbol="symbol" :symbol-prefix="symbolPrefix" :disabled="uiStore.isMenuShown" />
		</div>

		<!-- 非熱門公司且未登入：只留上面的 K 線，指標區改成登入提示 -->
		<button
			v-if="!canViewMetrics"
			type="button"
			class="flex w-full flex-col items-center gap-1.5 rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center"
			@click="openAuthModal('login')"
		>
			<van-icon name="lock" size="22" class="text-gray-400" />
			<span class="font-[500]">{{ `${bigSymbol} ${$t('company_metrics.pe_forwards_title')}...` }}</span>
			<span class="text-primary">{{ $t('company_metrics.login_to_see_data') }}</span>
		</button>

		<van-notice-bar
			v-if="canViewMetrics && showNotice"
			left-icon="info-o"
			wrapable
			:scrollable="false"
			type="warning"
			:mode="'closeable'"
			@close="showNotice = false"
		>
			{{ $t('company_metrics.pe_forwards_notice') }}
		</van-notice-bar>

		<template v-if="canViewMetrics && metrics.length">
			<LazyMultiLineChart
				v-if="formattedMetrics.length"
				:title="`${bigSymbol} PE Ratios`"
				:chart-data="formattedMetrics"
				x-axis-key="ct"
				:series="[
					{
						name: $t('company_metrics.pe_forwards_title'),
						key: 'fpe',
						color: '#FF5733',
					},
					{
						name: $t('company_metrics.pe_history_title'),
						key: 'pe',
						color: '#00CED1',
					},
				]"
			/>

			<van-notice-bar
				v-if="showNotice"
				left-icon="info-o"
				wrapable
				:scrollable="false"
				type="warning"
				:mode="'closeable'"
				@close="showNotice = false"
			>
				{{ $t('company_metrics.eps_notice') }}
			</van-notice-bar>

			<LazyDualAxisBarChart
				v-if="metrics.length"
				:title="`${bigSymbol} ${$t('company_metrics.eps_comparison')}`"
				:chart-data="metrics"
				x-axis-key="ct"
				first-series-key="feps"
				second-series-key="eps"
				:first-series-name="$t('company_metrics.feps_title')"
				:second-series-name="$t('company_metrics.eps_history_title')"
				firstSeriesColor="#ED6A0C"
				secondSeriesColor="#00CED1"
			/>

			<LazyBarChart
				v-if="metrics.length"
				:title="`${bigSymbol} ${$t('company_metrics.volume_title')}`"
				:chart-data="metrics"
				x-axis-key="ct"
				series-key="v"
			/>
		</template>

		<!-- 有權限看指標但資料還在載入 -->
		<div v-else-if="canViewMetrics" class="flex-y-center justify-center font-[500] mb-2">
			{{ `${bigSymbol} ${$t('company_metrics.pe_forwards_title')}` }}...
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted } from 'vue'
	import { useRoute } from 'vue-router'
	import { useUIStore } from '@/stores/ui'
	import { HOT_COMPANIES } from '@/constants/hotCompanies'
	import { NYSE } from '@/constants/symbolPrefix'
	import { useUserStore } from '@/stores/user'
	import { toUpper as _toUpper, upperCase as _upperCase, reverse as _reverse, get as _get } from 'lodash-es'
	import type { StockMetrics } from '@/types/stockMetrics'

	const uiStore = useUIStore()
	const { open: openAuthModal } = useAuthModal()
	const route = useRoute()
	const userStore = useUserStore()
	const { $publicKV, $bffApi } = useNuxtApp()

	const symbol = computed(() => {
		return route.params.symbol as string
	})

	const bigSymbol = computed(() => {
		return symbol.value?.toUpperCase()
	})

	// TradingView 的 K 線要帶交易所前綴，非 NYSE 名單一律當 NASDAQ
	const symbolPrefix = computed(() => {
		if (NYSE.includes(_upperCase(symbol.value))) return 'NYSE'
		return 'NASDAQ'
	})

	const showNotice = ref(true)

	const metrics = ref<StockMetrics[]>([])

	// API 回傳 fpe / pe 是字串，折線圖需要數字
	const formattedMetrics = computed(() => {
		return metrics.value.map((item) => ({
			...item,
			fpe: parseFloat(item.fpe),
			pe: parseFloat(item.pe),
		}))
	})

	// 熱門公司（探索熱門公司那 23 家）免登入可看指標；其餘公司只開放 K 線，指標要登入
	const isHotCompany = computed(() => HOT_COMPANIES.includes(_toUpper(symbol.value)))
	const canViewMetrics = computed(() => isHotCompany.value || userStore.isLogin)

	const getMetrics = async (symbol: string, days: number = 60) => {
		if (!canViewMetrics.value) return
		// 熱門公司直接打公開的 KV；其餘走 BFF，由 server 從 httpOnly cookie 帶 token 給 KV worker 驗證
		const client = isHotCompany.value ? $publicKV : $bffApi
		try {
			const response = await client.getStatementBySymbol(symbol, days)
			metrics.value = _reverse(_get(response, 'data', []))
		} catch (error) {
			// 錯誤提示由 fetch handler 負責；token 過期的 401 會被當成登出，頁面自然退回鎖定卡
			console.error(`Failed to fetch ${symbol} metrics:`, error)
		}
	}

	onMounted(() => {
		getMetrics(symbol.value)
	})

	// 彈窗登入後頁面不會重新掛載，補抓非熱門股票的資料；登出則清掉已載入的指標
	watch(canViewMetrics, (canView) => {
		if (canView) getMetrics(symbol.value)
		else metrics.value = []
	})

	const { t } = useI18n()

	usePageSeo(
		computed(() => ({
			title: t('company_metrics.meta_title', { symbol: bigSymbol.value }),
			description: t('company_metrics.meta_description', { symbol: bigSymbol.value }),
		}))
	)
</script>
