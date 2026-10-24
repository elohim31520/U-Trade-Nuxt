<template>
	<van-popup v-model:show="show" position="bottom" round>
		<div class="p-2">
			<div class="text-base font-bold mb-4 text-#656565 text-center">
				{{ $t('transaction_form_popup.update_holding') }}
			</div>
			<van-form ref="formRef" @submit="onSubmit">
				<van-cell-group class="rounded-xl! overflow-hidden">
					<van-field v-model="form.stockSymbol" name="stockSymbol" :label="$t('transaction.stock_id')"
						:placeholder="$t('transaction.enter_stock_id')"
						:rules="[{ required: true, message: $t('transaction.enter_stock_id') }]" readonly />

					<van-field name="tradeType" :label="$t('transaction.transaction_type')">
						<template #input>
							<van-radio-group v-model="form.tradeType" direction="horizontal">
								<van-radio name="buy" checked-color="var(--color-primary)">
									<span class="text-green-600">{{ $t('transaction.buy') }}</span>
								</van-radio>
								<van-radio name="sell" checked-color="var(--color-primary)">
									<span class="text-red-600">{{ $t('transaction.sell') }}</span>
								</van-radio>
							</van-radio-group>
						</template>
					</van-field>

					<van-field v-model="form.quantity" type="digit" name="quantity" :label="$t('transaction.quantity')"
						:placeholder="$t('transaction.enter_quantity')" :rules="[
							{ required: true, message: $t('transaction.enter_quantity') },
							{
								pattern: /^[1-9]\d*$/,
								message: $t('transaction.enter_positive_integer'),
							},
						]" />

					<van-field v-model="form.price" type="number" name="price" :label="$t('transaction.price')"
						:placeholder="$t('transaction.enter_price')" :rules="[
							{ required: true, message: $t('transaction.enter_price') },
							{
								pattern: /^\d+(\.\d{1,2})?$/,
								message: $t('transaction.enter_correct_price_format'),
							},
						]" />

					<van-field v-model="form.tradeDate" type="date" name="tradeDate"
						:label="$t('transaction.transaction_date')"
						:placeholder="$t('transaction.select_transaction_date')" :rules="[
							{
								required: true,
								message: $t('transaction.select_transaction_date'),
							},
						]" />
				</van-cell-group>
				<div class="px-2 py-5">
					<van-button round block type="primary" color="var(--color-primary)" native-type="submit">
						{{ $t('transaction.record') }}
					</van-button>
				</div>
			</van-form>
		</div>
	</van-popup>
</template>

<script setup lang="ts">
import type { TradeParams } from '~/types/trade'

import { ref, watch, computed } from 'vue'
import type { FormInstance } from 'vant'
import type { PortfolioItem } from '@/types/portfolio'
import type { TradeWithCompany } from '@/types/trade'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
	modelValue: boolean
	item: PortfolioItem | TradeWithCompany | null
	apiFunction: (payload: TradeParams) => Promise<any>
}>()

const emit = defineEmits(['update:modelValue', 'submitSuccess'])

const show = computed({
	get: () => props.modelValue,
	set: (val) => emit('update:modelValue', val),
})

const getTodayStr = () => new Date().toISOString().split('T')[0] as string

const formRef = ref<FormInstance>()
const form = ref<TradeParams>({
	stockSymbol: '',
	tradeType: 'buy',
	quantity: '',
	price: '',
	tradeDate: getTodayStr(),
})

watch(
	() => props.item,
	(newItem) => {
		if (newItem) {
			form.value.stockSymbol = newItem.stockSymbol

			// 如果是交易记录类型 (TradeWithCompany)，填充现有数据
			if ('type' in newItem && 'date' in newItem) {
				const tradeItem = newItem as TradeWithCompany
				form.value.tradeType = tradeItem.type
				form.value.quantity = tradeItem.quantity
				form.value.price = tradeItem.price
				// 将 ISO 日期格式转换为 YYYY-MM-DD 格式
				form.value.tradeDate = tradeItem.date.split('T')[0] as string
			} else {
				// 如果是投资组合类型 (PortfolioItem)，填充现有数据
				const portfolioItem = newItem as PortfolioItem
				form.value.tradeType = 'buy'
				form.value.quantity = portfolioItem.quantity ? String(portfolioItem.quantity) : ''
				form.value.price = portfolioItem.averagePrice ? String(portfolioItem.averagePrice) : ''
				form.value.tradeDate = getTodayStr()
			}
		}
	}
)

const onSubmit = async () => {
	if (!formRef.value) return

	try {
		await formRef.value?.validate()
		const payload = {
			stockSymbol: form.value.stockSymbol,
			tradeType: form.value.tradeType,
			quantity: String(form.value.quantity),
			price: String(form.value.price),
			tradeDate: form.value.tradeDate,
		}
		await props.apiFunction(payload)
		showToast({
			type: 'success',
			message: t('transaction.transaction_saved'),
		})

		emit('submitSuccess')
		show.value = false
	} catch (error) {
		console.error(error)
		showToast({
			type: 'fail',
			message: t('transaction.check_input_data'),
		})
	}
}
</script>
