<template>
  <div class="pet-detail-page" v-loading="loading">
    <!-- 返回按钮 -->
    <div class="back-bar">
      <el-button text @click="router.back()">
        <el-icon>
          <ArrowLeft />
        </el-icon> 返回领养大厅
      </el-button>
    </div>

    <template v-if="pet">
      <div class="detail-card">
        <el-row :gutter="32">
          <!-- 左侧大图 -->
          <el-col :xs="24" :md="12">
            <div class="pet-image-wrap">
              <img :src="getCosUrl(pet.image)" :alt="pet.name"
                @error="(e) => e.target.src = 'https://via.placeholder.com/600x400?text=🐾'" />
            </div>
          </el-col>

          <!-- 右侧信息 -->
          <el-col :xs="24" :md="12">
            <div class="pet-info">
              <div class="pet-header">
                <h1 class="pet-name">{{ pet.name }}</h1>
                <el-tag :type="pet.type === 1 ? 'warning' : 'success'" effect="dark" size="large">
                  {{ pet.type === 1 ? '🐱 猫咪' : '🐶 狗狗' }}
                </el-tag>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">品种</span>
                  <span class="info-value">{{ pet.breed || '未知' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">年龄</span>
                  <span class="info-value">{{ pet.age ? pet.age + '岁' : '未知' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">性别</span>
                  <span class="info-value">{{ pet.gender === 1 ? '♂ 公' : '♀ 母' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">健康状况</span>
                  <span class="info-value">
                    <template v-if="getHealthStatusTags(pet.healthStatus).length">
                      <el-tag
                        v-for="item in getHealthStatusTags(pet.healthStatus)"
                        :key="item.value"
                        :type="item.type"
                        size="small"
                        class="health-tag"
                      >
                        {{ item.label }}
                      </el-tag>
                    </template>
                    <span v-else class="health-empty">状态待更新</span>
                  </span>
                </div>
                <div class="info-item" v-if="pet.source">
                  <span class="info-label">来源</span>
                  <span class="info-value">{{ sourceLabel(pet.source) }}</span>
                </div>
              </div>

              <div class="pet-description" v-if="pet.description">
                <h3>🐾 介绍</h3>
                <p>{{ pet.description }}</p>
              </div>

              <el-button type="primary" size="large" round class="adopt-btn" @click="showApplyDialog = true">
                ❤️ 申请领养
              </el-button>
            </div>
          </el-col>
        </el-row>
      </div>
    </template>

    <el-empty v-else-if="!loading" description="宠物信息不存在" :image-size="120">
      <el-button type="primary" @click="router.push('/adoption')">返回领养大厅</el-button>
    </el-empty>

    <!-- 领养申请 Dialog -->
    <el-dialog v-model="showApplyDialog" title="申请领养" width="520px" :close-on-click-modal="false">
      <el-form ref="applyFormRef" :model="applyForm" :rules="applyRules" label-width="100px" size="large">
        <el-form-item label="申请理由" prop="applyReason">
          <el-input v-model="applyForm.applyReason" type="textarea" :rows="4" placeholder="请描述您的领养理由、养宠经验、家庭环境等"
            maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="交付方式" prop="deliveryType">
          <el-radio-group v-model="applyForm.deliveryType">
            <el-radio :value="1">上门自取</el-radio>
            <el-radio :value="2">送宠上门</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="applyForm.contactPhone" placeholder="请输入联系电话" maxlength="11" />
        </el-form-item>
        <el-form-item label="收货地址" prop="address">
          <el-input v-model="applyForm.address" placeholder="请输入您的地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApplyDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleApply">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPetDetail } from '@/api/pet'
import { submitApply } from '@/api/adoption'
import { getCosUrl } from '@/utils/request'
import { getHealthStatusTags } from '@/utils/healthStatus'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const pet = ref(null)
const loading = ref(true)
const showApplyDialog = ref(false)
const submitting = ref(false)
const applyFormRef = ref(null)

const applyForm = reactive({
  applyReason: '',
  deliveryType: 1,
  contactPhone: '',
  address: ''
})

const applyRules = {
  applyReason: [
    { required: true, message: '请填写申请理由', trigger: 'blur' },
    { min: 10, message: '申请理由至少10个字', trigger: 'blur' }
  ],
  deliveryType: [{ required: true, message: '请选择交付方式', trigger: 'change' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }]
}

const sourceLabel = (source) => {
  const map = { 1: '流浪救助', 2: '主人送养', 3: '机构转入' }
  return map[source] || '其他'
}

const handleApply = async () => {
  const valid = await applyFormRef.value.validate().catch(() => false)
  if (!valid) return

  // 检查是否登录
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录后再申请领养')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  submitting.value = true
  try {
    const res = await submitApply({
      petId: pet.value.id,
      applyReason: applyForm.applyReason,
      deliveryType: applyForm.deliveryType,
      contactPhone: applyForm.contactPhone,
      address: applyForm.address
    })
    if (res.code === 200) {
      ElMessage.success('领养申请已提交，请等待审核！')
      showApplyDialog.value = false
    } else {
      ElMessage.error(res.message || '申请提交失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '申请提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const res = await getPetDetail(route.params.id)
    if (res.code === 200) {
      pet.value = res.data
    }
  } catch (e) {
    console.error('获取宠物详情失败', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.pet-detail-page {
  max-width: 1100px;
  margin: 0 auto;
}

.back-bar {
  margin-bottom: 16px;
}

/* ========== Detail Card ========== */
.detail-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.pet-image-wrap {
  border-radius: 12px;
  overflow: hidden;
  background: #f5f7fa;
  height: 400px;
}

.pet-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ========== Info ========== */
.pet-info {
  padding: 8px 0;
}

.pet-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.pet-header .pet-name {
  font-size: 28px;
  font-weight: 800;
  color: #1f2937;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 13px;
  color: #909399;
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.health-tag {
  margin-right: 6px;
  border-radius: 999px;
}

.health-empty {
  color: #909399;
  font-size: 13px;
}

.pet-description {
  margin-bottom: 28px;
}

.pet-description h3 {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 10px;
}

.pet-description p {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
}

.adopt-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}
</style>
