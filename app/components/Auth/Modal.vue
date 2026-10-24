<template>
	<van-popup :show="mode !== null" round destroy-on-close :style="{ width: 'min(88vw, 26rem)' }"
		class="bg-surface-card!" @update:show="onShowChange">
		<div class="flex max-h-[90vh] flex-col bg-surface-card">
			<div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
				<div class="min-w-0">
					<h2 class="truncate text-[1.0625rem] font-bold text-gray-900">{{ $t(title) }}</h2>
					<p v-if="tab === 'login'" class="mt-0.5 truncate text-xs text-gray-500">
						{{ $t('login.login_to_continue') }}
					</p>
				</div>
				<button type="button" :aria-label="$t('common.close')"
					class="grid size-8 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500! transition active:scale-90"
					@click="close">
					<van-icon name="cross" />
				</button>
			</div>

			<div class="overflow-y-auto overscroll-contain p-6">
				<div class="mb-5 flex gap-1 rounded-full bg-gray-100 p-1">
					<button v-for="item in tabs" :key="item.mode" type="button"
						class="flex-1 rounded-full py-2 text-[0.8125rem] font-medium transition-colors duration-150"
						:class="tab === item.mode ? 'bg-primary font-bold text-white! shadow-sm' : 'text-gray-500!'"
						@click="open(item.mode)">
						{{ $t(item.label) }}
					</button>
				</div>

				<AuthSigninForm v-if="tab === 'login'" />
				<AuthRegisterForm v-else />

				<p class="mt-4 text-center text-[0.78125rem] text-gray-400">
					{{ $t(tab === 'login' ? 'login.no_account' : 'register.has_account') }}
					<a href="#" class="font-medium text-primary"
						@click.prevent="open(tab === 'login' ? 'register' : 'login')">
						{{ $t(tab === 'login' ? 'login.register' : 'login.login') }}
					</a>
				</p>
			</div>
		</div>
	</van-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const { mode, open, close } = useAuthModal()

const tabs = [
	{ mode: 'login', label: 'login.login' },
	{ mode: 'register', label: 'login.register' },
] as const

// 關閉動畫期間 mode 已經是 null，內容要停在關閉前那一頁，不然會閃成登入表單
const tab = ref<AuthMode>(mode.value ?? 'login')
watch(mode, (next) => {
	if (next) tab.value = next
})

const title = computed(() => (tab.value === 'login' ? 'login.welcome_back' : 'register.title'))

const onShowChange = (show: boolean) => {
	if (!show) close()
}
</script>
