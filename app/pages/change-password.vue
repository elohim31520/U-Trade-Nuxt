<template>
	<div>
		<van-nav-bar :title="$t('change_password.title')" />
		<van-form @submit="onSubmit">
			<van-cell-group inset>
				<van-field v-model="oldPassword" name="oldPassword" :label="$t('change_password.old_password')"
					:placeholder="$t('change_password.enter_old_password')"
					:rules="[{ required: true, message: $t('change_password.fill_old_password') }]" type="password" />
				<van-field v-model="newPassword" type="password" name="newPassword"
					:label="$t('change_password.new_password')" :placeholder="$t('change_password.enter_new_password')"
					:rules="newPasswordRules" />
				<van-field v-model="confirmNewPassword" type="password" name="confirmNewPassword"
					:label="$t('change_password.confirm_new_password')"
					:placeholder="$t('change_password.enter_confirm_new_password')" :rules="[
						{ required: true, message: $t('change_password.fill_confirm_new_password') },
						{ validator: passwordValidator, message: $t('change_password.password_mismatch') },
					]" />
			</van-cell-group>
			<div style="margin: 16px">
				<van-button round block type="primary" color="var(--color-primary)" native-type="submit">
					{{ $t('change_password.confirm_change') }}
				</van-button>
			</div>
		</van-form>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { showToast } from 'vant'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'

definePageMeta({
	middleware: 'auth',
})

const { t } = useI18n()
const localePath = useLocalePath()
const userStore = useUserStore()
const { $bffApi } = useNuxtApp()

const oldPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')

const newPasswordRules = computed(() => [
	{ required: true, message: t('change_password.fill_new_password') },
	{
		pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};:'",.<>/?]{6,30}$/,
		message: t('change_password.password_rules'),
	},
])

const passwordValidator = (val: string) => {
	return val === newPassword.value
}

const onSubmit = async (values: { oldPassword: string; newPassword: string }) => {
	const res = await $bffApi.changePassword({
		oldPassword: values.oldPassword,
		newPassword: values.newPassword
	})
	if (res.success) {
		showToast(t('change_password.change_success'))
		await userStore.logout()
		await navigateTo(localePath('/'))
		useAuthModal().open('login')
	}
}
</script>
