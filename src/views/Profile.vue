<template>
  <div class="profile-page page-shell" v-loading="loading">
    <section class="page-hero profile-hero">
      <div class="hero-copy">
        <span class="page-kicker">个人中心</span>
        <h1 class="page-title">管理你的账户与安全</h1>
        <p class="page-desc">更新头像、完善信息与安全设置，个人资料更清晰。</p>
      </div>
      <div v-if="userInfo" class="hero-tags">
        <span class="soft-chip">用户名 · {{ userInfo.username }}</span>
        <span class="soft-chip">邮箱 · {{ userInfo.email }}</span>
        <span class="soft-chip">手机 · {{ userInfo.phone || '未绑定' }}</span>
      </div>
    </section>

    <template v-if="userInfo">
      <div class="profile-layout">
        <aside class="profile-aside surface-panel">
          <el-upload
            class="avatar-uploader"
            action="/api/user/update-avatar"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :on-error="handleAvatarError"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="userInfo.avatar" :src="getCosUrl(userInfo.avatar)" class="avatar-image" />
            <div v-else class="avatar-placeholder">
              <el-icon class="avatar-icon">
                <Plus />
              </el-icon>
              <span>上传头像</span>
            </div>
          </el-upload>
          <h3 class="avatar-username">{{ userInfo.username }}</h3>
          <p class="avatar-email">{{ userInfo.email }}</p>
          <div class="avatar-meta">
            <span>{{ userInfo.phone || '未绑定手机号' }}</span>
            <span>{{ userInfo.address || '地址未填写' }}</span>
          </div>
        </aside>

        <section class="profile-main surface-panel">
          <div class="section-title">
            <h3>基本信息</h3>
            <span>信息保持清晰，便于后续服务预约</span>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">用户名</span>
              <span class="info-value">{{ userInfo.username }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">邮箱</span>
              <span class="info-value">{{ userInfo.email }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">手机号</span>
              <span class="info-value">{{ userInfo.phone || '未绑定' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="info-label">地址</span>
              <div class="info-value editable" v-if="!editingAddress">
                <span>{{ userInfo.address || '未填写' }}</span>
                <el-button text type="primary" size="small" @click="startEditAddress">修改</el-button>
              </div>
              <div class="edit-row" v-else>
                <el-input v-model="addressInput" placeholder="请输入地址" size="default" />
                <el-button type="primary" size="small" :loading="savingAddress" @click="saveAddress">保存</el-button>
                <el-button size="small" @click="editingAddress = false">取消</el-button>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="section-title">
            <h3>安全设置</h3>
            <span>定期更新密码，保障账号安全</span>
          </div>
          <div class="security-row">
            <div>
              <span class="security-label">登录密码</span>
              <span class="security-desc">建议每 3-6 个月更新一次</span>
            </div>
            <el-button type="primary" plain size="small" @click="showPwdDialog = true">修改密码</el-button>
          </div>
        </section>
      </div>
    </template>

    <el-dialog v-model="showPwdDialog" title="修改密码" width="480px" :close-on-click-modal="false">
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="100px" size="large">
        <el-form-item label="邮箱">
          <el-input :value="userInfo?.email" disabled />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-row">
            <el-input v-model="pwdForm.code" placeholder="请输入验证码" />
            <el-button type="primary" :disabled="codeCooldown > 0" :loading="codeSending" @click="handleSendCode" class="code-btn">
              {{ codeCooldown > 0 ? `${codeCooldown}s` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" placeholder="8-20位，包含字母和数字" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPwdDialog = false">取消</el-button>
        <el-button type="primary" :loading="changingPwd" @click="handleChangePwd">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted, onUnmounted } from 'vue'
import { getCurrentUserInfo, updateInfo, updatePassword } from '@/api/user'
import { sendCode } from '@/api/email'
import { getCosUrl } from '@/utils/request'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const userInfo = ref(null)
const loading = ref(true)

// 编辑地址
const editingAddress = ref(false)
const addressInput = ref('')
const savingAddress = ref(false)

// 修改密码
const showPwdDialog = ref(false)
const changingPwd = ref(false)
const pwdFormRef = ref(null)
const codeSending = ref(false)
const codeCooldown = ref(0)
let cooldownTimer = null

const pwdForm = reactive({
  code: '',
  newPassword: '',
  confirmPassword: ''
})

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

const validateConfirm = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请确认密码'))
  } else if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  newPassword: [{ required: true, validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirm, trigger: 'blur' }]
}

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

// ===== 数据加载 =====
const fetchUserInfo = async () => {
  try {
    const res = await getCurrentUserInfo()
    if (res.code === 200) {
      userInfo.value = res.data
    }
  } catch (e) {
    console.error('获取用户信息失败', e)
  } finally {
    loading.value = false
  }
}

// ===== 头像上传 =====
const handleAvatarSuccess = (response) => {
  if (response?.code === 200) {
    ElMessage.success('头像更新成功')
    userInfo.value.avatar = response.data
    userStore.updateUserInfo({ avatar: response.data })
  } else {
    ElMessage.error(response?.message || response?.msg || '上传失败')
  }
}

const handleAvatarError = () => {
  ElMessage.error('上传失败，请稍后重试')
}

const beforeAvatarUpload = (rawFile) => {
  const isValidFormat = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png' || rawFile.type === 'image/webp'
  const isLt5M = rawFile.size / 1024 / 1024 < 5

  if (!isValidFormat) {
    ElMessage.error('上传图片只能是 JPG/PNG/WEBP 格式!')
  }
  if (!isLt5M) {
    ElMessage.error('上传图片大小不能超过 5MB!')
  }
  return isValidFormat && isLt5M
}

// ===== 编辑地址 =====
const startEditAddress = () => {
  addressInput.value = userInfo.value?.address || ''
  editingAddress.value = true
}

const saveAddress = async () => {
  if (!addressInput.value.trim()) {
    ElMessage.warning('请输入地址')
    return
  }
  savingAddress.value = true
  try {
    const res = await updateInfo(addressInput.value)
    if (res.code === 200) {
      ElMessage.success('地址已更新')
      userInfo.value.address = addressInput.value
      editingAddress.value = false
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '更新失败')
  } finally {
    savingAddress.value = false
  }
}

// ===== 修改密码 =====
const handleSendCode = async () => {
  codeSending.value = true
  try {
    const res = await sendCode(userInfo.value.email)
    if (res.code === 200) {
      ElMessage.success('验证码已发送')
      codeCooldown.value = 60
      cooldownTimer = setInterval(() => {
        codeCooldown.value--
        if (codeCooldown.value <= 0) clearInterval(cooldownTimer)
      }, 1000)
    } else {
      ElMessage.error(res.message || '发送失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '发送失败')
  } finally {
    codeSending.value = false
  }
}

const handleChangePwd = async () => {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return

  changingPwd.value = true
  try {
    const res = await updatePassword({
      email: userInfo.value.email,
      code: pwdForm.code,
      newPassword: pwdForm.newPassword,
      confirmPassword: pwdForm.confirmPassword
    })
    if (res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      showPwdDialog.value = false
      userStore.logout()
    } else {
      ElMessage.error(res.message || '修改失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '修改失败')
  } finally {
    changingPwd.value = false
  }
}

onMounted(() => fetchUserInfo())
onUnmounted(() => { if (cooldownTimer) clearInterval(cooldownTimer) })
</script>

<style scoped>
.profile-page {
  padding-bottom: 24px;
}

.profile-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

/* ========== Layout ========== */
.profile-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
}

/* ========== Avatar Card ========== */
.profile-aside {
  padding: 28px 22px;
  text-align: center;
  border-radius: var(--radius-md);
}

.avatar-uploader :deep(.el-upload) {
  width: 120px;
  height: 120px;
  border-radius: 24px;
  border: 1px dashed var(--line-soft);
  background: var(--surface-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: var(--brand-strong);
  background: #fff;
  box-shadow: 0 10px 22px rgba(37, 54, 74, 0.08);
}

.avatar-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 22px;
  display: block;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--ink-muted);
  font-size: 12px;
}

.avatar-icon {
  font-size: 24px;
  color: var(--ink-muted);
}

.avatar-username {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink-strong);
  margin-top: 16px;
  margin-bottom: 4px;
}

.avatar-email {
  font-size: 13px;
  color: var(--ink-muted);
  margin-bottom: 12px;
}

.avatar-meta {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: var(--ink-body);
}

/* ========== Info Card ========== */
.profile-main {
  padding: 28px 32px;
  border-radius: var(--radius-md);
}

.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.section-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink-strong);
}

.section-title span {
  font-size: 13px;
  color: var(--ink-muted);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 24px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 13px;
  color: var(--ink-muted);
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-strong);
}

.info-value.editable {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.edit-row .el-input {
  flex: 1;
}

/* ========== Security ========== */
.security-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--surface-soft);
}

.security-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-strong);
  display: block;
  margin-bottom: 4px;
}

.security-desc {
  font-size: 13px;
  color: var(--ink-muted);
}

/* ========== Password Dialog ========== */
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

@media (max-width: 960px) {
  .profile-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-layout {
    grid-template-columns: 1fr;
  }

  .profile-aside,
  .profile-main {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .profile-main {
    padding: 22px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
