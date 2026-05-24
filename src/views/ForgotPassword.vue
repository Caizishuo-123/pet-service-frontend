<template>
  <div class="auth-page">
    <div class="auth-card forgot-card">
      <section class="auth-brand">
        <button class="brand-mini" type="button" @click="router.push('/home')">
          <span class="brand-mark">宠</span>
          <span>
            <strong>宠物乐园</strong>
            <small>宠物服务平台</small>
          </span>
        </button>
        <div class="brand-copy">
          <span class="page-kicker">找回密码</span>
          <h1>通过邮箱验证码重置登录密码</h1>
          <p>验证码 5 分钟内有效，重置成功后请使用新密码重新登录。</p>
        </div>
        <div class="brand-tags">
          <span>邮箱验证</span>
          <span>密码重置</span>
          <span>账号安全</span>
        </div>
      </section>

      <section class="auth-form-panel">
        <div class="form-header">
          <h2>忘记密码</h2>
          <p>请输入注册邮箱并设置新密码</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" size="large" label-position="top" class="auth-form">
          <el-form-item prop="email" label="邮箱">
            <el-input v-model="form.email" placeholder="请输入注册邮箱" />
          </el-form-item>

          <el-form-item prop="code" label="验证码">
            <div class="code-row">
              <el-input v-model="form.code" placeholder="请输入验证码" />
              <el-button
                type="primary"
                :disabled="codeCooldown > 0"
                :loading="codeSending"
                class="code-btn"
                @click="handleSendCode"
              >
                {{ codeCooldown > 0 ? `${codeCooldown} 秒后重试` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item prop="newPassword" label="新密码">
            <el-input v-model="form.newPassword" type="password" placeholder="8-20 位，包含字母和数字" show-password />
          </el-form-item>

          <el-form-item prop="confirmPassword" label="确认密码">
            <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
          </el-form-item>

          <el-button type="primary" :loading="loading" class="submit-btn" @click="handleReset">
            重置密码
          </el-button>
        </el-form>

        <div class="form-footer">
          <router-link to="/login" class="link strong">返回登录</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { sendCode, resetPassword } from '@/api/email'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const codeSending = ref(false)
const codeCooldown = ref(0)
let cooldownTimer = null

const form = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirm = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请确认密码'))
  } else if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入新密码'))
  } else if (value.length < 8 || value.length > 20) {
    callback(new Error('密码长度为 8-20 个字符'))
  } else if (/\s/.test(value)) {
    callback(new Error('密码不能包含空格'))
  } else if (!/[a-zA-Z]/.test(value)) {
    callback(new Error('密码必须包含字母'))
  } else if (!/\d/.test(value)) {
    callback(new Error('密码必须包含数字'))
  } else {
    callback()
  }
}

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  newPassword: [{ required: true, validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirm, trigger: 'blur' }]
}

const startCooldown = () => {
  codeCooldown.value = 60
  cooldownTimer = setInterval(() => {
    codeCooldown.value--
    if (codeCooldown.value <= 0) {
      clearInterval(cooldownTimer)
    }
  }, 1000)
}

const handleSendCode = async () => {
  try {
    await formRef.value.validateField('email')
  } catch {
    return
  }

  codeSending.value = true
  try {
    const res = await sendCode(form.email)
    if (res.code === 200) {
      ElMessage.success('验证码已发送，请查收邮箱')
      startCooldown()
    } else {
      ElMessage.error(res.message || '发送失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '发送失败，请稍后重试')
  } finally {
    codeSending.value = false
  }
}

const handleReset = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await resetPassword(
      form.email,
      form.code,
      form.newPassword,
      form.confirmPassword
    )
    if (res.code === 200) {
      ElMessage.success('密码重置成功，请用新密码登录')
      router.push('/login')
    } else {
      ElMessage.error(res.message || '重置失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '重置失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})
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
  width: min(960px, 100%);
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(37, 54, 74, 0.08);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 70px rgba(37, 54, 74, 0.12);
}

.forgot-card {
  min-height: 540px;
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
  font-size: 32px;
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
  padding: 42px 48px;
}

.form-header {
  margin-bottom: 22px;
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

.auth-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.auth-form :deep(.el-form-item__label) {
  font-weight: 700;
  color: #5d6a7d;
}

.auth-form :deep(.el-input__wrapper) {
  border-radius: 12px;
}

.code-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.code-row .el-input {
  flex: 1;
}

.code-btn {
  width: 132px;
  flex-shrink: 0;
  border-radius: 12px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  margin-top: 2px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 700;
}

.form-footer {
  margin-top: 18px;
  text-align: center;
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
