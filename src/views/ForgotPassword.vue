<template>
  <div class="forgot-page">
    <div class="forgot-container">
      <!-- 左侧装饰区 -->
      <div class="forgot-banner">
        <div class="banner-content">
          <span class="banner-icon">🔒</span>
          <h1>重置密码</h1>
          <p>通过邮箱验证码找回您的密码</p>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="forgot-form-wrapper">
        <div class="form-header">
          <h2>忘记密码</h2>
          <p>请输入注册时的邮箱来重置密码</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" size="large" label-position="top">
          <el-form-item prop="email" label="邮箱">
            <el-input v-model="form.email" placeholder="请输入注册邮箱" />
          </el-form-item>

          <el-form-item prop="code" label="验证码">
            <div class="code-row">
              <el-input v-model="form.code" placeholder="请输入验证码" />
              <el-button type="primary" :disabled="codeCooldown > 0" :loading="codeSending" @click="handleSendCode"
                class="code-btn">
                {{ codeCooldown > 0 ? `${codeCooldown}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item prop="newPassword" label="新密码">
            <el-input v-model="form.newPassword" type="password" placeholder="请输入新密码" show-password />
          </el-form-item>

          <el-form-item prop="confirmPassword" label="确认密码">
            <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="loading" class="reset-btn" @click="handleReset">
              重 置 密 码
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <router-link to="/login" class="link">返回登录</router-link>
        </div>
      </div>
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
      codeCooldown.value = 60
      cooldownTimer = setInterval(() => {
        codeCooldown.value--
        if (codeCooldown.value <= 0) {
          clearInterval(cooldownTimer)
        }
      }, 1000)
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
      form.email, form.code, form.newPassword, form.confirmPassword
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
.forgot-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.forgot-container {
  display: flex;
  width: 800px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  overflow: hidden;
}

.forgot-banner {
  width: 300px;
  background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
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
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
}

.banner-content p {
  font-size: 15px;
  opacity: 0.9;
}

.forgot-form-wrapper {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: 28px;
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

.code-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.code-row .el-input {
  flex: 1;
}

.code-btn {
  width: 120px;
  flex-shrink: 0;
}

.reset-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
}

.form-footer {
  text-align: center;
  margin-top: 12px;
}

.form-footer .link {
  color: #409EFF;
  font-size: 14px;
  text-decoration: none;
}

.form-footer .link:hover {
  text-decoration: underline;
}
</style>
