<template>
  <div class="register-page">
    <div class="register-container">
      <!-- 左侧装饰区 -->
      <div class="register-banner">
        <div class="banner-content">
          <span class="banner-icon">🐾</span>
          <h1>宠乐园</h1>
          <p>加入我们，开启宠物新生活</p>
          <p class="sub-text">领养 · 服务 · 社区</p>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="register-form-wrapper">
        <div class="form-header">
          <h2>注册账号</h2>
          <p>通过邮箱验证码完成注册</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" size="large" label-position="top">
          <!-- 邮箱 + 验证码 -->
          <el-form-item prop="email" label="邮箱">
            <el-input v-model="form.email" placeholder="请输入邮箱" />
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

          <!-- 用户名 -->
          <el-form-item prop="username" label="用户名">
            <el-input v-model="form.username" placeholder="请输入用户名" />
          </el-form-item>

          <!-- 手机号 -->
          <el-form-item prop="phone" label="手机号">
            <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
          </el-form-item>

          <!-- 密码 -->
          <el-form-item prop="password" label="密码">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="loading" class="register-btn" @click="handleRegister">
              注 册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <router-link to="/login" class="link">已有账号？立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { sendCode, registerByEmail } from '@/api/email'
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
  username: '',
  phone: '',
  password: ''
})

const validatePhone = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('手机号格式不正确'))
  } else {
    callback()
  }
}

const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
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
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为 2-20 个字符', trigger: 'blur' }
  ],
  phone: [{ required: true, validator: validatePhone, trigger: 'blur' }],
  password: [{ required: true, validator: validatePassword, trigger: 'blur' }]
}

// 发送验证码
const handleSendCode = async () => {
  // 先校验邮箱字段
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
      // 开始 60 秒倒计时
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

// 注册
const handleRegister = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await registerByEmail(
      form.email, form.code, form.username, form.phone, form.password
    )
    if (res.code === 200) {
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } else {
      ElMessage.error(res.message || '注册失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.register-container {
  display: flex;
  width: 860px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  overflow: hidden;
}

.register-banner {
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

.register-form-wrapper {
  flex: 1;
  padding: 36px 40px;
  overflow-y: auto;
  max-height: 90vh;
}

.form-header {
  margin-bottom: 24px;
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

.register-btn {
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
