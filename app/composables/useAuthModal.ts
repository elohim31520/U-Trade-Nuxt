export type AuthMode = 'login' | 'register'

/**
 * 登入／註冊彈窗的開關狀態。
 * 彈窗本體掛在 app.vue，任何地方（middleware、側邊選單、頁面）想要使用者登入都呼叫 open()。
 */
export const useAuthModal = () => {
	const mode = useState<AuthMode | null>('auth.modal', () => null)

	const open = (next: AuthMode = 'login') => {
		mode.value = next
	}

	const close = () => {
		mode.value = null
	}

	return { mode, open, close }
}
