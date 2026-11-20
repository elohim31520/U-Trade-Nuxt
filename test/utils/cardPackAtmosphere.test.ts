import { describe, expect, it } from 'vitest'
import { ATMOSPHERE_PARTICLE_COUNT, createAtmosphereParticles } from '../../app/utils/cardPackAtmosphere'

describe('createAtmosphereParticles', () => {
	const particles = createAtmosphereParticles()

	it('預設 44 顆，位置與大小都落在合理範圍內', () => {
		expect(particles).toHaveLength(ATMOSPHERE_PARTICLE_COUNT)
		for (const p of particles) {
			expect(p.x).toBeGreaterThanOrEqual(0)
			expect(p.x).toBeLessThan(1)
			expect(p.y).toBeGreaterThanOrEqual(0)
			expect(p.y).toBeLessThan(1)
			expect(p.size).toBeGreaterThanOrEqual(1)
			expect(p.size).toBeLessThanOrEqual(2.35)
		}
	})

	it('位置是固定公式算的（不是亂數），每次進頁面星空都一樣', () => {
		expect(createAtmosphereParticles()).toEqual(particles)
		expect(particles[0]).toEqual({ x: 19 / 101, y: 31 / 97, size: 1, phase: 0 })
	})

	it('星點不會疊在同一個位置', () => {
		const spots = new Set(particles.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`))
		expect(spots.size).toBe(particles.length)
	})

	it('只有最大的那一級（size 超過 2）會畫十字星芒', () => {
		expect(particles.some((p) => p.size > 2)).toBe(true)
		expect(particles.some((p) => p.size <= 2)).toBe(true)
	})
})
