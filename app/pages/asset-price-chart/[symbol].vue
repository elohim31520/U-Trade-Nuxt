<template>
    <div class="min-h-screen bg-surface-card text-gray-900 font-mono">
        <!-- Header Bar -->
        <div class="border-b border-gray-200 px-6 py-4">
            <div class="max-w-7xl mx-auto flex items-center justify-between">
                <!-- Back -->
                <button
                    class="flex items-center gap-2 text-gray-400 hover:text-gray-800 transition-colors text-sm tracking-widest uppercase"
                    @click="router.back()">
                    <span class="text-lg leading-none">←</span>
                    <span>{{ $t('asset_price_chart.back') }}</span>
                </button>

                <!-- Asset Name -->
                <div class="text-center">
                    <div class="text-xs tracking-[0.3em] text-gray-400 uppercase mb-1">{{
                        $t('asset_price_chart.asset_label') }}</div>
                    <div class="text-lg tracking-widest font-bold uppercase text-primary">{{ asset?.label ?? symbol }}
                    </div>
                </div>

                <!-- Live Badge -->
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span class="text-xs tracking-widest text-gray-400 uppercase">{{ $t('asset_price_chart.live')
                    }}</span>
                </div>
            </div>
        </div>

        <!-- Price Hero -->
        <div v-if="asset" class="px-6 pt-8 pb-6 max-w-7xl mx-auto">
            <div class="flex flex-col sm:flex-row sm:items-end gap-4">
                <div>
                    <div class="text-sm text-gray-400 mt-1 tracking-widest uppercase">{{ asset.currency }}</div>
                </div>
                <div class="sm:ml-6 text-sm text-gray-500 tracking-wider leading-relaxed max-w-xs">
                    {{ asset.description }}
                </div>
            </div>
        </div>

        <!-- Chart -->
        <div class="px-6 pb-6 max-w-7xl mx-auto">
            <div class="rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                <TradingviewGadget v-if="asset" :symbol="asset.tvSymbol" :symbolPrefix="asset.tvPrefix"
                    :disabled="false" />
                <div v-else
                    class="h-[500px] flex items-center justify-center text-gray-300 tracking-widest text-sm uppercase">
                    {{ $t('asset_price_chart.not_found', { symbol }) }}
                </div>
            </div>
        </div>

        <!-- Asset Switcher -->
        <div class="px-6 pb-10 max-w-7xl mx-auto">
            <div class="text-xs tracking-[0.3em] text-gray-400 uppercase mb-4">{{ $t('asset_price_chart.other_assets')
            }}</div>
            <div class="flex flex-wrap gap-3">
                <NuxtLink v-for="a in otherAssets" :key="a.symbol" :to="localePath(`/asset-price-chart/${a.symbol}`)"
                    class="px-4 py-2 rounded-xl border border-gray-200 text-gray-500 hover:text-primary hover:border-primary transition-all text-sm tracking-wider">
                    {{ a.label }}
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { AssetConfig } from '~/types/market'

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()

const symbol = computed(() => route.params.symbol as string)

const ASSETS = computed<AssetConfig[]>(() => [
    {
        symbol: 'usoil',
        label: t('asset_price_chart.assets.usoil.label'),
        currency: t('asset_price_chart.assets.usoil.currency'),
        description: t('asset_price_chart.assets.usoil.description'),
        tvSymbol: 'USOIL',
        tvPrefix: 'TVC',
    },
    {
        symbol: 'us10y',
        label: t('asset_price_chart.assets.us10y.label'),
        currency: t('asset_price_chart.assets.us10y.currency'),
        description: t('asset_price_chart.assets.us10y.description'),
        tvSymbol: 'US10Y',
        tvPrefix: 'Pyth',
    },
    {
        symbol: 'xauusd',
        label: t('asset_price_chart.assets.xauusd.label'),
        currency: t('asset_price_chart.assets.xauusd.currency'),
        description: t('asset_price_chart.assets.xauusd.description'),
        tvSymbol: 'GOLD',
        tvPrefix: 'TVC',
    },
    {
        symbol: 'btcusd',
        label: t('asset_price_chart.assets.btcusd.label'),
        currency: t('asset_price_chart.assets.btcusd.currency'),
        description: t('asset_price_chart.assets.btcusd.description'),
        tvSymbol: 'BTCUSD',
        tvPrefix: 'COINBASE',
    },
    {
        symbol: 'dxy',
        label: t('asset_price_chart.assets.dxy.label'),
        currency: t('asset_price_chart.assets.dxy.currency'),
        description: t('asset_price_chart.assets.dxy.description'),
        tvSymbol: 'DXY',
        tvPrefix: 'CAPITALCOM',
    },
])

const asset = computed(() =>
    ASSETS.value.find((a) => a.symbol === symbol.value.toLowerCase())
)

const otherAssets = computed(() =>
    ASSETS.value.filter((a) => a.symbol !== symbol.value.toLowerCase())
)

usePageSeo(computed(() => {
    const current = asset.value
    return {
        title: current
            ? t('asset_price_chart.meta_title', { label: current.label })
            : t('meta.default_title'),
        description: current
            ? t('asset_price_chart.meta_description', {
                label: current.label,
                description: current.description,
            })
            : t('meta.default_description'),
    }
}))
</script>