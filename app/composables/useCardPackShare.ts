import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { showToast } from 'vant'
import { buildShareLinks } from '@/utils/cardPackContent'

/**
 * 卡包的分享面板邏輯：分享網址、各社群平台連結、複製連結、系統分享。
 * 分享的是目前這一頁的網址（不帶 query／hash，含語系前綴）。
 * title 是活動名稱（已翻譯），系統分享選單會當作標題；text 是分享文案（已翻譯）。
 */
export function useCardPackShare(title: MaybeRefOrGetter<string>, text: MaybeRefOrGetter<string>) {
	const { t } = useI18n()
	const route = useRoute()

	// 只在面板打開（一定在 client）時才會讀到；SSR 沒有 window，回空字串即可
	const url = computed(() => (import.meta.client ? new URL(route.path, window.location.origin).toString() : ''))
	const links = computed(() => buildShareLinks(url.value, toValue(text)))

	/** 瀏覽器有沒有系統分享（多半是手機；桌機 Chrome 沒有） */
	function canNativeShare() {
		return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
	}

	/**
	 * 複製連結。Clipboard API 只在安全環境（https／localhost）可用，失敗或不支援時退回
	 * 「選取輸入框 + execCommand」，再不行才提示使用者自己複製。
	 */
	async function copy(input?: HTMLInputElement | null) {
		let ok = false
		if (navigator.clipboard && window.isSecureContext) {
			try {
				await navigator.clipboard.writeText(url.value)
				ok = true
			} catch {
				ok = false
			}
		}
		if (!ok && input) {
			input.focus()
			input.select()
			try {
				ok = document.execCommand('copy')
			} catch {
				ok = false
			}
		}
		showToast(
			ok
				? { type: 'success', message: t('card_pack.share_copied') }
				: { type: 'fail', message: t('card_pack.share_copy_failed') }
		)
	}

	async function nativeShare() {
		try {
			await navigator.share({ title: toValue(title), text: toValue(text), url: url.value })
		} catch {
			/* 使用者取消分享時維持面板開啟 */
		}
	}

	return { url, links, canNativeShare, copy, nativeShare }
}
