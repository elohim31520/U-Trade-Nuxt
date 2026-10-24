<template>
	<div>
		<van-nav-bar :title="$t('register.title')" />
		<van-form @submit="onSubmit">
			<van-cell-group inset>
				<van-field v-model="username" name="username" :label="$t('register.account')"
					:placeholder="$t('register.enter_account')"
					:rules="[{ required: true, message: $t('register.fill_account') }]" />
				<van-field v-model="email" name="email" :label="$t('register.email')"
					:placeholder="$t('register.enter_email')"
					:rules="[{ required: true, message: $t('register.fill_email') }]" />
				<van-field v-model="password" type="password" name="password" :label="$t('register.password')"
					:placeholder="$t('register.enter_password')"
					:rules="[{ required: true, message: $t('register.fill_password') }]" />
				<van-field v-model="confirmPassword" type="password" name="confirmPassword"
					:label="$t('register.confirm_password')" :placeholder="$t('register.enter_confirm_password')"
					:rules="[{ validator: passwordValidator, message: $t('register.password_mismatch') }]" />
			</van-cell-group>
			<div style="margin: 16px">
				<van-button round block type="primary" color="var(--color-primary)" native-type="submit">
					{{ $t('register.register') }}
				</van-button>
			</div>
		</van-form>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const localePath = useLocalePath()
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const passwordValidator = (val: string) => {
	return val === password.value
}

interface FormValues {
	username: string
	password: string
	email: string
}

const onSubmit = async (values: FormValues) => {
	const res = await $fetch('/api/user/register', {
		method: 'POST',
		body: {
			name: values.username,
			password: values.password,
			email: values.email,
		},
	})
	if (res.success) {
		const userStore = useUserStore()
		userStore.fetchMe()
		showToast(t('register.register_success'))
		navigateTo(localePath('/'))
	}
}
</script>
