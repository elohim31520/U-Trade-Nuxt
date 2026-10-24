<template>
	<div class="bg-gray-50">
		<div class="mx-2 bg-surface-card p-2 rounded-2xl shadow-lg">
			<h1 class="text-[24px] font-bold mb-2 text-gray-800">{{ $t('records.transaction_records') }}</h1>
			<Waterfall ref="waterfallRef" dataPath="data.data" :apiFunction="fetchTrades">
				<template #default="{ list }">
					<van-swipe-cell v-for="item in (list as TradeWithCompany[])" :key="item.id" :right-width="65"
						:left-width="65" @close="(details) => onClose(details, item)">
						<div class="mb-4 rounded-lg p-4 transition-shadow duration-300 hover:shadow-md">
							<div class="flex justify-between items-start mb-3">
								<div>
									<span class="text-[14px] text-gray-500">{{ $t('records.stock_id') }}</span>
									<p class="font-semibold text-[18px] text-gray-900">{{ item.stockSymbol }}</p>
								</div>
								<span :class="[
									'px-3 py-1 rounded-full text-[12px] font-semibold tracking-wide',
									item.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
								]">
									{{ item.type === 'buy' ? $t('records.buy') : $t('records.sell') }}
								</span>
							</div>

							<div class="grid grid-cols-2 gap-1 text-[14px] mb-3">
								<div>
									<span class="text-gray-500">{{ $t('records.quantity') }}</span>
									<p class="text-gray-800">{{ item.quantity }}</p>
								</div>
								<div>
									<span class="text-gray-500">{{ $t('records.price') }}</span>
									<p class="text-gray-800">{{ item.price }}</p>
								</div>
							</div>

							<div class="text-right text-[12px] text-gray-400">
								{{ formatDate(item.date) }}
							</div>
						</div>
						<template #left>
							<div class="h-full flex items-center justify-center bg-primary text-on-primary w-65px">
								{{ $t('records.update') }}
							</div>
						</template>
						<template #right>
							<div class="h-full flex items-center justify-center bg-red-500 text-white w-65px">
								{{ $t('records.delete') }}
							</div>
						</template>
					</van-swipe-cell>
				</template>
			</Waterfall>
		</div>

		<TransactionFormPopup v-model="showUpdatePopup" :item="selectedItemForUpdate" @submit-success="onUpdateSuccess"
			:api-function="updateTransactionApi" />
	</div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { showConfirmDialog } from 'vant'
import { formatDate } from '@/utils/date'
import Waterfall from '@/components/Waterfall/index.vue'
import TransactionFormPopup from '@/components/TransactionFormPopup.vue'
import { useI18n } from 'vue-i18n'
import type { TradeWithCompany } from '@/types/trade'

const { t } = useI18n()
const { $bffApi } = useNuxtApp()

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

const onClose = (details: any, item: TradeWithCompany) => {
	const { position, instance } = details
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
			})
				.then(async () => {
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

const updateTransactionApi = async (payload: any) => {
	const item = selectedItemForUpdate.value
	if (!item?.id) {
		throw new Error('Missing transaction id')
	}
	return $bffApi.updateTrade(item.id, {
		stockSymbol: payload.stockSymbol,
		tradeType: payload.tradeType,
		quantity: String(payload.quantity),
		price: String(payload.price),
		tradeDate: payload.tradeDate,
	})
}
</script>

<style scoped>
.van-swipe-cell {
	border-bottom: 1px solid #f5f5f5;
	padding-top: 10px;
}
</style>
