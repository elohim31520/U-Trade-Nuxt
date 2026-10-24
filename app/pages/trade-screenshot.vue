<template>
    <div class="min-h-screen bg-gray-50 p-4">
        <div class="max-w-2xl mx-auto">
            <!-- 標題 -->
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">
                    {{ $t('transaction.upload_screenshot') }}
                </h1>
                <p class="text-sm text-gray-500 mt-2">
                    {{ $t('transaction.img_upload_tips') }}
                </p>
            </div>

            <!-- 上傳區塊 -->
            <div class="bg-white rounded-lg shadow-xs my-4">
                <van-uploader v-model="fileList" :max-count="1" :max-size="5 * 1024 * 1024" :after-read="afterRead"
                    :before-read="beforeRead" @oversize="onOversize" @delete="onDelete" @click-preview="onClickPreview">
                    <div v-if="fileList.length === 0"
                        class="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary transition-colors cursor-pointer">
                        <van-icon name="photograph" size="48" color="#999" />
                        <p class="text-gray-600 mt-4">{{ $t('upload.click_to_upload') }}</p>
                        <p class="text-sm text-gray-400 mt-2">
                            {{ $t('upload.size_limit', { size: '5MB' }) }}
                        </p>
                    </div>
                </van-uploader>
            </div>

            <!-- 提示訊息 -->
            <van-notice-bar v-if="fileList.length > 0" wrapable :scrollable="false" type="primary" class="mb-6">
                {{ $t('upload.ready_to_submit') }}
            </van-notice-bar>

            <!-- 送出按鈕 -->
            <van-button type="primary" block round size="large" :loading="uploading" :disabled="fileList.length === 0"
                @click="handleSubmit">
                {{ uploading ? $t('upload.uploading') : $t('upload.submit') }}
            </van-button>

            <!-- 返回按鈕 -->
            <van-button block round size="large" class="mt-3" @click="$router.go(-1)">
                {{ $t('common.cancel') }}
            </van-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showToast, showLoadingToast, closeToast, showImagePreview } from 'vant'
import type { UploaderFileListItem } from 'vant'
import { useUserStore } from '@/stores/user'
import { useAiTradeStore } from '@/stores/aiTrade'

const { t } = useI18n()
const localePath = useLocalePath()
const userStore = useUserStore()
const tradeStore = useAiTradeStore()
const { $bffApi } = useNuxtApp()

// 檔案列表
const fileList = ref<UploaderFileListItem[]>([])
const uploading = ref(false)

// 上傳前驗證
const beforeRead = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
        showToast(t('upload.invalid_format'))
        return false
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
        showToast(t('upload.size_exceed', { size: '5MB' }))
        return false
    }

    return true
}

// 讀取檔案後
const afterRead = (file: UploaderFileListItem) => {
    console.log('File uploaded:', file)
}

// 檔案超過大小限制
const onOversize = () => {
    showToast(t('upload.size_exceed', { size: '5MB' }))
}

// 刪除檔案
const onDelete = () => {
    console.log('File deleted')
}

// 點擊預覽圖片 - 關鍵修正
const onClickPreview = (file: UploaderFileListItem) => {
    const imageUrl = file.content || file.url
    if (imageUrl) {
        showImagePreview({
            images: [imageUrl as string],
            closeable: true,  // 顯示關閉按鈕
            closeOnPopstate: true,  // 支援瀏覽器返回鍵關閉
        })
    }
}

// 送出表單
const handleSubmit = async () => {
    if (!userStore.isLogin) {
        showToast(t('transaction.please_login_first'))
        return
    }

    if (fileList.value.length === 0) {
        showToast(t('upload.no_file'))
        return
    }

    uploading.value = true
    showLoadingToast({
        message: t('upload.uploading'),
        forbidClick: true,
        duration: 0,
    })

    try {
        // 取得 File 物件
        const file = fileList.value[0]?.file

        if (!file) {
            throw new Error('No file found')
        }

        const formData = new FormData()
        formData.append('image', file) //後端 multer 期待的欄位名是 image
        const response = await $bffApi.analyzeScreenshot(formData)

        closeToast()

        const jobId = response.data?.jobId
        tradeStore.startTracking(jobId)
        navigateTo(localePath(`/trade-status/${jobId}`))
    } catch (error: any) {
        closeToast()
        console.error('Upload error:', error)

        const errorMsg = error?.data?.message || error?.message || t('upload.failed')
        showToast({
            message: errorMsg,
            type: 'fail',
        })
    } finally {
        uploading.value = false
    }
}
</script>

<style scoped lang="scss">
:deep(.van-uploader__wrapper) {
    width: 100%;
}

:deep(.van-uploader__preview) {
    margin: 0;
}

:deep(.van-uploader__preview-image) {
    width: 100%;
    height: auto;
    border-radius: 8px;
}
</style>