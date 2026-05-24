export const formatPetAge = (ageMonths) => {
  const months = Number(ageMonths)
  if (!Number.isFinite(months) || months <= 0) return '年龄待完善'
  if (months < 12) return `${months}月龄`

  const years = Math.floor(months / 12)
  const restMonths = months % 12
  return restMonths > 0 ? `${years}岁${restMonths}个月` : `${years}岁`
}
