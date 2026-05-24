import request from '@/utils/request'

/**
 * 提交领养申请
 */
export const submitApply = (data) => {
  return request.post('/adoption/apply', data)
}

/**
 * 我的领养申请列表
 */
export const getMyApplies = (params) => {
  return request.get('/adoption/mine', { params })
}

/**
 * 领养申请详情
 */
export const getApplyDetail = (id) => {
  return request.get(`/adoption/detail/${id}`)
}

/**
 * å–æ¶ˆå¾…å®¡æ ¸çš„é¢†å…»ç”³è¯·
 */
export const cancelApply = (id) => {
  return request.put(`/adoption/cancel/${id}`)
}
