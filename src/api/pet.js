import request from '@/utils/request'

/**
 * 分页查询可领养宠物列表
 */
export const getAdoptionPage = (params) => {
  return request.get('/pet/adoption/page', { params })
}

/**
 * 获取可领养宠物品种列表
 */
export const getAdoptionBreeds = (type) => {
  const params = {}
  if (type) params.type = type
  return request.get('/pet/breeds', { params })
}

/**
 * 获取宠物详情
 */
export const getPetDetail = (id) => {
  return request.get(`/pet/detail/${id}`)
}

/**
 * 我的宠物列表
 */
export const getMyPets = (page = 1, pageSize = 10) => {
  return request.get('/pet/mine', { params: { page, pageSize } })
}

/**
 * 添加宠物
 */
export const addPet = (data) => {
  return request.post('/pet/add', data)
}

/**
 * 修改宠物
 */
export const updatePet = (data) => {
  return request.put('/pet/update', data)
}

/**
 * 删除宠物
 */
export const deletePet = (id) => {
  return request.delete(`/pet/delete/${id}`)
}
