<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 左侧装饰区 -->
      <div class="login-banner">
        <div class="banner-content">
          <span class="banner-icon">🐾</span>
          <h1>宠乐园</h1>
          <p>您身边的宠物服务平台</p>
          <p class="sub-text">领养 · 服务 · 社区</p>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="login-form-wrapper">
        <div class="form-header">
          <h2>欢迎登录</h2>
          <p>请输入您的账号和密码</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" size="large">
          <el-form-item prop="account">
            <el-input v-model="form.account" placeholder="用户名 / 邮箱" prefix-icon="User" />
          </el-form-item>

          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" show-password
              @keyup.enter="handleLogin" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="loading" class="login-btn" @click="handleLogin">
              登 录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <router-link to="/forgot-password" class="link">忘记密码？</router-link>
          <span class="divider">|</span>
          <router-link to="/register" class="link">没有账号？立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { login } from '@/api/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  account: '',
  password: ''
})

const rules = {
  account: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await login(form.account, form.password)
    if (res.code === 200) {
      userStore.setLoginData(res.data)
      ElMessage.success('登录成功')
      // 跳转到之前被拦截的页面，或首页
      const redirect = route.query.redirect || '/home'
      router.push(redirect)
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '登录失败，请检查网络')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.login-container {
  display: flex;
  width: 800px;
  min-height: 460px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  overflow: hidden;
}

.login-banner {
  width: 340px;
  background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.banner-content {
  text-align: center;
  padding: 40px;
}

.banner-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.banner-content h1 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
}

.banner-content p {
  font-size: 16px;
  opacity: 0.9;
}

.sub-text {
  margin-top: 8px;
  font-size: 14px !important;
  opacity: 0.7 !important;
  letter-spacing: 4px;
}

.login-form-wrapper {
  flex: 1;
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: 32px;
}

.form-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.form-header p {
  font-size: 14px;
  color: #9ca3af;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
}

.form-footer {
  text-align: center;
  margin-top: 16px;
}

.form-footer .link {
  color: #409EFF;
  font-size: 14px;
  text-decoration: none;
}

.form-footer .link:hover {
  text-decoration: underline;
}

.form-footer .divider {
  margin: 0 12px;
  color: #d1d5db;
}
</style>
