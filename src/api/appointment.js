import request from '@/utils/request'

/**
 * 创建预约
 */
export const createAppointment = (data) => {
  return request.post('/appointment/add', data)
}

/**
 * 我的预约列表
 */
export const getMyAppointments = (params) => {
  return request.get('/appointment/mine', { params })
}

/**
 * 预约详情
 */
export const getAppointmentDetail = (id) => {
  return request.get(`/appointment/detail/${id}`)
}

/**
 * 取消预约
 */
export const cancelAppointment = (id) => {
  return request.put(`/appointment/cancel/${id}`)
}
