<template>
	<div class="p-4 space-y-4">
		<div class="mb-60">
			<TradingviewGadget :symbol="symbol" :disabled="uiStore.isMenuShown" />
		</div>

		<van-notice-bar v-if="showNotice" left-icon="info-o" wrapable :scrollable="false" type="warning"
			:mode="'closeable'" @close="showNotice = false">
			{{ $t('company_metrics.pe_forwards_notice') }}
		</van-notice-bar>

		<template v-if="metrics.length">
			<LazyMultiLineChart v-if="metrics.length" :title="`${bigSymbol} PE Ratios`" :chart-data="metrics"
				x-axis-key="ct" :series="[
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
				]" />

			<van-notice-bar v-if="showNotice" left-icon="info-o" wrapable :scrollable="false" type="warning"
				:mode="'closeable'" @close="showNotice = false">
				{{ $t('company_metrics.eps_notice') }}
			</van-notice-bar>

			<LazyDualAxisBarChart v-if="metrics.length" :title="`${bigSymbol} ${$t('company_metrics.eps_comparison')}`"
				:chart-data="metrics" x-axis-key="ct" first-series-key="feps" second-series-key="eps"
				:first-series-name="$t('company_metrics.feps_title')"
				:second-series-name="$t('company_metrics.eps_history_title')" firstSeriesColor="#ED6A0C"
				secondSeriesColor="#00CED1" />

			<LazyBarChart v-if="metrics.length" :title="`${bigSymbol} ${$t('company_metrics.volume_title')}`"
				:chart-data="metrics" x-axis-key="ct" series-key="v" />
		</template>

		<div v-else>
			<div class="flex-y-center justify-center font-[500] mb-2">
				{{ `${bigSymbol} ${$t('company_metrics.pe_forwards_title')}` }}...
			</div>
			<div class="flex-y-center justify-center text-primary" @click="openAuthModal('login')">
				{{ $t('company_metrics.login_to_see_data') }}
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { HOT_COMPANIES } from '@/constants/hotCompanies'
import { useUserStore } from '@/stores/user'
import { toUpper as _toUpper, reverse as _reverse, get as _get } from 'lodash-es'
import type { StockMetrics } from '@/types/stockMetrics'

const uiStore = useUIStore()
const { open: openAuthModal } = useAuthModal()
const route = useRoute()
const userStore = useUserStore()
const { $publicKV } = useNuxtApp()

const symbol = computed(() => {
	return route.params.symbol as string
})

const bigSymbol = computed(() => {
	return symbol.value?.toUpperCase()
})

const showNotice = ref(true)

const metrics = ref<StockMetrics[]>([])

const getMetrics = async (symbol: string, days: number = 60) => {
	// 只有熱門股票的資料可以不做認證就可以看
	if (!HOT_COMPANIES.includes(_toUpper(symbol)) && !userStore.isLogin) return
	const response = await $publicKV.getStatementBySymbol(symbol, days)
	metrics.value = _reverse(_get(response, 'data', []))
}

onMounted(() => {
	getMetrics(symbol.value)
})

// 彈窗登入後頁面不會重新掛載，補抓非熱門股票的資料
watch(
	() => userStore.isLogin,
	(isLogin) => {
		if (isLogin) getMetrics(symbol.value)
	},
)

const { t } = useI18n()

usePageSeo(computed(() => ({
	title: t('company_metrics.meta_title', { symbol: bigSymbol.value }),
	description: t('company_metrics.meta_description', { symbol: bigSymbol.value }),
})))
</script>
