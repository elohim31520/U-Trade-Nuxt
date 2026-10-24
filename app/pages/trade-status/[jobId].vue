<template>
    <div class="min-h-screen bg-[#0f0f13] text-white font-mono">
        <!-- Header -->
        <div
            class="sticky top-0 z-10 bg-[#0f0f13]/90 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center gap-3">
            <van-icon name="arrow-left" size="20" @click="$router.back()"
                class="cursor-pointer opacity-60 hover:opacity-100 transition-opacity" />
            <div>
                <p class="text-xs text-white/40 uppercase tracking-widest">AI Order</p>
                <h1 class="text-sm font-bold tracking-tight truncate max-w-[200px]">{{ jobId }}</h1>
            </div>
            <div class="ml-auto">
                <StatusBadge :status="job?.status" />
            </div>
        </div>

        <!-- Loading skeleton -->
        <div v-if="!job" class="p-4 space-y-3 mt-2">
            <van-skeleton :row="4" row-width="100%" />
        </div>

        <div v-else class="p-4 space-y-4">
            <!-- Status Card -->
            <div class="rounded-2xl border p-5 transition-all duration-700" :class="statusCardClass">
                <!-- Icon + Status -->
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl" :class="iconBgClass">
                        <span v-if="job.status === 'pending'" class="animate-spin inline-block">⟳</span>
                        <span v-else-if="job.status === 'success'">✓</span>
                        <span v-else>✕</span>
                    </div>
                    <div>
                        <p class="text-xs text-white/40 uppercase tracking-widest mb-0.5">Status</p>
                        <p class="font-bold text-base" :class="statusTextClass">
                            {{ statusLabel }}
                        </p>
                    </div>
                </div>

                <!-- Progress bar for pending -->
                <div v-if="job.status === 'pending'" class="mb-4">
                    <div class="h-0.5 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-amber-400/80 rounded-full animate-[progress_2s_ease-in-out_infinite]"
                            style="width: 60%;" />
                    </div>
                    <p class="text-xs text-white/30 mt-2">AI 正在處理中，請稍候...</p>
                </div>

                <!-- Message -->
                <div v-if="job.message"
                    class="bg-white/5 rounded-xl p-3 text-sm text-white/70 leading-relaxed border border-white/5">
                    {{ job.message }}
                </div>
            </div>

            <!-- Timestamps -->
            <div class="rounded-2xl bg-white/[0.03] border border-white/5 p-4 space-y-3">
                <p class="text-xs text-white/30 uppercase tracking-widest mb-3">Timeline</p>

                <div class="flex items-start gap-3">
                    <div class="w-1.5 h-1.5 rounded-full bg-white/30 mt-1.5 shrink-0" />
                    <div>
                        <p class="text-xs text-white/40">建立時間</p>
                        <p class="text-sm text-white/80">{{ formatTime(job.createdAt) }}</p>
                    </div>
                </div>

                <div class="flex items-start gap-3">
                    <div class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-colors"
                        :class="job.status === 'pending' ? 'bg-amber-400 animate-pulse' : 'bg-white/30'" />
                    <div>
                        <p class="text-xs text-white/40">最後更新</p>
                        <p class="text-sm text-white/80">{{ formatTime(job.updatedAt) }}</p>
                    </div>
                </div>

                <div v-if="job.status !== 'pending'" class="flex items-start gap-3">
                    <div class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        :class="job.status === 'success' ? 'bg-emerald-400' : 'bg-rose-400'" />
                    <div>
                        <p class="text-xs text-white/40">耗時</p>
                        <p class="text-sm text-white/80">{{ elapsed }}</p>
                    </div>
                </div>
            </div>

            <!-- Job ID -->
            <div class="rounded-2xl bg-white/[0.03] border border-white/5 p-4 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
                @click="copyJobId">
                <div>
                    <p class="text-xs text-white/30 uppercase tracking-widest mb-1">Job ID</p>
                    <p class="text-sm text-white/60 font-mono break-all">{{ jobId }}</p>
                </div>
                <van-icon name="copy-o" size="18" class="text-white/30 shrink-0 ml-3" />
            </div>

            <!-- Actions -->
            <div class="pt-2 space-y-3">
                <van-button v-if="job.status === 'failed'" block round type="danger"
                    class="bg-rose-500/20! border-rose-500/30! text-rose-400!" @click="handleRetry">
                    重新嘗試
                </van-button>

                <van-button block round plain class="border-white/10! text-white/40! bg-transparent!"
                    @click="navigateTo(localePath('/records'))">
                    返回紀錄列表
                </van-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { showToast, showNotify } from 'vant'
import { useAiTradeStore } from '@/stores/aiTrade'
import { useRoute } from 'vue-router'
import { formatTime } from '@/utils/date'

const localePath = useLocalePath()
const route = useRoute()
const jobId = route.params.jobId as string

const store = useAiTradeStore()
const job = computed(() => store.getJob(jobId))

onMounted(() => {
    // 告訴 store 當前頁面在看這個 job（避免彈出通知）
    store.setActivePageJobId(jobId)
    if (_isEmpty(jobId)) {
        showNotify({
            message: '缺少JobId',
            background: '#ef4444',
            color: '#fff',
        })
    } else {
        // 若 store 沒有這個 job，開始追蹤
        if (!store.getJob(jobId)) {
            store.startTracking(jobId)
        }
    }
})

onUnmounted(() => {
    store.setActivePageJobId(null)
})

const statusLabel = computed(() => {
    switch (job.value?.status) {
        case 'pending': return '處理中...'
        case 'success': return '提取成功'
        case 'failed': return '提取失敗'
        default: return '載入中'
    }
})

const statusCardClass = computed(() => {
    switch (job.value?.status) {
        case 'pending': return 'border-amber-500/20 bg-amber-500/5'
        case 'success': return 'border-emerald-500/20 bg-emerald-500/5'
        case 'failed': return 'border-rose-500/20 bg-rose-500/5'
        default: return 'border-white/5 bg-white/[0.03]'
    }
})

const iconBgClass = computed(() => {
    switch (job.value?.status) {
        case 'pending': return 'bg-amber-500/20 text-amber-400'
        case 'success': return 'bg-emerald-500/20 text-emerald-400'
        case 'failed': return 'bg-rose-500/20 text-rose-400'
        default: return 'bg-white/10 text-white/40'
    }
})

const statusTextClass = computed(() => {
    switch (job.value?.status) {
        case 'pending': return 'text-amber-400'
        case 'success': return 'text-emerald-400'
        case 'failed': return 'text-rose-400'
        default: return 'text-white/60'
    }
})

const elapsed = computed(() => {
    if (!job.value) return '-'
    const ms = job.value.updatedAt - job.value.createdAt
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
})

async function copyJobId() {
    await navigator.clipboard.writeText(jobId)
    showToast({ message: '已複製 Job ID', icon: 'success' })
}

function handleRetry() {
    store.removeJob(jobId)
    store.startTracking(jobId)
    showNotify({ type: 'primary', message: '重新發起查詢...', duration: 2000 })
}
</script>

<style>
@keyframes progress {
    0% {
        width: 20%;
        margin-left: 0;
    }

    50% {
        width: 60%;
        margin-left: 20%;
    }

    100% {
        width: 20%;
        margin-left: 80%;
    }
}
</style>