import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  // ============ State ============
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  // ============ Getters ============
  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || '')
  const avatar = computed(() => userInfo.value?.avatar || '')

  // ============ Actions ============

  /**
   * 保存登录信息（由登录页调用）
   */
  function setLoginData(data) {
    token.value = data.token
    userInfo.value = {
      userId: data.userId,
      username: data.username,
      phone: data.phone,
      email: data.email,
      avatar: data.avatar,
      role: data.role
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  /**
   * 更新用户信息（修改头像/地址后调用）
   */
  function updateUserInfo(partial) {
    if (userInfo.value) {
      Object.assign(userInfo.value, partial)
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  /**
   * 退出登录
   */
  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    router.push('/login')
  }

  return {
    // State
    token,
    userInfo,
    // Getters
    isLoggedIn,
    username,
    avatar,
    // Actions
    setLoginData,
    updateUserInfo,
    logout
  }
})
