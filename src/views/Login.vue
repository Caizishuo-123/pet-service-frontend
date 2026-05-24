<template>
  <div class="auth-page">
    <div class="auth-card login-card">
      <section class="auth-brand">
        <button class="brand-mini" type="button" @click="router.push('/home')">
          <span class="brand-mark">宠</span>
          <span>
            <strong>宠物乐园</strong>
            <small>宠物服务平台</small>
          </span>
        </button>
        <div class="brand-copy">
          <span class="page-kicker">欢迎回来</span>
          <h1>登录你的账号</h1>
          <p>可管理宠物、预约服务、查看领养进度和订单</p>
        </div>
        <div class="brand-tags">
          <span>领养申请</span>
          <span>服务预约</span>
          <span>社区互动</span>
        </div>
      </section>

      <section class="auth-form-panel">
        <div class="form-header">
          <h2>账号登录</h2>
          <p>请输入用户名、手机号或邮箱登录</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" size="large" class="auth-form">
          <el-form-item prop="account">
            <el-input v-model="form.account" placeholder="用户名 / 手机号 / 邮箱" prefix-icon="User" />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-button type="primary" :loading="loading" class="submit-btn" @click="handleLogin">
            登录
          </el-button>
        </el-form>

        <div class="form-footer">
          <router-link to="/forgot-password" class="link">忘记密码？</router-link>
          <router-link to="/register" class="link strong">没有账号，立即注册</router-link>
        </div>
      </section>
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
  account: [{ required: true, message: '请输入用户名、手机号或邮箱', trigger: 'blur' }],
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
      ElMessage.success(route.query.expired ? '登录成功，已恢复访问' : '登录成功')
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
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background:
    radial-gradient(circle at 12% 16%, rgba(95, 136, 198, 0.14), transparent 26%),
    linear-gradient(180deg, #f8fafc 0%, #eef3fa 100%);
}

.auth-card {
  width: min(980px, 100%);
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(37, 54, 74, 0.08);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 70px rgba(37, 54, 74, 0.12);
}

.login-card {
  min-height: 520px;
}

.auth-brand {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 36px;
  background: linear-gradient(180deg, #eef5ff 0%, #f8fbff 100%);
}

.brand-mini {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: max-content;
  border: none;
  background: transparent;
  color: #25364a;
  cursor: pointer;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: #dbe7f6;
  color: #34527d;
  font-weight: 800;
}

.brand-mini strong,
.brand-mini small {
  display: block;
  text-align: left;
}

.brand-mini strong {
  font-size: 20px;
}

.brand-mini small {
  margin-top: 3px;
  color: #8b96a5;
  font-size: 12px;
}

.brand-copy {
  position: relative;
  z-index: 1;
}

.brand-copy h1 {
  margin: 18px 0 12px;
  color: #25364a;
  font-size: 34px;
  line-height: 1.18;
}

.brand-copy p {
  margin: 0;
  max-width: 360px;
  color: #5d6a7d;
  line-height: 1.8;
}

.page-kicker {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(95, 136, 198, 0.14);
  color: #446da9;
  font-size: 12px;
  font-weight: 700;
}

.brand-tags {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.brand-tags span {
  padding: 8px 12px;
  border-radius: 999px;
  background: #fff;
  color: #5d6a7d;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 10px 24px rgba(37, 54, 74, 0.06);
}

.auth-form-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 52px;
}

.form-header {
  margin-bottom: 28px;
}

.form-header h2 {
  margin: 0 0 8px;
  color: #25364a;
  font-size: 28px;
}

.form-header p {
  margin: 0;
  color: #8b96a5;
  font-size: 14px;
}

.auth-form :deep(.el-input__wrapper) {
  border-radius: 12px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  margin-top: 4px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 700;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
}

.link {
  color: #5d6a7d;
  font-size: 14px;
  text-decoration: none;
}

.link:hover,
.link.strong {
  color: #446da9;
}
</style>
