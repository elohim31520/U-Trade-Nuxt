function formatNumber(number: number) {
	return parseFloat(number.toFixed(2))
}

/** 千分位 + 固定兩位小數，例如 2500000 -> "2,500,000.00" */
function formatMoney(number: number) {
	return number.toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})
}

/** 縮寫大數字，例如 102500000 -> "102.5M"；空間有限的地方（圓環中央）用 */
function formatCompact(number: number) {
	return number.toLocaleString('en-US', {
		notation: 'compact',
		maximumFractionDigits: 2,
	})
}

export { formatNumber, formatMoney, formatCompact }
