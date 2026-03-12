import request from '@/utils/request'

/**
 * 我的订单列表
 */
export const getMyOrders = (params) => {
  return request.get('/orders/mine', { params })
}

/**
 * 订单详情
 */
export const getOrderDetail = (id) => {
  return request.get(`/orders/detail/${id}`)
}

/**
 * 模拟支付
 * @param {number} id 订单ID
 * @param {number} payMethod 1-微信 2-支付宝
 */
export const simulatePay = (id, payMethod) => {
  return request.put('/orders/pay', null, {
    params: { id, payMethod }
  })
}
