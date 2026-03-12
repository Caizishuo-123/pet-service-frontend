import request from '@/utils/request'

/**
 * 分页查询服务列表
 */
export const getServicePage = (params) => {
  return request.get('/petService/page', { params })
}

/**
 * 服务详情
 */
export const getServiceDetail = (id) => {
  return request.get(`/petService/detail/${id}`)
}

/**
 * 获取所有启用的服务（预约下拉用）
 */
export const getEnabledServices = () => {
  return request.get('/petService/list')
}
