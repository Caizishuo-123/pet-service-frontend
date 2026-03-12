import request from '@/utils/request'

/**
 * 获取当前用户信息
 */
export const getCurrentUserInfo = () => {
  return request.get('/user/current-user-info')
}

/**
 * 修改个人信息（地址）
 */
export const updateInfo = (address) => {
  return request.put('/user/update-info', null, {
    params: { address }
  })
}

/**
 * 上传/更新头像
 */
export const updateAvatar = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/user/update-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000
  })
}

/**
 * 修改密码（需邮箱验证码）
 */
export const updatePassword = (params) => {
  return request.put('/user/update-password', null, { params })
}
