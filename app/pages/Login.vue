<template>
	<div class="flex items-center justify-center bg-gray-50 px-4 py-4">
		<div class="w-full max-w-480px rounded-2xl overflow-hidden shadow-card-primary bg-surface-card">

			<!-- Header -->
			<div class="relative bg-primary pb-10 px-8 pt-8">
				<div
					class="w-12 h-12 rounded-full bg-white/25 border border-white/50 flex items-center justify-content mb-4">
					<van-icon name="manager-o" size="24" color="#fff" class="m-auto" />
				</div>
				<h1 class="text-2xl font-semibold text-on-primary tracking-tight">{{ $t('login.welcome_back') }}</h1>
				<p class="text-sm text-on-primary/75 mt-1">{{ $t('login.login_to_continue') }}</p>
				<!-- 波浪切角 -->
				<div class="absolute bottom-0 left-0 right-0 h-6 bg-surface-card rounded-t-2xl" />
			</div>

			<!-- Body -->
			<div class="px-6 pb-8 pt-2">
				<van-form @submit="onSubmit">

					<!-- Email -->
					<div class="mb-4">
						<label class="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">
							{{ $t('register.email') }}
						</label>
						<van-field v-model="email" name="email" type="email"
							class="rounded-xl! bg-gray-50! border! border-gray-200! focus-within:border-primary! focus-within:bg-surface-card! focus-within:shadow-[0_0_0_3px_rgba(248,131,121,0.12)]!"
							:placeholder="$t('register.enter_email')" :rules="[
								{ required: true, message: $t('register.enter_email') },
								{ pattern: /.+@.+\..+/, message: $t('login.invalid_email_format') }
							]" />
					</div>

					<!-- Password -->
					<div class="mb-2">
						<label class="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">
							{{ $t('login.password') }}
						</label>
						<van-field v-model="password" type="password" name="password"
							class="rounded-xl! bg-gray-50! border! border-gray-200! focus-within:border-primary! focus-within:bg-surface-card! focus-within:shadow-[0_0_0_3px_rgba(248,131,121,0.12)]!"
							:placeholder="$t('login.enter_password')"
							:rules="[{ required: true, message: $t('login.please_fill_password') }]" />
					</div>

					<!-- Links -->
					<div class="flex justify-between mb-5">
						<span class="text-sm text-primary font-medium cursor-pointer"
							@click="navigateTo(localePath('/register'))">
							{{ $t('login.register') }}
						</span>
						<span class="text-sm text-primary font-medium cursor-pointer"
							@click="navigateTo(localePath('/change-password'))">
							{{ $t('login.forgot_password') }}
						</span>
					</div>

					<!-- Submit -->
					<van-button round block native-type="submit" color="var(--color-primary)"
						class="h-11! text-base! font-semibold! rounded-xl!">
						{{ $t('login.login') }}
					</van-button>

					<!-- Divider -->
					<div class="flex items-center gap-3 my-5">
						<div class="flex-1 h-px bg-gray-100" />
						<span class="text-xs text-gray-400"> OR </span>
						<div class="flex-1 h-px bg-gray-100" />
					</div>

					<!-- Google -->
					<div class="flex justify-center">
						<GoogleSignInButton size="large" type="standard" @success="handleGoogleLogin"
							@error="handleGoogleLoginError" />
					</div>

				</van-form>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { GoogleSignInButton } from 'vue3-google-signin'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'

const { t } = useI18n()
const localePath = useLocalePath()
const email = ref('')
const password = ref('')
const userStore = useUserStore()
const { isAuthenticated } = useAuth()

const onSubmit = async (values: { email: string; password: string }) => {
	try {
		const res = await $fetch('/api/user/login', {
			method: 'POST',
			body: {
				email: values.email,
				password: values.password,
			},
		})

		if (res.success) {
			// BFF 已寫入 cookie，這裡只更新前端狀態
			userStore.setUsername(res.data.name)
			isAuthenticated.value = true
			showToast(t('login.login_success'))
			navigateTo(localePath('/'))
		}
	} catch (error) {
		if (import.meta.dev) console.error(error)
		showToast(t('login.login_fail'))
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
			navigateTo(localePath('/'))
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
