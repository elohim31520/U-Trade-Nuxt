<template>
	<div class="px-4 pb-8 pt-5">
		<header class="mb-4 px-1">
			<h1 class="text-sm font-bold uppercase tracking-widest">{{ $t('sidemenu.add_record') }}</h1>
		</header>

		<form novalidate @submit.prevent="onSubmit">
			<section class="row-in rounded-3xl border border-gray-100 bg-surface-card p-5 shadow-card-primary">
				<!-- 買入／賣出：滑動的底板跟著 active 項目走，顏色依買／賣換 -->
				<div
					role="radiogroup"
					:aria-label="$t('transaction.transaction_type')"
					class="relative grid grid-cols-2 rounded-xl border border-gray-100 bg-gray-50 p-1"
				>
					<span
						aria-hidden="true"
						class="seg-thumb absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg border"
						:class="
							isBuy
								? 'translate-x-0 border-emerald-500/30 bg-emerald-50'
								: 'translate-x-full border-red-500/30 bg-red-50'
						"
					/>

					<!-- 文字樣式放在內層 span：Vant 全域 reset 的 button { color/font: inherit } 沒包在 layer 裡，會蓋掉 button 本身的 text-* -->
					<button
						v-for="side in sides"
						:key="side.value"
						type="button"
						role="radio"
						:aria-checked="form.tradeType === side.value"
						class="seg-tab relative z-1 rounded-lg py-2.5"
						@click="form.tradeType = side.value"
					>
						<span
							class="seg-label inline-flex items-center justify-center gap-1.5 text-sm font-medium tracking-wide"
							:class="form.tradeType === side.value ? side.activeClass : 'text-gray-400'"
						>
							<svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
								<path :d="side.value === 'buy' ? 'M5 1.5 9 8.5H1z' : 'M5 8.5 1 1.5h8z'" />
							</svg>
							{{ side.label }}
						</span>
					</button>
				</div>

				<!-- 股票代號：左側圖磚即時預覽 logo（沒有 logo 退回代號縮寫） -->
				<div class="mt-5">
					<label for="field-stockSymbol" class="field-label">{{ $t('transaction.stock_id') }}</label>
					<div class="field-box mt-2 gap-3" :class="boxClass('stockSymbol')">
						<span
							class="logo-tile relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[22%]"
							:class="form.stockSymbol ? 'bg-linear-to-br from-accent to-accent-2' : 'bg-gray-100'"
						>
							<span
								v-if="form.stockSymbol"
								class="text-[11px] font-bold tracking-wide text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.25)]"
							>
								{{ form.stockSymbol.slice(0, 3) }}
							</span>
							<svg
								v-else
								class="text-gray-300"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M3 17 9 11l4 4 8-8" />
								<path d="M15 7h6v6" />
							</svg>
							<img
								v-if="showLogo"
								:key="logoSymbol"
								:src="logoUrl(logoSymbol)"
								:alt="`${logoSymbol} logo`"
								draggable="false"
								class="absolute inset-0 size-full bg-white object-cover transition-opacity duration-300"
								:class="logoLoaded[logoSymbol] ? 'opacity-100' : 'opacity-0'"
								@load="logoLoaded[logoSymbol] = true"
								@error="logoFailed[logoSymbol] = true"
							/>
						</span>
						<input
							id="field-stockSymbol"
							:value="form.stockSymbol"
							type="text"
							maxlength="12"
							autocomplete="off"
							autocapitalize="characters"
							spellcheck="false"
							enterkeyhint="next"
							:placeholder="$t('transaction.enter_stock_id')"
							class="field-input uppercase tracking-wider placeholder:text-[15px] placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400"
							@input="onFieldInput('stockSymbol', cleanSymbol, $event)"
							@blur="touched.stockSymbol = true"
						/>
					</div>
					<p v-if="errorOf('stockSymbol')" class="field-error">{{ errorOf('stockSymbol') }}</p>
				</div>

				<!-- 數量／價格 -->
				<div class="mt-4 grid grid-cols-2 gap-3">
					<div>
						<label for="field-quantity" class="field-label">{{ $t('transaction.quantity') }}</label>
						<div class="field-box mt-2" :class="boxClass('quantity')">
							<input
								id="field-quantity"
								:value="form.quantity"
								type="text"
								inputmode="numeric"
								autocomplete="off"
								enterkeyhint="next"
								placeholder="0"
								class="field-input tabular-nums placeholder:font-normal placeholder:text-gray-300"
								@input="onFieldInput('quantity', digitsOnly, $event)"
								@blur="touched.quantity = true"
							/>
						</div>
						<p v-if="errorOf('quantity')" class="field-error">{{ errorOf('quantity') }}</p>
					</div>

					<div>
						<label for="field-price" class="field-label">{{ $t('transaction.price') }}</label>
						<div class="field-box mt-2" :class="boxClass('price')">
							<span class="mr-1 text-base font-medium text-gray-400" aria-hidden="true">$</span>
							<input
								id="field-price"
								:value="form.price"
								type="text"
								inputmode="decimal"
								autocomplete="off"
								enterkeyhint="done"
								placeholder="0.00"
								class="field-input tabular-nums placeholder:font-normal placeholder:text-gray-300"
								@input="onFieldInput('price', decimalOnly, $event)"
								@blur="touched.price = true"
							/>
						</div>
						<p v-if="errorOf('price')" class="field-error">{{ errorOf('price') }}</p>
					</div>
				</div>

				<!-- 交易日期：點開底部日期選擇器 -->
				<div class="mt-4">
					<span id="label-tradeDate" class="field-label">{{ $t('transaction.transaction_date') }}</span>
					<button
						type="button"
						aria-labelledby="label-tradeDate"
						class="field-box mt-2 w-full gap-3 text-left"
						:class="boxClass('tradeDate')"
						@click="openDatePicker"
					>
						<svg
							class="shrink-0 text-gray-400"
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
							<rect x="3.5" y="5" width="17" height="15.5" rx="3" />
							<path d="M3.5 10h17M8 3v4M16 3v4" />
						</svg>
						<span class="flex-1 text-base font-semibold tabular-nums">{{ form.tradeDate }}</span>
						<svg
							class="shrink-0 text-gray-300"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="m9 6 6 6-6 6" />
						</svg>
					</button>
					<p v-if="errorOf('tradeDate')" class="field-error">{{ errorOf('tradeDate') }}</p>
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
			</section>

			<!-- 文字樣式同樣放在內層 span，避免被 Vant 的 button reset 蓋掉 -->
			<button
				type="submit"
				:disabled="submitting"
				class="row-in mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-accent to-accent-2 py-3.5 shadow-nav-home transition active:scale-[0.985] disabled:opacity-60"
				:style="{ '--i': 1 }"
			>
				<svg
					v-if="submitting"
					class="size-4 animate-spin text-on-primary"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<path d="M12 3a9 9 0 1 0 9 9" />
				</svg>
				<span class="text-[15px] font-semibold tracking-wide text-on-primary">{{ $t('transaction.record') }}</span>
			</button>
		</form>

		<!-- 截圖匯入：說明文字併進卡片，取代原本獨立的橘色提示條 -->
		<NuxtLink
			:to="localePath('/trade-screenshot')"
			class="row-in group mt-6 flex items-center gap-4 rounded-2xl border border-dashed border-accent-2/40 bg-accent-2/5 p-4 outline-hidden transition duration-200 hover:border-accent-2/70 hover:bg-accent-2/10 active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-accent-2"
			:style="{ '--i': 2 }"
		>
			<span class="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-2/15">
				<svg
					class="text-accent-2"
					width="20"
					height="20"
					viewBox="0 0 20 20"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M10 13V4M10 4 6.5 7.5M10 4l3.5 3.5" />
					<path d="M3 14v1.5A1.5 1.5 0 0 0 4.5 17h11a1.5 1.5 0 0 0 1.5-1.5V14" />
				</svg>
			</span>
			<span class="min-w-0 flex-1">
				<span class="flex items-center gap-2">
					<span class="text-sm font-semibold">{{ $t('transaction.upload_screenshot') }}</span>
					<span class="rounded-md bg-accent-2/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-accent-2">
						AI
					</span>
				</span>
				<span class="mt-1.5 block text-xs leading-relaxed text-gray-400">{{ $t('transaction.img_upload_tips') }}</span>
			</span>
			<svg
				class="shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="m9 6 6 6-6 6" />
			</svg>
		</NuxtLink>

		<van-popup v-model:show="showDatePicker" position="bottom" round>
			<van-date-picker
				v-model="currentDate"
				:title="$t('transaction.select_transaction_date')"
				:min-date="minDate"
				:max-date="maxDate"
				@confirm="onConfirmDate"
				@cancel="showDatePicker = false"
			/>
		</van-popup>
	</div>
</template>

<script setup lang="ts">
	import { ref, reactive, computed } from 'vue'
	import { refDebounced } from '@vueuse/core'
	import emitter from '~/utils/emitter'
	import { formatMoney } from '~/utils/util'
	import { useI18n } from 'vue-i18n'
	import { useUserStore } from '@/stores/user'
	import type { TradeParams } from '@/types/trade'

	definePageMeta({
		middleware: 'auth',
	})

	type FieldKey = 'stockSymbol' | 'quantity' | 'price' | 'tradeDate'

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

	const form = ref<TradeParams>(getInitialFormState())
	const submitting = ref(false)

	const isBuy = computed(() => form.value.tradeType === 'buy')
	const sides = computed(() => [
		{ value: 'buy' as const, label: t('transaction.buy'), activeClass: 'text-emerald-600' },
		{ value: 'sell' as const, label: t('transaction.sell'), activeClass: 'text-red-500' },
	])

	// ---- 輸入過濾：在輸入當下就擋掉不合法字元，DOM 的值也一併改掉，畫面與資料才一致 ----
	const cleanSymbol = (value: string) => value.toUpperCase().replace(/\s/g, '')
	const digitsOnly = (value: string) => value.replace(/\D/g, '')
	const decimalOnly = (value: string) => {
		const [int = '', ...rest] = value.replace(/[^\d.]/g, '').split('.')
		return rest.length ? `${int}.${rest.join('')}` : int
	}

	const onFieldInput = (key: 'stockSymbol' | 'quantity' | 'price', clean: (value: string) => string, event: Event) => {
		const el = event.target as HTMLInputElement
		const next = clean(el.value)
		el.value = next
		form.value[key] = next
	}

	// ---- 驗證：規則與原本的 van-field rules 相同；離開欄位或送出時才顯示錯誤 ----
	const validators: Record<FieldKey, (value: string) => string> = {
		stockSymbol: (v) => (v ? '' : t('transaction.enter_stock_id')),
		quantity: (v) => {
			if (!v) return t('transaction.enter_quantity')
			return /^[1-9]\d*$/.test(v) ? '' : t('transaction.enter_positive_integer')
		},
		price: (v) => {
			if (!v) return t('transaction.enter_price')
			return /^\d+(\.\d{1,2})?$/.test(v) ? '' : t('transaction.enter_correct_price_format')
		},
		tradeDate: (v) => (v ? '' : t('transaction.select_transaction_date')),
	}

	const errors = computed<Record<FieldKey, string>>(() => ({
		stockSymbol: validators.stockSymbol(form.value.stockSymbol),
		quantity: validators.quantity(form.value.quantity),
		price: validators.price(form.value.price),
		tradeDate: validators.tradeDate(form.value.tradeDate),
	}))

	const getInitialTouched = (): Record<FieldKey, boolean> => ({
		stockSymbol: false,
		quantity: false,
		price: false,
		tradeDate: false,
	})
	const touched = reactive(getInitialTouched())

	const errorOf = (key: FieldKey) => (touched[key] ? errors.value[key] : '')
	const boxClass = (key: FieldKey) => (errorOf(key) ? 'field-box--error' : '')

	// ---- 總值 ----
	const total = computed(() => {
		const amount = Number(form.value.quantity) * Number(form.value.price)
		return Number.isFinite(amount) ? amount : 0
	})

	// ---- logo 預覽：打字停下來才請求，避免每個字母都打一次 404；載入完成才淡入 ----
	const logoSymbol = refDebounced(
		computed(() => form.value.stockSymbol),
		350
	)
	const logoFailed = reactive<Record<string, boolean>>({})
	const logoLoaded = reactive<Record<string, boolean>>({})
	const logoUrl = (symbol: string) => `/logo/${symbol.toLowerCase()}.svg`
	const showLogo = computed(
		() => !!logoSymbol.value && logoSymbol.value === form.value.stockSymbol && !logoFailed[logoSymbol.value]
	)

	// ---- 日期選擇器 ----
	const showDatePicker = ref(false)
	const minDate = new Date(new Date().setFullYear(new Date().getFullYear() - 5))
	const maxDate = new Date()
	const currentDate = ref(form.value.tradeDate.split('-'))

	const openDatePicker = () => {
		touched.tradeDate = true
		showDatePicker.value = true
	}

	const onConfirmDate = ({ selectedValues }: { selectedValues: string[] }) => {
		form.value.tradeDate = selectedValues.join('-')
		showDatePicker.value = false
	}

	// ---- 送出 ----
	const onSubmit = async () => {
		if (submitting.value) return
		if (!userStore.isLogin) {
			showToast(t('transaction.please_login_first'))
			return
		}

		;(Object.keys(touched) as FieldKey[]).forEach((key) => (touched[key] = true))
		const firstInvalid = (['stockSymbol', 'quantity', 'price'] as const).find((key) => errors.value[key])
		if (firstInvalid || errors.value.tradeDate) {
			if (firstInvalid) document.getElementById(`field-${firstInvalid}`)?.focus()
			showFailToast(t('transaction.check_input_data'))
			return
		}

		submitting.value = true
		try {
			await $bffApi.createTrade({ ...form.value })
			showToast({
				type: 'success',
				message: t('transaction.transaction_saved'),
			})

			// 刷新交易紀錄和投資組合頁面
			emitter.emit('refresh', 'records')
			emitter.emit('refresh', 'portfolio')
			form.value = getInitialFormState()
			currentDate.value = form.value.tradeDate.split('-')
			Object.assign(touched, getInitialTouched())
		} catch (error) {
			console.error(error)
			showFailToast(t('transaction.check_input_data'))
		} finally {
			submitting.value = false
		}
	}
</script>

<style scoped>
	/* 欄位標籤 */
	.field-label {
		display: block;
		padding-left: 0.25rem;
		font-size: 12px;
		letter-spacing: 0.1em;
		color: var(--color-gray-400);
	}

	/* 欄位外框：聚焦時換成卡片底色 + 主色描邊與外圈光暈 */
	.field-box {
		display: flex;
		align-items: center;
		border: 1px solid var(--color-gray-100);
		border-radius: 1rem;
		background: var(--color-gray-50);
		padding: 0.75rem 0.875rem;
		transition:
			border-color 0.2s,
			background-color 0.2s,
			box-shadow 0.2s;
	}

	.field-box:focus-within {
		border-color: var(--color-accent-2);
		background: var(--color-surface-card);
		box-shadow: 0 0 0 4px color-mix(in oklch, var(--color-accent-2) 16%, transparent);
	}

	.field-box--error {
		border-color: color-mix(in oklch, var(--color-red-500) 60%, transparent);
	}

	.field-box--error:focus-within {
		border-color: var(--color-red-500);
		box-shadow: 0 0 0 4px color-mix(in oklch, var(--color-red-500) 14%, transparent);
	}

	/* 字體樣式一律寫在這裡：Vant 全域的 input { font: inherit } 沒包在 layer 裡，會蓋掉 Tailwind 的 text-* / font-* / tabular-nums */
	.field-input {
		width: 100%;
		min-width: 0;
		border: 0;
		outline: none;
		background: transparent;
		padding: 0;
		font-size: 18px;
		font-weight: 600;
		line-height: 1.4;
		font-variant-numeric: tabular-nums;
	}

	.field-error {
		margin-top: 0.375rem;
		padding-left: 0.25rem;
		font-size: 12px;
		line-height: 1.4;
		color: var(--color-red-500);
	}

	/* 買／賣切換底板 */
	.seg-thumb {
		box-shadow: 0 1px 2px rgb(16 24 40 / 0.06);
		transition:
			transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
			background-color 0.3s,
			border-color 0.3s;
	}

	.seg-tab {
		-webkit-tap-highlight-color: transparent;
	}

	.seg-label {
		transition: color 0.3s;
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

	/* 進場：區塊依序淡入上移 */
	.row-in {
		animation: row-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		animation-delay: calc(var(--i, 0) * 70ms);
	}

	@keyframes row-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.seg-thumb,
		.seg-label,
		.field-box {
			transition: none;
		}

		.row-in {
			animation: none;
		}
	}
</style>
