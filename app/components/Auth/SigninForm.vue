<template>
	<div>
		<van-form @submit="onSubmit">
			<AuthField v-model="email" name="email" type="email" :label="$t('register.email')"
				:placeholder="$t('register.enter_email')" :rules="[
					{ required: true, message: $t('register.enter_email') },
					{ pattern: /.+@.+\..+/, message: $t('login.invalid_email_format') },
				]" />

			<AuthField v-model="password" name="password" type="password" :label="$t('login.password')"
				:placeholder="$t('login.enter_password')"
				:rules="[{ required: true, message: $t('login.please_fill_password') }]" />

			<van-button round block native-type="submit" color="var(--color-primary)" :loading="submitting"
				class="mt-6 h-11! rounded-xl! text-base! font-semibold! text-white!">
				{{ $t('login.login') }}
			</van-button>
		</van-form>

		<div class="my-5 flex items-center gap-3">
			<div class="h-px flex-1 bg-gray-100" />
			<span class="text-xs text-gray-400">OR</span>
			<div class="h-px flex-1 bg-gray-100" />
		</div>

		<div class="flex justify-center">
			<GoogleSignInButton size="large" type="standard" @success="handleGoogleLogin"
				@error="handleGoogleLoginError" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { GoogleSignInButton } from 'vue3-google-signin'
import { useUserStore } from '@/stores/user'

const { t } = useI18n()
const userStore = useUserStore()
const { isAuthenticated } = useAuth()
const { close } = useAuthModal()

const email = ref('')
const password = ref('')
const submitting = ref(false)

const onSubmit = async (values: { email: string; password: string }) => {
	submitting.value = true
	try {
		const res = await $fetch('/api/user/login', {
			method: 'POST',
			body: { email: values.email, password: values.password },
		})

		if (res.success) {
			// BFF 已寫入 cookie，這裡只更新前端狀態
			userStore.setUsername(res.data.name)
			isAuthenticated.value = true
			showToast(t('login.login_success'))
			close()
		} else {
			showToast(res.message || t('login.login_fail'))
		}
	} catch (error) {
		if (import.meta.dev) console.error(error)
		showToast(t('login.login_fail'))
	} finally {
		submitting.value = false
	}
}

const handleGoogleLogin = async (response: { credential: string }) => {
	const { credential } = response
	if (!credential) return handleGoogleLoginError()

	try {
		const res = await $fetch<{
			success: boolean
			data: { name: string; picture: string }
		}>('/api/user/google-login', {
			method: 'POST',
			body: { credential },
		})

		if (res.success) {
			isAuthenticated.value = true
			userStore.setGoogleUserInfo(res.data.picture, res.data.name)
			showToast(t('login.google_login_success'))
			close()
		} else {
			handleGoogleLoginError()
		}
	} catch (error) {
		if (import.meta.dev) console.error(error)
		handleGoogleLoginError()
	}
}

const handleGoogleLoginError = () => {
	console.error('Google 登入失敗')
	showToast(t('login.google_login_fail'))
}
</script>
