const HEALTH_STATUS_MAP = [
  { value: 1, label: '已疫苗', type: 'success' },
  { value: 2, label: '已驱虫', type: 'success' },
  { value: 4, label: '已绝育', type: 'success' },
  { value: 8, label: '健康', type: '' },
  { value: 16, label: '慢性病', type: 'warning' },
  { value: 32, label: '观察中', type: 'warning' },
  { value: 64, label: '特殊照顾', type: 'danger' }
]

export const getHealthStatusTags = (status) => {
  const tags = []
  if (status === undefined || status === null) return tags
  const normalized = Number(status)
  if (!Number.isFinite(normalized)) return tags
  HEALTH_STATUS_MAP.forEach((item) => {
    if ((normalized & item.value) === item.value) {
      tags.push({ label: item.label, type: item.type, value: item.value })
    }
  })
  return tags
}

export const getHealthStatusSummary = (status) => {
  const tags = getHealthStatusTags(status)
  if (!tags.length) return ''
  return tags.map((item) => item.label).join(' / ')
}

export const getHealthStatusMap = () => HEALTH_STATUS_MAP.slice()
