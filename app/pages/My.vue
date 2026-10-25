<template>
	<div class="flex flex-col gap-4 px-4 pt-4 pb-6">
		<!-- 帳號與餘額 -->
		<section
			class="relative overflow-hidden rounded-3xl bg-linear-to-br from-accent to-accent-2 p-5 text-on-primary shadow-nav-home">
			<!-- 兩顆柔光圓，讓漸層底不是一片平面 -->
			<span class="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full bg-on-primary/10" />
			<span class="pointer-events-none absolute -bottom-20 -left-10 size-44 rounded-full bg-on-primary/8" />

			<div class="relative flex items-center gap-3">
				<img :src="userStore.userInfo.picture" alt="avatar"
					class="size-14 shrink-0 rounded-full object-cover ring-2 ring-on-primary/50" />
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-1.5">
						<span class="truncate text-base font-semibold">{{ displayName }}</span>
						<span class="shrink-0 rounded-full bg-on-primary/20 px-2 py-0.5 text-[11px] font-semibold">
							Lv.{{ userInfo.level }}
						</span>
					</div>
					<p v-if="userStore.username" class="mt-0.5 truncate text-xs text-on-primary/70">
						ID: {{ userStore.username }}
					</p>
				</div>
			</div>

			<div class="relative mt-6">
				<p class="text-xs font-medium tracking-wide text-on-primary/70">{{ $t('my.usd_balance') }}</p>
				<p class="mt-1 flex items-baseline gap-1 tabular-nums">
					<span class="text-xl font-medium text-on-primary/80">$</span>
					<span class="text-4xl leading-none font-semibold">{{ balanceText }}</span>
				</p>
			</div>

			<!-- 現金／持倉比例 -->
			<div class="relative mt-5">
				<p class="mb-2 text-xs font-medium tracking-wide text-on-primary/70">{{ $t('my.allocation') }}</p>
				<div class="h-2 overflow-hidden rounded-full bg-on-primary/25">
					<div class="h-full rounded-full bg-on-primary transition-[width] duration-500"
						:style="{ width: `${cashPercentage}%` }" />
				</div>
				<div class="mt-2 flex items-center justify-between text-xs tabular-nums">
					<span class="flex items-center gap-1.5">
						<span class="size-2 rounded-full bg-on-primary" />
						<span class="text-on-primary/70">{{ $t('my.cash') }}</span>
						<span class="font-semibold">{{ cashPercentage }}%</span>
					</span>
					<span class="flex items-center gap-1.5">
						<span class="size-2 rounded-full bg-on-primary/25" />
						<span class="text-on-primary/70">{{ $t('my.portfolio') }}</span>
						<span class="font-semibold">{{ portfolioPercentage }}%</span>
					</span>
				</div>
			</div>

			<!-- Vant 的 base 樣式（未分層）把 button 的 color / font 設成 inherit，會蓋掉 Tailwind 的 text-* / font-*，
			     所以文字樣式放在按鈕內層的 span，不要寫在 <button> 上 -->
			<div class="relative mt-5 grid gap-2.5" :class="userStore.isLogin ? 'grid-cols-2' : 'grid-cols-1'">
				<template v-if="userStore.isLogin">
					<button type="button"
						class="flex items-center justify-center rounded-xl bg-on-primary py-2.5 transition active:scale-95"
						@click="showUpdateUSDFormPopup = true">
						<span class="flex items-center gap-1.5 text-sm font-semibold text-accent-2">
							<SvgIcon name="my_wallet" size="1.125rem" />
							{{ $t('my.update_balance') }}
						</span>
					</button>
					<button type="button"
						class="flex items-center justify-center rounded-xl border border-on-primary/25 bg-on-primary/15 py-2.5 backdrop-blur-sm transition active:scale-95"
						@click="navigateTo(localePath('/change-password'))">
						<span class="flex items-center gap-1.5 text-sm font-semibold">
							<SvgIcon name="my_lock" size="1.125rem" />
							{{ $t('my.change_password') }}
						</span>
					</button>
				</template>
				<button v-else type="button"
					class="flex items-center justify-center rounded-xl bg-on-primary py-2.5 transition active:scale-95"
					@click="openAuthModal('login')">
					<span class="flex items-center gap-1.5 text-sm font-semibold text-accent-2">
						<SvgIcon name="menu_login" size="1.125rem" />
						{{ $t('my.login') }}
					</span>
				</button>
			</div>
		</section>

		<!-- 投資組合 -->
		<section class="rounded-3xl border border-gray-200 bg-surface-card p-4 shadow-card-primary">
			<h3 class="flex items-center gap-2 text-[15px] font-semibold text-gray-900">
				<span class="h-4 w-1 rounded-full bg-linear-to-b from-accent to-accent-2" />
				{{ userStore.isLogin ? $t('my.my_portfolio') : $t('my.login_to_create_portfolio') }}
			</h3>
			<ClientOnly>
				<PortfolioChart :show-title="false" />
			</ClientOnly>
		</section>

		<UpdateUSDFormPopup v-model="showUpdateUSDFormPopup" />
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useBalanceStore } from '@/stores/balance'
import { usePortfolioStore } from '@/stores/portfolio'
import { useUserStore } from '@/stores/user'

const { t } = useI18n()
const localePath = useLocalePath()
const { open: openAuthModal } = useAuthModal()

const balanceStore = useBalanceStore()
const portfolioStore = usePortfolioStore()
const userStore = useUserStore()

const displayName = computed(() => userStore.userInfo.name || t('my.guest'))

const balanceText = computed(() =>
	Number(balanceStore.usdBalance).toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}),
)

const portfolioValue = computed(() => {
	return portfolioStore.portfolioData.reduce((sum, item) => {
		return sum + (item.quantity || 0) * (item.averagePrice || 0)
	}, 0)
})

const totalValue = computed(() => {
	return +portfolioValue.value + +balanceStore.usdBalance
})

const cashPercentage = computed(() => {
	if (totalValue.value === 0) {
		return '0.00'
	}
	return ((balanceStore.usdBalance / totalValue.value) * 100).toFixed(2)
})

const portfolioPercentage = computed(() => {
	if (totalValue.value === 0) {
		return '0.00'
	}
	return ((portfolioValue.value / totalValue.value) * 100).toFixed(2)
})

const showUpdateUSDFormPopup = ref(false)

onMounted(() => {
	if (userStore.isLogin) {
		portfolioStore.fetchMyPortfolio()
		balanceStore.fetchMyBalance()
	} else {
		portfolioStore.fetchMockPortfolio()
	}
})

// 彈窗登入後頁面不會重新掛載，補抓 onMounted 時因為沒登入而取的 mock 資料
watch(
	() => userStore.isLogin,
	(isLogin) => {
		if (!isLogin) return
		portfolioStore.fetchMyPortfolio()
		balanceStore.fetchMyBalance()
	},
)

const userInfo = ref({
	level: '1',
})
</script>
