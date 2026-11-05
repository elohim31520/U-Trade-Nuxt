<template>
	<van-form @submit="onSubmit">
		<AuthField v-model="username" name="username" :label="$t('register.account')"
			:placeholder="$t('register.enter_account')"
			:rules="[{ required: true, message: $t('register.fill_account') }]" />

		<AuthField v-model="email" name="email" type="email" :label="$t('register.email')"
			:placeholder="$t('register.enter_email')" :rules="[
				{ required: true, message: $t('register.fill_email') },
				{ pattern: /.+@.+\..+/, message: $t('login.invalid_email_format') },
			]" />

		<AuthField v-model="password" name="password" type="password" :label="$t('register.password')"
			:placeholder="$t('register.enter_password')"
			:rules="[{ required: true, message: $t('register.fill_password') }]" />

		<AuthField v-model="confirmPassword" name="confirmPassword" type="password"
			:label="$t('register.confirm_password')" :placeholder="$t('register.enter_confirm_password')"
			:rules="[{ validator: passwordValidator, message: $t('register.password_mismatch') }]" />

		<van-button round block native-type="submit" color="var(--color-primary)" :loading="submitting"
			class="mt-6 h-11! rounded-xl! text-base! font-semibold! text-white!">
			{{ $t('register.register') }}
		</van-button>
	</van-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { t } = useI18n()
const { open } = useAuthModal()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

const passwordValidator = (val: string) => val === password.value

const onSubmit = async (values: { username: string; email: string; password: string }) => {
	submitting.value = true
	try {
		const res = await $fetch('/api/user/register', {
			method: 'POST',
			body: { name: values.username, password: values.password, email: values.email },
		})

		if (res.success) {
			// 註冊不等於登入：切到登入分頁，讓使用者自己輸入密碼登入
			showToast(t('register.register_success_please_login'))
			open('login')
		} else {
			showToast(res.message || t('register.register_fail'))
		}
	} catch (error) {
		if (import.meta.dev) console.error(error)
		showToast(t('register.register_fail'))
	} finally {
		submitting.value = false
	}
}
</script>
