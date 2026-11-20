/**
 * 卡包舞台的星空氛圍（2D canvas，蓋在背景圖上、3D 卡包後面）：閃爍的星點與兩團緩慢旋轉的星雲。
 * 移植自設計站拆卡包活動的 atmosphere.js（只留卡包的宇宙版，沒有盲盒的沙漠版）。
 *
 * 省電：分頁隱藏、舞台捲出畫面時停止繪製；「減少動態效果」時只畫一張靜態畫面；40ms 才畫一幀（約 25fps）。
 * 這支檔案不碰 Vue；canvas 由呼叫端放進舞台，回傳的函式用來停止並解除所有監聽。
 */

export interface AtmosphereParticle {
	/** 在舞台寬度裡的位置 0～1 */
	x: number
	/** 在星空區（舞台高度的 18%～80%）裡的位置 0～1 */
	y: number
	/** 星點大小；超過 2 的會多畫十字星芒 */
	size: number
	phase: number
}

export const ATMOSPHERE_PARTICLE_COUNT = 44

/** 星點的位置固定（用整數公式打散，不用亂數），每次進頁面星空都一樣 */
export function createAtmosphereParticles(count = ATMOSPHERE_PARTICLE_COUNT): AtmosphereParticle[] {
	return Array.from({ length: count }, (_, i) => ({
		x: ((i * 73 + 19) % 101) / 101,
		y: ((i * 47 + 31) % 97) / 97,
		size: 1 + (i % 4) * 0.45,
		phase: i * 2.13,
	}))
}

/** 兩團星雲：[水平位置, 垂直位置, 轉速, 顏色]，一團青色順時針、一團紫色逆時針 */
const NEBULAS = [
	{ x: 0.18, y: 0.39, spin: 0.08, color: 'rgba(119,227,255,.16)' },
	{ x: 0.78, y: 0.61, spin: -0.09, color: 'rgba(201,121,255,.14)' },
] as const

/** 每幀最短間隔（毫秒） */
const FRAME_MS = 40

export function startCardPackAtmosphere(canvas: HTMLCanvasElement, stage: HTMLElement): () => void {
	const ctx = canvas.getContext('2d')
	if (!ctx) return () => {}

	const particles = createAtmosphereParticles()
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
	let width = 1
	let height = 1
	let visible = true
	let raf = 0
	let last = 0
	let phase = 0

	function draw(t: number) {
		ctx!.clearRect(0, 0, width, height)
		for (const p of particles) {
			const alpha = 0.18 + (Math.sin(t * 1.4 + p.phase) + 1) * 0.3
			const x = p.x * width
			const y = (0.18 + p.y * 0.62) * height
			ctx!.fillStyle = `rgba(210,241,255,${alpha})`
			ctx!.beginPath()
			ctx!.arc(x, y, p.size * 0.6, 0, Math.PI * 2)
			ctx!.fill()
			if (p.size > 2) {
				ctx!.strokeStyle = `rgba(209,234,255,${alpha * 0.7})`
				ctx!.lineWidth = 0.6
				ctx!.beginPath()
				ctx!.moveTo(x - p.size * 2, y)
				ctx!.lineTo(x + p.size * 2, y)
				ctx!.moveTo(x, y - p.size * 2)
				ctx!.lineTo(x, y + p.size * 2)
				ctx!.stroke()
			}
		}
		for (const nebula of NEBULAS) {
			ctx!.save()
			ctx!.translate(width * nebula.x, height * nebula.y)
			ctx!.scale(1, 0.46)
			ctx!.rotate(t * nebula.spin)
			for (let arm = 0; arm < 3; arm++) {
				ctx!.beginPath()
				for (let j = 0; j < 75; j++) {
					const angle = j * 0.065 + (arm * Math.PI * 2) / 3
					const radius = 8 + j * 0.9
					const px = Math.cos(angle) * radius
					const py = Math.sin(angle) * radius
					if (j) ctx!.lineTo(px, py)
					else ctx!.moveTo(px, py)
				}
				ctx!.strokeStyle = nebula.color
				ctx!.lineWidth = 2
				ctx!.stroke()
			}
			ctx!.restore()
		}
	}

	function frame(now: number) {
		raf = 0
		if (document.hidden || !visible || reduced.matches) return
		if (now - last >= FRAME_MS) {
			phase += Math.min((now - last) / 1000, 0.08)
			last = now
			draw(phase)
		}
		raf = requestAnimationFrame(frame)
	}

	/** 狀態變了（隱藏、捲出、減少動態效果）就重新決定要不要跑 */
	function resume() {
		if (raf) cancelAnimationFrame(raf)
		raf = 0
		last = performance.now()
		if (reduced.matches) {
			draw(0)
			return
		}
		if (!document.hidden && visible) raf = requestAnimationFrame(frame)
	}

	const resizeObserver = new ResizeObserver(() => {
		const rect = stage.getBoundingClientRect()
		width = rect.width
		height = rect.height
		const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
		canvas.width = width * ratio
		canvas.height = height * ratio
		ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
		draw(phase)
	})
	resizeObserver.observe(stage)
	const intersectionObserver = new IntersectionObserver((entries) => {
		visible = entries[0]!.isIntersecting
		resume()
	})
	intersectionObserver.observe(stage)
	document.addEventListener('visibilitychange', resume)
	reduced.addEventListener('change', resume)
	resume()

	return () => {
		cancelAnimationFrame(raf)
		resizeObserver.disconnect()
		intersectionObserver.disconnect()
		document.removeEventListener('visibilitychange', resume)
		reduced.removeEventListener('change', resume)
	}
}
