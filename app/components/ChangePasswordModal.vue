<template>
	<van-popup
		v-model:show="show"
		round
		destroy-on-close
		:style="{ width: 'min(88vw, 26rem)' }"
		class="bg-surface-card!"
		@closed="reset"
	>
		<div class="flex max-h-[90vh] flex-col bg-surface-card">
			<div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
				<div class="min-w-0">
					<h2 class="truncate text-[1.0625rem] font-bold text-gray-900">{{ $t('change_password.title') }}</h2>
					<p class="mt-0.5 truncate text-xs text-gray-500">{{ $t('change_password.subtitle') }}</p>
				</div>
				<button
					type="button"
					:aria-label="$t('common.close')"
					class="grid size-8 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500! transition active:scale-90"
					@click="show = false"
				>
					<van-icon name="cross" />
				</button>
			</div>

			<div class="overflow-y-auto overscroll-contain p-6">
				<van-form @submit="onSubmit">
					<AuthField
						v-model="oldPassword"
						name="oldPassword"
						type="password"
						autocomplete="current-password"
						:label="$t('change_password.old_password')"
						:placeholder="$t('change_password.enter_old_password')"
						:rules="[{ required: true, message: $t('change_password.fill_old_password') }]"
					/>

					<AuthField
						v-model="newPassword"
						name="newPassword"
						type="password"
						autocomplete="new-password"
						:label="$t('change_password.new_password')"
						:placeholder="$t('change_password.enter_new_password')"
						:rules="[
							{ required: true, message: $t('change_password.fill_new_password') },
							{ pattern: PASSWORD_PATTERN, message: $t('change_password.password_rules') },
						]"
					/>

					<AuthField
						v-model="confirmNewPassword"
						name="confirmNewPassword"
						type="password"
						autocomplete="new-password"
						:label="$t('change_password.confirm_new_password')"
						:placeholder="$t('change_password.enter_confirm_new_password')"
						:rules="[
							{ required: true, message: $t('change_password.fill_confirm_new_password') },
							{ validator: passwordValidator, message: $t('change_password.password_mismatch') },
						]"
					/>

					<van-button
						round
						block
						native-type="submit"
						color="var(--color-primary)"
						:loading="submitting"
						class="mt-6 h-11! rounded-xl! text-base! font-semibold! text-white!"
					>
						{{ $t('change_password.confirm_change') }}
					</van-button>
				</van-form>
			</div>
		</div>
	</van-popup>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue'
	import { useUserStore } from '@/stores/user'

	const props = defineProps<{
		modelValue: boolean
	}>()

	const emit = defineEmits(['update:modelValue'])

	const show = computed({
		get: () => props.modelValue,
		set: (val) => emit('update:modelValue', val),
	})

	const { t } = useI18n()
	const localePath = useLocalePath()
	const userStore = useUserStore()
	const { $bffApi } = useNuxtApp()

	const PASSWORD_PATTERN = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};:'",.<>/?]{6,30}$/

	const oldPassword = ref('')
	const newPassword = ref('')
	const confirmNewPassword = ref('')
	const submitting = ref(false)

	const passwordValidator = (val: string) => val === newPassword.value

	// 關閉動畫播完才清，不然滑出的途中欄位會先變空；驗證狀態靠 destroy-on-close 一起重來
	const reset = () => {
		oldPassword.value = ''
		newPassword.value = ''
		confirmNewPassword.value = ''
	}

	const onSubmit = async (values: { oldPassword: string; newPassword: string }) => {
		submitting.value = true
		try {
			const res = await $bffApi.changePassword({
				oldPassword: values.oldPassword,
				newPassword: values.newPassword,
			})
			if (!res.success) return

			showToast(t('change_password.change_success'))
			show.value = false
			// 密碼改完舊的登入狀態就作廢：登出、回首頁，直接拉起登入彈窗
			await userStore.logout()
			await navigateTo(localePath('/'))
			useAuthModal().open('login')
		} catch (error) {
			// 錯誤提示已由 fetchHandlers 顯示，這裡只負責放開送出鈕
			if (import.meta.dev) console.error(error)
		} finally {
			submitting.value = false
		}
	}
</script>
