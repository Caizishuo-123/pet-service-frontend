import axios from 'axios'
import router from '@/router'
import { ElMessage } from 'element-plus'

const RAW_COS_BASE_URL = import.meta.env.VITE_COS_BASE_URL || 'https://cthulhu-1400035022.cos.ap-guangzhou.myqcloud.com'

// COS 存储桶域名（可通过 VITE_COS_BASE_URL 配置）
export const COS_BASE_URL = RAW_COS_BASE_URL.replace(/\/+$/, '')

/**
 * 获取 COS 图片完整 URL
 * @param {string} path - 相对路径，如 upload/pet/uuid.jpg
 * @returns {string} 完整的 COS URL
 */
export const getCosUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  if (path.startsWith('/')) {
    return COS_BASE_URL + path
  }
  return `${COS_BASE_URL}/${path}`
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器 - 自动添加 Token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 - 处理响应和错误
request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      const currentPath = router.currentRoute.value.fullPath
      if (router.currentRoute.value.path !== '/login') {
        ElMessage.warning('登录已过期，请重新登录')
        router.push({
          path: '/login',
          query: {
            redirect: currentPath,
            expired: '1'
          }
        })
      }
    }
    return Promise.reject(error)
  }
)

export default request
