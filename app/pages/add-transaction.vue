<template>
	<div class="w-full mx-auto pt-3 pb-10 px-3 space-y-4">

		<!-- 表單卡片 -->
		<van-form ref="formRef" @submit="onSubmit">
			<van-cell-group inset class="rounded-2xl! overflow-hidden shadow-card-primary!">

				<van-field v-model="form.stockSymbol" name="stockSymbol" :label="$t('transaction.stock_id')"
					:placeholder="$t('transaction.enter_stock_id')"
					:rules="[{ required: true, message: $t('transaction.enter_stock_id') }]" />

				<van-field name="tradeType" :label="$t('transaction.transaction_type')">
					<template #input>
						<van-radio-group v-model="form.tradeType" direction="horizontal">
							<van-radio name="buy" checked-color="var(--color-primary)">
								<span class="text-emerald-600 font-semibold text-sm">{{ $t('transaction.buy') }}</span>
							</van-radio>
							<van-radio name="sell" checked-color="var(--color-primary)">
								<span class="text-red-500 font-semibold text-sm">{{ $t('transaction.sell') }}</span>
							</van-radio>
						</van-radio-group>
					</template>
				</van-field>

				<van-field v-model="form.quantity" type="digit" name="quantity" :label="$t('transaction.quantity')"
					:placeholder="$t('transaction.enter_quantity')" :rules="[
						{ required: true, message: $t('transaction.enter_quantity') },
						{ pattern: /^[1-9]\d*$/, message: $t('transaction.enter_positive_integer') },
					]" />

				<van-field v-model="form.price" type="number" name="price" :label="$t('transaction.price')"
					:placeholder="$t('transaction.enter_price')" :rules="[
						{ required: true, message: $t('transaction.enter_price') },
						{ pattern: /^\d+(\.\d{1,2})?$/, message: $t('transaction.enter_correct_price_format') },
					]" />

				<van-field v-model="form.tradeDate" is-link readonly name="tradeDate"
					:label="$t('transaction.transaction_date')" :placeholder="$t('transaction.select_transaction_date')"
					:rules="[{ required: true, message: $t('transaction.select_transaction_date') }]"
					@click="showDatePicker = true" />
			</van-cell-group>

			<van-popup v-model:show="showDatePicker" position="bottom" round>
				<van-date-picker v-model="currentDate" :title="$t('transaction.select_transaction_date')"
					:min-date="minDate" :max-date="maxDate" @confirm="onConfirmDate" @cancel="showDatePicker = false" />
			</van-popup>

			<!-- 提交按鈕 -->
			<div class="px-1 pt-5">
				<van-button round block native-type="submit" color="var(--color-primary)">
					<span class="font-semibold tracking-wide">{{ $t('transaction.record') }}</span>
				</van-button>
			</div>
		</van-form>

		<!-- 提示訊息 -->
		<van-notice-bar wrapable :scrollable="false" type="warning" class="rounded-xl!">
			{{ $t('transaction.img_upload_tips') }}
		</van-notice-bar>

		<!-- 上傳截圖區塊 -->
		<div class="relative flex flex-col items-center justify-center gap-2 w-full h-44 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 cursor-pointer active:scale-[0.98] transition-all duration-150 hover:border-primary/70 hover:bg-primary/10"
			@click="navigateTo(localePath('/trade-screenshot'))">
			<!-- 上傳 icon -->
			<div class="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<path d="M10 13V4M10 4L6.5 7.5M10 4l3.5 3.5" stroke="var(--color-primary)" stroke-width="1.6"
						stroke-linecap="round" stroke-linejoin="round" />
					<path d="M3 14v1.5A1.5 1.5 0 004.5 17h11a1.5 1.5 0 001.5-1.5V14" stroke="var(--color-primary)" stroke-width="1.6"
						stroke-linecap="round" />
				</svg>
			</div>
			<span class="text-sm font-semibold text-primary">{{ $t('transaction.upload_screenshot') }}</span>
			<span class="text-xs text-primary/50">tap to upload</span>
		</div>

	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance } from 'vant'
import emitter from '~/utils/emitter'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import type { TradeParams } from '@/types/trade'

const { t } = useI18n()
const localePath = useLocalePath()
const userStore = useUserStore()
const { $bffApi } = useNuxtApp()

const getInitialFormState = (): TradeParams => ({
	stockSymbol: '',
	tradeType: 'buy',
	quantity: '',
	price: '',
	tradeDate: new Date().toISOString().split('T')[0] as string,
})

const formRef = ref<FormInstance>()
const form = ref<TradeParams>(getInitialFormState())

const showDatePicker = ref(false)
const minDate = new Date(new Date().setFullYear(new Date().getFullYear() - 5))
const maxDate = new Date()
const currentDate = ref(form.value.tradeDate.split('-'))

const onConfirmDate = ({ selectedValues }: { selectedValues: string[] }) => {
	form.value.tradeDate = selectedValues.join('-')
	showDatePicker.value = false
}

const onSubmit = async () => {
	if (!formRef.value) return
	if (!userStore.isLogin) {
		showToast(t('transaction.please_login_first'))
		return
	}

	try {
		await formRef.value?.validate()
		const payload = {
			...form.value,
			quantity: form.value.quantity,
			price: form.value.price,
		}
		await $bffApi.createTrade(payload)
		showToast({
			type: 'success',
			message: t('transaction.transaction_saved'),
		})

		// 刷新交易紀錄和投資組合頁面
		emitter.emit('refresh', 'records')
		emitter.emit('refresh', 'portfolio')
		form.value = getInitialFormState()
		formRef.value?.resetValidation()
	} catch (error) {
		console.error(error)
		showFailToast(t('transaction.check_input_data'))
	}
}
</script>
