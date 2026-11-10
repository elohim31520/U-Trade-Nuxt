import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'

export const useUserStore = defineStore('user', () => {
	const { isAuthenticated } = useAuth()
	const isLogin = computed(() => isAuthenticated.value)

	// writeDefaults: false → 沒資料時不會把空字串寫回 localStorage，登出清掉後就真的沒有殘留的 key
	const profileStorageOptions = { writeDefaults: false }
	const username = useStorage('username', '', undefined, profileStorageOptions)
	const userPicture = useStorage('g_user_picture', '', undefined, profileStorageOptions)
	const googleUserName = useStorage('g_user_name', '', undefined, profileStorageOptions)

	const userInfo = computed(() => ({
		name: googleUserName.value || username.value,
		picture: userPicture.value || '/avatar/1.webp',
	}))

	// BFF 從 httpOnly cookie 讀 JWT 回傳用戶資料
	async function fetchMe() {
		try {
			const data = await $fetch('/api/user/me')
			username.value = data.name
			isAuthenticated.value = true
		} catch {
			// 401 或其他錯誤，視為未登入
			isAuthenticated.value = false
		}
	}

	function setGoogleUserInfo(picture: string, name: string) {
		userPicture.value = picture
		googleUserName.value = name
	}

	function setUsername(name: string) {
		username.value = name
	}

	// 設成 null 會把 localStorage 的 key 整個移除（設 '' 只會留下空字串）
	function clearProfile() {
		username.value = null
		userPicture.value = null
		googleUserName.value = null
	}

	async function logout() {
		await $fetch('/api/user/logout', { method: 'POST' })
		isAuthenticated.value = false
		clearProfile()
	}

	return {
		isLogin,
		userInfo,
		username,
		fetchMe,
		logout,
		setGoogleUserInfo,
		setUsername,
	}
})
