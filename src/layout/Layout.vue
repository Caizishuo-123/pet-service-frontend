<template>
  <el-container class="app-layout">
    <el-header class="navbar-shell">
      <div class="page-shell navbar">
        <div class="navbar-left">
          <button class="brand" type="button" @click="router.push('/home')">
            <span class="brand-mark">宠</span>
            <span class="brand-copy">
              <span class="brand-name">宠乐园</span>
              <span class="brand-note">宠物服务平台</span>
            </span>
          </button>

          <el-menu :default-active="activeMenu" mode="horizontal" :ellipsis="false" router class="nav-menu">
            <el-menu-item index="/home">首页</el-menu-item>
            <el-menu-item index="/adoption">领养大厅</el-menu-item>
            <el-menu-item index="/services">宠物服务</el-menu-item>
            <el-menu-item index="/community">社区</el-menu-item>
          </el-menu>
        </div>

        <div class="navbar-right">
          <template v-if="userStore.isLoggedIn">
            <el-dropdown trigger="click">
              <button class="user-entry" type="button">
                <el-avatar v-if="userStore.avatar" :size="38" :src="getCosUrl(userStore.avatar)" />
                <el-avatar v-else :size="38" class="user-fallback">
                  {{ userStore.username?.charAt(0)?.toUpperCase() || 'U' }}
                </el-avatar>
                <span class="user-text">
                  <span class="user-name">{{ userStore.username }}</span>
                  <span class="user-label">进入个人中心</span>
                </span>
                <el-icon class="user-arrow">
                  <ArrowDown />
                </el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="router.push('/profile')">
                    <el-icon>
                      <User />
                    </el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item @click="router.push('/my-pets')">
                    <el-icon>
                      <Star />
                    </el-icon>
                    我的宠物
                  </el-dropdown-item>
                  <el-dropdown-item @click="router.push('/my-appointments')">
                    <el-icon>
                      <Calendar />
                    </el-icon>
                    我的预约
                  </el-dropdown-item>
                  <el-dropdown-item @click="router.push('/my-orders')">
                    <el-icon>
                      <Ticket />
                    </el-icon>
                    我的订单
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    <el-icon>
                      <SwitchButton />
                    </el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>

          <template v-else>
            <el-button class="login-btn" round @click="router.push('/login')">登录</el-button>
            <el-button type="primary" round @click="router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </el-header>

    <el-main class="main-content">
      <router-view />
    </el-main>

    <el-footer class="footer-shell">
      <div class="page-shell footer">
        <div class="footer-main">
          <strong>宠乐园</strong>
          <span>领养、服务和社区内容统一整理在一个轻量的平台里。</span>
        </div>
        <span>© 2026 Pet Park</span>
      </div>
    </el-footer>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getCosUrl } from '@/utils/request'
import { ArrowDown, Calendar, Star, SwitchButton, Ticket, User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/pet/')) return '/adoption'
  if (path.startsWith('/post/')) return '/community'
  return path
})

const handleLogout = () => {
  userStore.logout()
  router.push('/home')
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.navbar-shell {
  position: sticky;
  top: 0;
  z-index: 100;
  height: auto;
  padding: 0;
  background: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(37, 54, 74, 0.08);
  box-shadow: 0 4px 16px rgba(37, 54, 74, 0.04);
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  min-height: 70px;
  padding: 0 24px;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.navbar-left,
.navbar-right {
  display: flex;
  align-items: center;
  gap: 18px;
}

.navbar-left {
  min-width: 0;
  flex: 1;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #dbe7f6, #c7d8ef);
  color: #34527d;
  font-size: 18px;
  font-weight: 800;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
}

.brand-name {
  color: #25364a;
  font-size: 18px;
  font-weight: 800;
}

.brand-note {
  margin-top: 3px;
  color: #8b96a5;
  font-size: 12px;
}

.nav-menu {
  min-width: 0;
  flex: 1;
  border-bottom: none !important;
  background: transparent !important;
  display: flex;
  align-items: center;
}

.nav-menu :deep(.el-menu--horizontal) {
  border-bottom: none !important;
  align-items: center;
  height: 70px;
}

.nav-menu :deep(.el-menu-item) {
  display: flex;
  align-items: center;
  height: 40px;
  line-height: 40px;
  margin: 0 4px;
  padding: 0 16px;
  border: none !important;
  border-radius: 999px;
  color: #667489 !important;
  background: transparent !important;
  font-weight: 600;
}

.nav-menu :deep(.el-menu-item:hover) {
  color: var(--brand-strong) !important;
  background: rgba(95, 136, 198, 0.1) !important;
}

.nav-menu :deep(.el-menu-item.is-active) {
  color: var(--brand-strong) !important;
  background: rgba(95, 136, 198, 0.14) !important;
}

.user-entry {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 50px;
  padding: 6px 12px 6px 6px;
  border: 1px solid rgba(37, 54, 74, 0.08);
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
}

.user-fallback {
  background: linear-gradient(135deg, #5f88c6, #7aa0d8);
  color: #fff;
}

.user-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
}

.user-name {
  color: #25364a;
  font-size: 14px;
  font-weight: 700;
}

.user-label {
  margin-top: 2px;
  color: #8b96a5;
  font-size: 11px;
}

.user-arrow {
  color: #8b96a5;
}

.login-btn {
  border-color: rgba(95, 136, 198, 0.24) !important;
  color: var(--brand-strong) !important;
  background: rgba(95, 136, 198, 0.06) !important;
}

.main-content {
  padding: 20px;
}

.footer-shell {
  height: auto;
  padding: 0 20px 20px;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 22px;
  color: #738092;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(37, 54, 74, 0.08);
}

.footer-main {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.footer strong {
  color: #25364a;
}

@media (max-width: 980px) {
  .navbar {
    flex-direction: column;
    align-items: stretch;
  }

  .navbar-left,
  .navbar-right {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .nav-menu {
    width: 100%;
  }
}

@media (max-width: 720px) {

  .main-content,
  .footer-shell {
    padding-left: 12px;
    padding-right: 12px;
  }

  .navbar {
    padding: 0 16px;
    min-height: 56px;
  }

  .brand-note,
  .user-label {
    display: none;
  }

  .nav-menu {
    overflow-x: auto;
  }

  .footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
