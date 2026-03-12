import request from '@/utils/request'

/**
 * 获取可领养宠物列表（首页推荐）
 */
export const getAdoptionPets = (page = 1, pageSize = 6) => {
  return request.get('/pet/adoption/page', {
    params: { page, pageSize }
  })
}

/**
 * 获取服务列表（首页推荐）
 */
export const getServices = (page = 1, pageSize = 4) => {
  return request.get('/petService/page', {
    params: { page, pageSize }
  })
}

/**
 * 获取社区帖子列表（首页推荐）
 */
export const getPosts = (page = 1, pageSize = 4) => {
  return request.get('/post/page', {
    params: { page, pageSize }
  })
}
