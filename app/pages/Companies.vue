<template>
	<div class="bg-surface-card min-h-screen">
		<!-- Header -->
		<div class="sticky top-0 z-10 bg-surface-card/90 backdrop-blur-xs border-b border-gray-100 px-4 py-3">
			<h1 class="text-lg font-semibold text-gray-800 tracking-tight">
				{{ $t('companies.title') }}
			</h1>
		</div>

		<van-index-bar :index-list="indexList" :sticky-offset-top="52">
			<template v-for="(group, letter) in groupedCompanies" :key="letter">
				<!-- Index Anchor -->
				<van-index-anchor :index="letter">
					<span class="text-xs font-semibold tracking-widest text-primary uppercase px-1">
						{{ letter }}
					</span>
				</van-index-anchor>

				<!-- Company List -->
				<div class="px-3 pb-2 space-y-1">
					<div v-for="company in group" :key="company.symbol"
						class="group flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-card border border-gray-100 active:scale-[0.98] transition-all duration-150 cursor-pointer hover:border-primary/30 hover:shadow-card-primary"
						@click="handleClick(company.symbol)">
						<!-- Company Icon -->
						<div class="shrink-0">
							<CompanyIcon :symbol="company.symbol" />
						</div>

						<!-- Symbol Badge -->
						<div class="shrink-0 min-w-[3rem] px-2 py-0.5 rounded-md bg-primary/10 text-center">
							<span class="text-xs font-bold text-primary tracking-wide">
								{{ company.symbol }}
							</span>
						</div>

						<!-- Company Name -->
						<div class="flex-1 min-w-0">
							<p class="text-sm text-gray-600 truncate leading-snug">{{ company.name }}</p>
						</div>

						<!-- Arrow -->
						<div class="shrink-0 text-gray-300 group-hover:text-primary/50 transition-colors duration-150">
							<SvgIcon name="icon_chevron_right" size="16px" />
						</div>
					</div>
				</div>
			</template>
		</van-index-bar>

		<van-back-top right="1rem" bottom="3.5rem" />
	</div>
</template>

<script setup lang="ts">
import type { Company } from '../types/api'

const localePath = useLocalePath()
const { $publicKV } = useNuxtApp()

defineOptions({
	name: 'companies',
})

const { data: companies } = await useAsyncData<Company[]>('company-symbols', async () => {
	const res = await $publicKV.getCompanySymbols()
	return res.data
})

const groupedCompanies = computed(() => {
	if (!companies.value) return {}

	return companies.value.reduce((acc, company) => {
		const letter = company.symbol?.[0]?.toUpperCase() ?? '#'
		if (!acc[letter]) acc[letter] = []
		acc[letter]?.push(company)
		return acc
	}, {} as Record<string, Company[]>)
})

const indexList = computed(() => {
	return Object.keys(groupedCompanies.value).sort()
})

const handleClick = (symbol: string) => {
	navigateTo(localePath(`/company-metrics/${symbol}`))
}

const { t } = useI18n()

usePageSeo(computed(() => ({
	title: t('companies.meta_title'),
	description: t('companies.meta_description'),
})))
</script>