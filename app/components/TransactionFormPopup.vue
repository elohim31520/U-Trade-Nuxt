<template>
	<van-popup
		v-model:show="show"
		position="bottom"
		round
		safe-area-inset-bottom
		class="inset-x-0! mx-auto max-h-[92vh] max-w-480px bg-surface-card! [--van-popup-round-radius:1.75rem]"
	>
		<div class="relative px-5 pb-6 pt-3">
			<!-- 頂部柔光，讓白底不是一片平面 -->
			<span
				aria-hidden="true"
				class="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-accent-2/12 to-transparent"
			/>

			<span aria-hidden="true" class="relative mx-auto mb-4 block h-1 w-9 rounded-full bg-gray-200" />

			<header class="relative flex items-center gap-3.5">
				<!-- 圖磚：沒有 logo 的標的退回代號縮寫；logo 載入完成才淡入 -->
				<span
					class="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-[22%] bg-linear-to-br from-accent to-accent-2 shadow-[0_1px_2px_rgb(16_24_40/0.06),0_4px_10px_-3px_rgb(16_24_40/0.14)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.35)]"
				>
					<span class="text-xs font-bold tracking-wide text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.25)]">
						{{ initials }}
					</span>
					<img
						v-if="showLogo"
						:key="symbol"
						:src="logoUrl(symbol)"
						:alt="`${symbol} logo`"
						draggable="false"
						class="absolute inset-0 size-full bg-white object-cover transition-opacity duration-300"
						:class="logoLoaded[symbol] ? 'opacity-100' : 'opacity-0'"
						@load="logoLoaded[symbol] = true"
						@error="logoFailed[symbol] = true"
					/>
				</span>
				<div class="min-w-0 flex-1">
					<h2 class="truncate text-xl font-semibold leading-tight">
						{{ isTrade ? $t('transaction_form_popup.update_trade') : $t('transaction_form_popup.update_holding') }}
					</h2>
					<p class="mt-1.5 flex items-center gap-1.5 text-[13px] leading-none text-gray-400">
						<span
							class="shrink-0 rounded-md bg-gray-200/70 px-1.5 py-1 text-[11px] font-semibold tracking-wider text-gray-500"
						>
							{{ symbol }}
						</span>
						<span v-if="companyName" class="truncate">{{ companyName }}</span>
					</p>
				</div>
				<button
					type="button"
					:aria-label="$t('common.close')"
					class="grid size-8 shrink-0 place-items-center self-start rounded-full bg-gray-100 transition active:scale-90"
					@click="show = false"
				>
					<SvgIcon name="icon_close" size="12px" class="text-gray-500" />
				</button>
			</header>

			<form novalidate class="relative mt-6" @submit.prevent="onSubmit">
				<!-- 買入／賣出：只有編輯交易紀錄才有；持股是直接覆寫數量與均價，沒有買賣方向 -->
				<div
					v-if="isTrade"
					role="radiogroup"
					:aria-label="$t('transaction.transaction_type')"
					class="relative mb-4 grid grid-cols-2 rounded-xl border border-gray-100 bg-gray-50 p-1"
				>
					<span
						aria-hidden="true"
						class="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg border shadow-[0_1px_2px_rgb(16_24_40/0.06)] transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
						:class="
							isBuy
								? 'translate-x-0 border-emerald-500/30 bg-emerald-50'
								: 'translate-x-full border-red-500/30 bg-red-50'
						"
					/>

					<!-- 文字樣式放在內層 span：Vant 全域 reset 的 button { color/font: inherit } 會蓋掉 button 本身的 text-* -->
					<button
						v-for="side in sides"
						:key="side.value"
						type="button"
						role="radio"
						:aria-checked="form.tradeType === side.value"
						class="relative z-1 rounded-lg py-2.5 [-webkit-tap-highlight-color:transparent]"
						@click="form.tradeType = side.value"
					>
						<span
							class="inline-flex items-center justify-center gap-1.5 text-sm font-medium tracking-wide transition-colors duration-300 motion-reduce:transition-none"
							:class="form.tradeType === side.value ? side.activeClass : 'text-gray-400'"
						>
							<SvgIcon name="icon_triangle" size="9px" :class="{ 'rotate-180': side.value !== 'buy' }" />
							{{ side.label }}
						</span>
					</button>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="holding-quantity" class="block pl-1 text-xs tracking-widest text-gray-400">
							{{ $t('transaction.quantity') }}
						</label>
						<div class="mt-2" :class="[fieldBox, boxTone('quantity')]">
							<input
								id="holding-quantity"
								:value="form.quantity"
								type="text"
								inputmode="numeric"
								autocomplete="off"
								enterkeyhint="next"
								placeholder="0"
								:aria-invalid="!!errorOf('quantity')"
								:class="fieldInput"
								@input="onFieldInput('quantity', cleanQuantity, $event)"
								@blur="touched.quantity = true"
							/>
						</div>
						<p v-if="errorOf('quantity')" class="mt-1.5 pl-1 text-xs leading-snug text-red-500">
							{{ errorOf('quantity') }}
						</p>
					</div>

					<div>
						<label for="holding-price" class="block pl-1 text-xs tracking-widest text-gray-400">
							{{ isTrade ? $t('transaction.price') : $t('portfolio.average_price') }}
						</label>
						<div class="mt-2" :class="[fieldBox, boxTone('price')]">
							<span class="mr-1 text-base font-medium text-gray-400" aria-hidden="true">$</span>
							<input
								id="holding-price"
								:value="form.price"
								type="text"
								inputmode="decimal"
								autocomplete="off"
								enterkeyhint="done"
								placeholder="0.00"
								:aria-invalid="!!errorOf('price')"
								:class="fieldInput"
								@input="onFieldInput('price', cleanPrice, $event)"
								@blur="onPriceBlur"
							/>
						</div>
						<p v-if="errorOf('price')" class="mt-1.5 pl-1 text-xs leading-snug text-red-500">
							{{ errorOf('price') }}
						</p>
					</div>
				</div>

				<!-- 交易日期：點開底部日期選擇器；持股沒有日期，不顯示 -->
				<div v-if="isTrade" class="mt-4">
					<span id="holding-label-date" class="block pl-1 text-xs tracking-widest text-gray-400">
						{{ $t('transaction.transaction_date') }}
					</span>
					<button
						type="button"
						aria-labelledby="holding-label-date"
						class="mt-2 w-full gap-3 text-left outline-hidden"
						:class="[fieldBox, boxTone('tradeDate')]"
						@click="openDatePicker"
					>
						<SvgIcon name="icon_calendar" size="18px" class="shrink-0 text-gray-400" />
						<span class="flex-1 text-base font-semibold tabular-nums">{{ form.tradeDate }}</span>
						<SvgIcon name="icon_chevron_right" size="16px" class="shrink-0 text-gray-300" />
					</button>
				</div>

				<!-- 總值：數量 × 價格，即時計算 -->
				<div class="mt-5 flex items-baseline justify-between border-t border-gray-100 pt-4">
					<span class="text-xs tracking-widest text-gray-400">{{ $t('portfolio.total_value') }}</span>
					<span
						class="text-[26px] font-semibold leading-none tabular-nums transition-colors duration-300"
						:class="total > 0 ? 'text-gray-900' : 'text-gray-300'"
					>
						<span class="mr-1 text-base font-medium text-gray-400">$</span>
						{{ formatMoney(total) }}
					</span>
				</div>

				<!-- 文字樣式同樣放在內層 span，避免被 Vant 的 button reset 蓋掉 -->
				<button
					type="submit"
					:disabled="submitting"
					class="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-accent to-accent-2 py-3.5 shadow-nav-home transition active:scale-[0.985] disabled:opacity-60"
				>
					<SvgIcon v-if="submitting" name="icon_spinner" size="16px" class="animate-spin text-on-primary" />
					<span class="text-[15px] font-semibold tracking-wide text-on-primary">{{ $t('portfolio.update') }}</span>
				</button>
			</form>
		</div>
	</van-popup>

	<van-popup v-if="isTrade" v-model:show="showDatePicker" position="bottom" round>
		<van-date-picker
			v-model="currentDate"
			:title="$t('transaction.select_transaction_date')"
			:min-date="minDate"
			:max-date="maxDate"
			@confirm="onConfirmDate"
			@cancel="showDatePicker = false"
		/>
	</van-popup>
</template>

<script setup lang="ts">
	import { ref, reactive, computed, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { formatMoney } from '~/utils/util'
	import type { PortfolioItem } from '@/types/portfolio'
	import type { TradeParams, TradeWithCompany } from '@/types/trade'

	type FieldKey = 'quantity' | 'price' | 'tradeDate'

	const { t } = useI18n()
	const { $bffApi } = useNuxtApp()

	const props = defineProps<{
		modelValue: boolean
		/** holding：覆寫持股的數量與均價（Portfolio 頁）；trade：編輯單筆交易紀錄（Records 頁）。由呼叫端明確指定 */
		mode: 'holding' | 'trade'
		item: PortfolioItem | TradeWithCompany | null
	}>()

	const emit = defineEmits(['update:modelValue', 'submitSuccess'])

	const show = computed({
		get: () => props.modelValue,
		set: (val) => emit('update:modelValue', val),
	})

	const getTodayStr = () => new Date().toISOString().split('T')[0] as string

	const form = ref<TradeParams>({
		stockSymbol: '',
		tradeType: 'buy',
		quantity: '',
		price: '',
		tradeDate: getTodayStr(),
	})
	const touched = reactive<Record<FieldKey, boolean>>({ quantity: false, price: false, tradeDate: false })
	const submitting = ref(false)

	// 交易紀錄才有買賣方向與日期；持股只是覆寫數量與均價，畫面、驗證、送出都不帶這兩個欄位
	const isTrade = computed(() => props.mode === 'trade')
	const isBuy = computed(() => form.value.tradeType === 'buy')
	const sides = computed(() => [
		{ value: 'buy' as const, label: t('transaction.buy'), activeClass: 'text-emerald-600' },
		{ value: 'sell' as const, label: t('transaction.sell'), activeClass: 'text-red-500' },
	])

	// 數量只收整數，但 API 的 numeric 欄位會回 "1.00" 這種字串；原樣帶入的話，刪掉一個 0 變 "1.0"，
	// 數字過濾會把小數點拿掉、悄悄變成 "10"。所以帶入前先去掉尾端多餘的 0 與小數點
	const tidyQuantity = (value: string | number) =>
		String(value)
			.replace(/(\.\d*?)0+$/, '$1')
			.replace(/\.$/, '')

	// 每次打開都從目前的紀錄／持股重新帶入，不留上次沒送出的內容
	const fill = (item: PortfolioItem | TradeWithCompany) => {
		form.value.stockSymbol = item.stockSymbol
		if (isTrade.value) {
			const trade = item as TradeWithCompany
			form.value.tradeType = trade.type
			form.value.quantity = tidyQuantity(trade.quantity)
			form.value.price = trade.price
			// 將 ISO 日期格式轉換為 YYYY-MM-DD 格式
			form.value.tradeDate = trade.date.split('T')[0] as string
		} else {
			const holding = item as PortfolioItem
			form.value.quantity = holding.quantity ? tidyQuantity(holding.quantity) : ''
			form.value.price = holding.averagePrice ? String(holding.averagePrice) : ''
		}
		Object.assign(touched, { quantity: false, price: false, tradeDate: false })
	}

	watch(
		() => [props.modelValue, props.item] as const,
		([open, item]) => {
			if (open && item) fill(item)
		},
		{ immediate: true }
	)

	// ---- 標題區：logo 圖磚與代號、公司名 ----
	const symbol = computed(() => props.item?.stockSymbol ?? '')
	const companyName = computed(() => props.item?.company?.name ?? '')
	const initials = computed(() => (props.item?.company?.symbol || symbol.value).slice(0, 3).toUpperCase())

	const logoFailed = reactive<Record<string, boolean>>({})
	const logoLoaded = reactive<Record<string, boolean>>({})
	const logoUrl = (value: string) => `/logo/${value.toLowerCase()}.svg`
	const showLogo = computed(() => !!symbol.value && !logoFailed[symbol.value])

	// ---- 輸入過濾：在輸入當下就擋掉不合法字元，DOM 的值一併改掉，畫面與資料才一致 ----
	const cleanQuantity = (value: string) => value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 12)
	const cleanPrice = (value: string) => {
		const [int = '', ...rest] = value.replace(/[^\d.]/g, '').split('.')
		const head = int.replace(/^0+(?=\d)/, '').slice(0, 12)
		return rest.length ? `${head || '0'}.${rest.join('').slice(0, 2)}` : head
	}

	const onFieldInput = (key: 'quantity' | 'price', clean: (value: string) => string, event: Event) => {
		const el = event.target as HTMLInputElement
		const next = clean(el.value)
		el.value = next
		form.value[key] = next
	}

	// 「12.」這種停在小數點的輸入，離開欄位或送出時把點拿掉
	const trimTrailingDot = () => {
		if (form.value.price.endsWith('.')) form.value.price = form.value.price.slice(0, -1)
	}

	const onPriceBlur = () => {
		touched.price = true
		trimTrailingDot()
	}

	// ---- 驗證：規則與原本的 van-field rules 相同；離開欄位或送出時才顯示錯誤 ----
	const errors = computed<Record<FieldKey, string>>(() => {
		const { quantity, price, tradeDate } = form.value
		return {
			quantity: !quantity
				? t('transaction.enter_quantity')
				: /^[1-9]\d*$/.test(quantity)
					? ''
					: t('transaction.enter_positive_integer'),
			price: !price
				? t('transaction.enter_price')
				: /^\d+(\.\d{1,2})?$/.test(price)
					? ''
					: t('transaction.enter_correct_price_format'),
			tradeDate: tradeDate ? '' : t('transaction.select_transaction_date'),
		}
	})

	const errorOf = (key: FieldKey) => (touched[key] ? errors.value[key] : '')

	// 欄位外框：聚焦時換成卡片底色 + 主色描邊與外圈光暈；錯誤時描邊與光暈換紅色
	const fieldBox =
		'flex items-center rounded-2xl border bg-gray-50 px-3.5 py-3 transition duration-200 focus-within:bg-surface-card focus-within:ring-4 focus-visible:bg-surface-card focus-visible:ring-4 motion-reduce:transition-none'
	const boxTone = (key: FieldKey) =>
		errorOf(key)
			? 'border-red-500/60 focus-within:border-red-500 focus-within:ring-red-500/14 focus-visible:border-red-500 focus-visible:ring-red-500/14'
			: 'border-gray-100 focus-within:border-accent-2 focus-within:ring-accent-2/16 focus-visible:border-accent-2 focus-visible:ring-accent-2/16'
	// 字體樣式要加 !：Vant 全域的 input { font: inherit } 沒包在 layer 裡，會蓋掉一般的 text-* / font-* / tabular-nums
	const fieldInput =
		'w-full min-w-0 border-0 bg-transparent p-0 text-lg! leading-snug! font-semibold! tabular-nums! outline-none placeholder:font-normal placeholder:text-gray-300'

	// ---- 總值 ----
	const total = computed(() => {
		const amount = Number(form.value.quantity) * Number(form.value.price)
		return Number.isFinite(amount) ? amount : 0
	})

	// ---- 日期選擇器 ----
	const showDatePicker = ref(false)
	const currentDate = ref<string[]>([])
	const maxDate = new Date()
	// 預設只能選五年內；編輯更早的紀錄時把下限放寬到那筆的日期，不然選擇器會悄悄把日期夾到下限
	const minDate = computed(() => {
		const limit = new Date()
		limit.setFullYear(limit.getFullYear() - 5)
		const recorded = new Date(form.value.tradeDate)
		return !Number.isNaN(recorded.getTime()) && recorded < limit ? recorded : limit
	})

	const openDatePicker = () => {
		touched.tradeDate = true
		currentDate.value = form.value.tradeDate.split('-')
		showDatePicker.value = true
	}

	const onConfirmDate = ({ selectedValues }: { selectedValues: string[] }) => {
		form.value.tradeDate = selectedValues.join('-')
		showDatePicker.value = false
	}

	// ---- 送出 ----
	// 只驗證畫面上看得到的欄位；持股沒有日期欄，不該被看不見的欄位擋住
	const activeFields = computed<FieldKey[]>(() =>
		isTrade.value ? ['quantity', 'price', 'tradeDate'] : ['quantity', 'price']
	)

	const onSubmit = async () => {
		if (submitting.value) return

		trimTrailingDot()
		activeFields.value.forEach((key) => (touched[key] = true))
		const firstInvalid = activeFields.value.find((key) => errors.value[key])
		if (firstInvalid) {
			// 日期是按鈕、不是輸入框，沒有 input 可以聚焦
			if (firstInvalid !== 'tradeDate') document.getElementById(`holding-${firstInvalid}`)?.focus()
			showFailToast(t('transaction.check_input_data'))
			return
		}

		submitting.value = true
		try {
			const { stockSymbol, quantity, price, tradeType, tradeDate } = form.value
			if (isTrade.value) {
				const trade = props.item as TradeWithCompany
				if (!trade?.id) throw new Error('Missing transaction id')
				await $bffApi.updateTrade(trade.id, { stockSymbol, tradeType, quantity, price, tradeDate })
			} else {
				// 持股是直接覆寫數量與均價，沒有買賣方向與日期；NewPortfolio 的欄位是 number，驗證通過後再轉
				await $bffApi.updatePortfolio({ stockSymbol, quantity: Number(quantity), averagePrice: Number(price) })
			}
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
		} finally {
			submitting.value = false
		}
	}
</script>
