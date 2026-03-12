import request from '@/utils/request'

/**
 * 用户登录
 * @param {string} account 用户名/邮箱
 * @param {string} password 密码
 */
export const login = (account, password) => {
  return request.post('/user/login', null, {
    params: { account, password }
  })
}

/**
 * 退出登录
 */
export const logout = () => {
  return request.post('/user/logout')
}

/**
 * 获取当前用户信息
 */
export const getCurrentUserInfo = () => {
  return request.get('/user/current-user-info')
}
