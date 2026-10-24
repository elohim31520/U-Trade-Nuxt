<template>
    <div class="min-h-screen bg-surface-card text-gray-900">
        <!-- Background grid pattern -->
        <div class="fixed inset-0 opacity-[0.04] pointer-events-none"
            style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;">
        </div>

        <!-- Loading state -->
        <div v-if="!summary" class="flex items-center justify-center min-h-screen">
            <van-loading type="spinner" color="var(--color-primary)" size="36px" />
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex flex-col items-center justify-center min-h-screen gap-4">
            <van-icon name="warning-o" size="48" class="text-red-400" />
            <p class="text-gray-500">{{ $t('error.loadFailed') }}</p>
        </div>

        <!-- Main content -->
        <div v-else class="relative max-w-2xl mx-auto px-4 py-8 pb-safe">

            <!-- Header -->
            <header class="mb-8">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs tracking-[0.2em] uppercase text-gray-400 font-medium">
                        {{ $t('market.marketReport') }}
                    </span>
                    <span class="text-xs text-gray-400">{{ formattedDate }}</span>
                </div>

                <!-- Sentiment badge -->
                <div class="flex items-center gap-3 mt-4">
                    <div :class="[
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border',
                        isBullish
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-red-50 border-red-200 text-red-600'
                    ]">
                        <span :class="['w-1.5 h-1.5 rounded-full', isBullish ? 'bg-emerald-500' : 'bg-red-500']"
                            style="animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;" />
                        {{ isBullish ? $t('market.bullish') : $t('market.bearish') }}
                    </div>
                </div>

                <!-- Headline -->
                <h1 class="mt-4 text-xl font-bold leading-snug text-gray-900 tracking-tight">
                    {{ summary.headline }}
                </h1>
            </header>

            <!-- Divider -->
            <div class="h-px bg-linear-to-r from-transparent via-primary/40 to-transparent mb-8" />

            <!-- Highlights -->
            <section class="mb-8">
                <h2 class="text-xs tracking-[0.18em] uppercase text-primary font-semibold mb-4">
                    {{ $t('market.highlights') }}
                </h2>
                <div class="space-y-3">
                    <div v-for="(item, i) in summary.highlights" :key="i"
                        class="flex gap-3 items-start p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary/30 transition-colors duration-300">
                        <span
                            class="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            {{ Number(i) + 1 }}
                        </span>
                        <p class="text-sm text-gray-600 leading-relaxed">{{ item }}</p>
                    </div>
                </div>
            </section>

            <!-- Summary text -->
            <section class="mb-8">
                <h2 class="text-xs tracking-[0.18em] uppercase text-primary font-semibold mb-4">
                    {{ $t('market.analysis') }}
                </h2>
                <div class="relative p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <!-- Accent line -->
                    <div
                        class="absolute left-0 top-4 bottom-4 w-[3px] bg-linear-to-b from-primary via-primary/50 to-transparent rounded-full" />
                    <p class="pl-4 text-sm text-gray-600 leading-7">{{ summary.summary }}</p>
                </div>
            </section>

            <!-- Sectors -->
            <section class="mb-8">
                <h2 class="text-xs tracking-[0.18em] uppercase text-primary font-semibold mb-4">
                    {{ $t('market.sectors') }}
                </h2>
                <div class="space-y-3">
                    <div v-for="sector in summary.sectors" :key="sector.name"
                        class="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors duration-200">
                        <!-- Sector change badge -->
                        <div :class="[
                            'shrink-0 w-16 text-center py-1.5 rounded-lg text-sm font-bold tabular-nums',
                            sector.change.startsWith('+')
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-red-50 text-red-600'
                        ]">
                            {{ sector.change }}
                        </div>

                        <!-- Sector info -->
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-gray-900">{{ sector.name }}</p>
                            <p class="text-xs text-gray-400 mt-0.5 leading-relaxed">{{ sector.note }}</p>
                        </div>

                        <!-- Trend icon -->
                        <van-icon :name="sector.change.startsWith('+') ? 'arrow-up' : 'arrow-down'"
                            :class="sector.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'" size="16" />
                    </div>
                </div>
            </section>

            <div class="text-center">
                <p class="text-xs text-gray-400">
                    {{ $t('market.updatedAt') }}
                    {{ format(new Date(summary.generatedAt), 'HH:mm') }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'

const { $publicApi } = useNuxtApp()
const { locale } = useI18n()

const { data: marketData, error } = await useAsyncData('market-summary', () =>
    $publicApi.getMarketSummary()
)

const summary = computed(() => {
    const raw = marketData.value?.data
    if (!raw) return null
    const lang = locale.value === 'zh' ? 'zh' : 'en'
    return {
        date: raw.date,
        generatedAt: raw.generated_at,
        ...raw[lang],
    }
})

const isBullish = computed(() => summary.value?.sentiment === 'bullish')

const formattedDate = computed(() => {
    if (!summary.value?.date) return ''
    const d = new Date(summary.value.date)
    return d.toLocaleDateString(locale.value, { year: 'numeric', month: 'long', day: 'numeric' })
})

const { t } = useI18n()

usePageSeo(computed(() => ({
    title: summary.value?.headline
        ? `${summary.value.headline} - UrTrade`
        : t('market.meta_title'),
    description: summary.value?.summary?.slice(0, 160) ?? t('market.meta_description'),
})))
</script>

<style scoped>
@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.4;
    }
}

.pb-safe {
    padding-bottom: max(2rem, env(safe-area-inset-bottom));
}
</style>