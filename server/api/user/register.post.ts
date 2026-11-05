export default defineEventHandler(async (event) => {
	const body = await readBody(event)
	const config = useRuntimeConfig()

	const res = await $fetch<{
		code: number
		success: boolean
		data: { token: string }
		message: string
	}>(`${config.apiBaseUrl}/user/register`, {
		method: 'POST' as const,
		body,
	})

	if (!res?.success) {
		return fail(res?.code ?? 400, res?.message ?? '註冊失敗')
	}

	// 註冊只建立帳號，不視為登入：後端雖然會回 token，這裡刻意丟掉、不寫 cookie，
	// 使用者必須回到登入表單自行輸入密碼。
	return success(null)
})
