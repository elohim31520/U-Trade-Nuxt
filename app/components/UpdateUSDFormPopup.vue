<template>
	<van-popup
		v-model:show="show"
		position="bottom"
		round
		safe-area-inset-bottom
		class="inset-x-0! mx-auto max-w-480px bg-surface-card! [--van-popup-round-radius:1.75rem]"
	>
		<div class="relative px-5 pb-6 pt-3">
			<!-- 頂部柔光，讓白底不是一片平面 -->
			<span
				aria-hidden="true"
				class="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-accent-2/12 to-transparent"
			/>

			<span aria-hidden="true" class="relative mx-auto mb-4 block h-1 w-9 rounded-full bg-gray-200" />

			<header class="relative">
				<div class="flex items-start justify-between">
					<span
						class="grid size-12 shrink-0 place-items-center rounded-[22%] bg-linear-to-br from-accent to-accent-2 shadow-nav-home inset-shadow-[0_1px_0_rgb(255_255_255/0.35)] inset-ring-1 inset-ring-black/6"
					>
						<SvgIcon name="my_wallet" size="24px" class="text-on-primary" />
					</span>
					<button
						type="button"
						:aria-label="$t('common.close')"
						class="grid size-8 shrink-0 place-items-center rounded-full bg-gray-100 transition active:scale-90"
						@click="show = false"
					>
						<SvgIcon name="icon_close" size="12px" class="text-gray-500" />
					</button>
				</div>
				<h2 class="mt-4 text-xl font-semibold leading-tight">
					{{ isUpdateMode ? $t('update_usd_form_popup.update_title') : $t('update_usd_form_popup.add_title') }}
				</h2>
				<p class="mt-1.5 text-[13px] leading-snug text-gray-400">
					{{ isUpdateMode ? $t('update_usd_form_popup.update_subtitle') : $t('update_usd_form_popup.add_subtitle') }}
				</p>
			</header>

			<form novalidate class="relative mt-6" @submit.prevent="onSubmit">
				<label for="field-balance" class="block pl-1 text-xs tracking-widest text-gray-400">
					{{ $t('update_usd_form_popup.usd_balance_label') }}
				</label>
				<!-- 聚焦時換成卡片底色 + 主色描邊與外圈光暈；錯誤時描邊與光暈換紅色 -->
				<div
					class="mt-2 flex items-center rounded-2xl border bg-gray-50 px-4 py-3.5 transition duration-200 focus-within:bg-surface-card focus-within:ring-4 motion-reduce:transition-none"
					:class="
						errorText
							? 'border-red-500/60 focus-within:border-red-500 focus-within:ring-red-500/14'
							: 'border-gray-100 focus-within:border-accent-2 focus-within:ring-accent-2/16'
					"
				>
					<span class="mr-1.5 text-2xl font-medium text-gray-400" aria-hidden="true">$</span>
					<input
						id="field-balance"
						ref="inputRef"
						:value="balance"
						type="text"
						inputmode="decimal"
						autocomplete="off"
						enterkeyhint="done"
						placeholder="0.00"
						:aria-invalid="!!errorText"
						class="w-full min-w-0 border-0 bg-transparent p-0 text-[34px]! leading-[1.2]! font-semibold! tabular-nums! outline-none placeholder:font-normal placeholder:text-gray-300"
						@input="onInput"
						@blur="onBlur"
					/>
					<span
						class="ml-3 shrink-0 rounded-md bg-gray-200/70 px-1.5 py-1 text-[11px] font-semibold leading-none tracking-wider text-gray-500"
					>
						USD
					</span>
				</div>
				<p v-if="errorText" class="mt-1.5 pl-1 text-xs leading-snug text-red-500">{{ errorText }}</p>

				<!-- 目前餘額與變動量：輸入的是新餘額，不是增減額，所以直接算給使用者看 -->
				<div
					v-if="isUpdateMode"
					class="mt-4 grid grid-cols-2 divide-x divide-gray-100 rounded-2xl border border-gray-100 bg-gray-50 py-3"
				>
					<div class="px-4">
						<p class="text-xs tracking-widest text-gray-400">{{ $t('update_usd_form_popup.current_balance') }}</p>
						<p class="mt-1.5 text-[15px] font-semibold leading-none tabular-nums text-gray-500">
							${{ formatMoney(currentBalance) }}
						</p>
					</div>
					<div class="px-4">
						<p class="text-xs tracking-widest text-gray-400">{{ $t('update_usd_form_popup.change') }}</p>
						<p
							class="mt-1.5 text-[15px] font-semibold leading-none tabular-nums transition-colors duration-300"
							:class="deltaClass"
						>
							{{ deltaText }}
						</p>
					</div>
				</div>

				<!-- 文字樣式放在內層 span：Vant 全域 reset 的 button { color/font: inherit } 會蓋掉 button 本身的 text-* -->
				<button
					type="submit"
					:disabled="submitting"
					class="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-accent to-accent-2 py-3.5 shadow-nav-home transition active:scale-[0.985] disabled:opacity-60"
				>
					<SvgIcon v-if="submitting" name="icon_spinner" size="16px" class="animate-spin text-on-primary" />
					<span class="text-[15px] font-semibold tracking-wide text-on-primary">
						{{ isUpdateMode ? $t('update_usd_form_popup.update_button') : $t('update_usd_form_popup.add_button') }}
					</span>
				</button>
			</form>
		</div>
	</van-popup>
</template>

<script setup lang="ts">
	import { ref, watch, computed } from 'vue'
	import { useBalanceStore } from '@/stores/balance'
	import { formatMoney } from '~/utils/util'
	import { useI18n } from 'vue-i18n'

	const { t } = useI18n()
	const balanceStore = useBalanceStore()
	const { $bffApi } = useNuxtApp()

	const props = defineProps<{
		modelValue: boolean
	}>()

	const emit = defineEmits(['update:modelValue', 'submitSuccess'])

	const show = computed({
		get: () => props.modelValue,
		set: (val) => emit('update:modelValue', val),
	})

	const usdInfo = computed(() => balanceStore.usdInfo)
	const isUpdateMode = computed(() => !!usdInfo.value)
	const currentBalance = computed(() => Number(balanceStore.usdBalance))

	const inputRef = ref<HTMLInputElement>()
	const balance = ref('')
	const touched = ref(false)
	const submitting = ref(false)

	// 每次打開都從目前餘額重來，不留上次沒送出的內容；新增模式留空，讓 placeholder 的 0.00 顯示出來
	watch(
		show,
		(open) => {
			if (!open) return
			balance.value = usdInfo.value ? currentBalance.value.toFixed(2) : ''
			touched.value = false
		},
		{ immediate: true }
	)

	// ---- 輸入過濾：只留數字與一個小數點、小數最多兩位，DOM 的值一併改掉，畫面與資料才一致 ----
	const cleanAmount = (value: string) => {
		const [int = '', ...rest] = value.replace(/[^\d.]/g, '').split('.')
		const head = int.replace(/^0+(?=\d)/, '').slice(0, 12)
		return rest.length ? `${head || '0'}.${rest.join('').slice(0, 2)}` : head
	}

	const onInput = (event: Event) => {
		const el = event.target as HTMLInputElement
		const next = cleanAmount(el.value)
		el.value = next
		balance.value = next
	}

	// 「100.」這種停在小數點的輸入，離開欄位或送出時把點拿掉
	const trimTrailingDot = () => {
		if (balance.value.endsWith('.')) balance.value = balance.value.slice(0, -1)
	}

	const onBlur = () => {
		touched.value = true
		trimTrailingDot()
	}

	// ---- 驗證：規則與原本的 van-field rules 相同；離開欄位或送出時才顯示錯誤 ----
	const error = computed(() => {
		if (!balance.value) return t('update_usd_form_popup.usd_balance_placeholder')
		return /^\d+(\.\d{1,2})?$/.test(balance.value) ? '' : t('update_usd_form_popup.correct_format_required')
	})
	const errorText = computed(() => (touched.value ? error.value : ''))

	// ---- 變動量：新餘額 - 目前餘額，四捨五入到分避免浮點誤差 ----
	// 正規式放寬到允許結尾的小數點，打「100.」的當下變動量不會閃成 —
	const delta = computed(() => {
		if (!isUpdateMode.value || !/^\d+\.?\d{0,2}$/.test(balance.value)) return null
		return Math.round((Number(balance.value) - currentBalance.value) * 100) / 100
	})

	const deltaText = computed(() => {
		if (delta.value === null) return '—'
		const sign = delta.value > 0 ? '+' : delta.value < 0 ? '−' : ''
		return `${sign}$${formatMoney(Math.abs(delta.value))}`
	})

	const deltaClass = computed(() => {
		if (!delta.value) return 'text-gray-300'
		return delta.value > 0 ? 'text-emerald-600' : 'text-red-500'
	})

	// ---- 送出 ----
	const onSubmit = async () => {
		if (submitting.value) return

		touched.value = true
		trimTrailingDot()
		if (error.value) {
			inputRef.value?.focus()
			showFailToast(t('transaction.check_input_data'))
			return
		}
		if (Number(balance.value) === currentBalance.value) {
			showFailToast(t('update_usd_form_popup.enter_balance_to_update'))
			return
		}

		submitting.value = true
		try {
			const payload = { balance: Number(balance.value) }
			if (isUpdateMode.value) {
				await $bffApi.updateMyBalances(payload)
			} else {
				await $bffApi.createMyBalances(payload)
			}
			showToast({
				type: 'success',
				message: isUpdateMode.value
					? t('update_usd_form_popup.update_success')
					: t('update_usd_form_popup.add_success'),
			})

			await balanceStore.fetchMyBalance()
			emit('submitSuccess')
			show.value = false
		} catch (err) {
			console.error(err)
			showToast({
				type: 'fail',
				message: t('transaction.check_input_data'),
			})
		} finally {
			submitting.value = false
		}
	}
</script>
