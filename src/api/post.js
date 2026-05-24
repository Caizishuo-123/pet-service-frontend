import request from '@/utils/request'

// ============ 帖子 ============

/**
 * 发帖
 */
export const createPost = (data) => {
  return request.post('/post/add', data)
}

/**
 * ä¿®æ”¹å¸–å­
 */
export const updatePost = (data) => {
  return request.put('/post/update', data)
}

/**
 * 帖子列表
 */
export const getPostPage = (params) => {
  return request.get('/post/page', { params })
}

/**
 * 热榜帖子
 */
export const getHotPostPage = (params) => {
  return request.get('/post/hot', { params })
}

/**
 * 公告专区
 */
export const getNoticePage = (params) => {
  return request.get('/post/notice', { params })
}

/**
 * 我的帖子列表
 */
export const getMyPostPage = (params) => {
  return request.get('/post/my/page', { params })
}

/**
 * 帖子详情
 */
export const getPostDetail = (id) => {
  return request.get(`/post/detail/${id}`)
}

/**
 * 删除帖子
 */
export const deletePost = (id) => {
  return request.delete(`/post/delete/${id}`)
}

// ============ 评论 ============

/**
 * 帖子评论列表
 */
export const getComments = (params) => {
  return request.get('/comment/page', { params })
}

/**
 * 发表评论
 */
export const addComment = (data) => {
  return request.post('/comment/add', data)
}

/**
 * 删除评论
 */
export const deleteComment = (id) => {
  return request.delete(`/comment/delete/${id}`)
}

// ============ 点赞 ============

/**
 * 点赞/取消点赞
 */
export const toggleLike = (postId) => {
  return request.post('/like/toggle', null, { params: { postId } })
}

/**
 * 是否已点赞
 */
export const getLikeStatus = (postId) => {
  return request.get('/like/status', { params: { postId } })
}
