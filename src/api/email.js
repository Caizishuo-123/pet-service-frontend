import request from '@/utils/request'

/**
 * 发送邮箱验证码
 * @param {string} email 目标邮箱
 */
export const sendCode = (email) => {
  return request.post('/email/send-code', null, {
    params: { email },
    timeout: 30000 // 发送邮件耗时较长，将超时设为 30 秒
  })
}

/**
 * 邮箱验证码注册
 */
export const registerByEmail = (email, code, username, phone, password) => {
  return request.post('/email/register', null, {
    params: { email, code, username, phone, password }
  })
}

/**
 * 忘记密码 —— 邮箱验证码重置
 */
export const resetPassword = (email, code, newPassword, confirmPassword) => {
  return request.post('/email/reset-password', null, {
    params: { email, code, newPassword, confirmPassword }
  })
}
