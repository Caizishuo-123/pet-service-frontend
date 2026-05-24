<template>
  <div class="pet-detail-page page-shell" v-loading="loading">
    <div class="back-bar">
      <el-button text @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回领养大厅
      </el-button>
    </div>

    <template v-if="pet">
      <section class="detail-card">
        <div class="pet-image-wrap">
          <img :src="getCosUrl(pet.image)" :alt="pet.name" @error="setImageFallback" />
          <span class="pet-type-badge">{{ pet.type === 1 ? '小猫' : '小狗' }}</span>
        </div>

        <div class="pet-info">
          <div class="pet-header">
            <div>
              <span class="page-kicker">宠物详情</span>
              <h1>{{ pet.name }}</h1>
            </div>
            <el-tag :type="canApply ? 'success' : 'info'" effect="plain" size="large">
              {{ petStatusLabel(pet.status) }}
            </el-tag>
          </div>

          <div class="fee-banner" :class="{ free: Number(pet.adoptionFee || 0) <= 0 }">
            <span>领养费用</span>
            <strong>{{ formatAdoptionFee(pet.adoptionFee) }}</strong>
            <small>{{ Number(pet.adoptionFee || 0) <= 0 ? '当前为免费领养' : '提交申请后，审核通过会生成待支付订单' }}</small>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span>品种</span>
              <strong>{{ pet.breed || '待完善' }}</strong>
            </div>
            <div class="info-item">
              <span>年龄</span>
              <strong>{{ formatPetAge(pet.age) }}</strong>
            </div>
            <div class="info-item">
              <span>性别</span>
              <strong>{{ pet.gender === 1 ? '公' : pet.gender === 2 ? '母' : '待完善' }}</strong>
            </div>
            <div class="info-item">
              <span>来源</span>
              <strong>{{ sourceLabel(pet.source) }}</strong>
            </div>
          </div>

          <div class="health-section">
            <span>健康信息</span>
            <div class="health-tag-row">
              <template v-if="getHealthStatusTags(pet.healthStatus).length">
                <el-tag v-for="item in getHealthStatusTags(pet.healthStatus)" :key="item.value" :type="item.type" size="small">
                  {{ item.label }}
                </el-tag>
              </template>
              <span v-else class="empty-text">状态待更新</span>
            </div>
          </div>

          <div class="pet-description" v-if="pet.description">
            <h3>送养说明</h3>
            <p>{{ pet.description }}</p>
          </div>

          <el-button type="primary" size="large" round class="adopt-btn" :disabled="!canApply" @click="openApplyDialog">
            {{ canApply ? '申请领养' : '当前不可申请' }}
          </el-button>
        </div>
      </section>
    </template>

    <el-empty v-else-if="!loading" description="宠物信息不存在" :image-size="120">
      <el-button type="primary" @click="router.push('/adoption')">返回领养大厅</el-button>
    </el-empty>

    <el-dialog v-model="showApplyDialog" title="申请领养" width="860px" :close-on-click-modal="false" destroy-on-close>
      <div class="apply-dialog" v-if="pet">
        <aside class="apply-pet-card">
          <img :src="getCosUrl(pet.image)" :alt="pet.name" @error="setImageFallback" />
          <div>
            <strong>{{ pet.name }}</strong>
            <span>{{ pet.breed || '品种待完善' }} · {{ formatPetAge(pet.age) }}</span>
            <em>{{ formatAdoptionFee(pet.adoptionFee) }}</em>
          </div>
        </aside>

        <el-form ref="applyFormRef" :model="applyForm" :rules="applyRules" label-width="92px" size="large" class="apply-form">
          <el-form-item label="申请理由" prop="applyReason">
            <el-input
              v-model="applyForm.applyReason"
              type="textarea"
              :rows="4"
              placeholder="请说明领养原因、养宠经验和照顾计划"
              maxlength="255"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="领取方式" prop="deliveryType">
            <el-radio-group v-model="applyForm.deliveryType">
              <el-radio :value="1">上门自取</el-radio>
              <el-radio :value="2">送宠上门</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="联系电话" prop="contactPhone">
            <div class="field-with-check">
              <el-checkbox v-model="useDefaultPhone" :disabled="!defaultPhone">使用默认手机号</el-checkbox>
              <el-input v-model="applyForm.contactPhone" :disabled="useDefaultPhone" placeholder="请输入联系电话" maxlength="20" />
            </div>
          </el-form-item>

          <el-form-item v-if="applyForm.deliveryType === 2" label="送达地址" prop="address">
            <div class="field-with-check">
              <el-checkbox v-model="useDefaultAddress" :disabled="!defaultAddress">使用默认地址</el-checkbox>
              <el-input v-model="applyForm.address" :disabled="useDefaultAddress" placeholder="请输入送达地址" maxlength="255" />
            </div>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showApplyDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleApply">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getPetDetail } from '@/api/pet'
import { submitApply } from '@/api/adoption'
import { useUserStore } from '@/stores/user'
import { getCosUrl } from '@/utils/request'
import { createSvgPlaceholder } from '@/utils/placeholders'
import { getHealthStatusTags } from '@/utils/healthStatus'
import { formatPetAge } from '@/utils/petFormat'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const pet = ref(null)
const loading = ref(true)
const showApplyDialog = ref(false)
const submitting = ref(false)
const applyFormRef = ref(null)
const useDefaultPhone = ref(false)
const useDefaultAddress = ref(false)
const fallbackImage = createSvgPlaceholder('PET', '#eaf0f8', '#416894', 640, 460)

const applyForm = reactive({
  applyReason: '',
  deliveryType: 1,
  contactPhone: '',
  address: ''
})

const defaultPhone = computed(() => userStore.userInfo?.phone || '')
const defaultAddress = computed(() => userStore.userInfo?.address || '')
const canApply = computed(() => pet.value?.status === 2)

const applyRules = {
  applyReason: [
    { required: true, message: '请填写申请理由', trigger: 'blur' },
    { min: 10, message: '申请理由至少10个字', trigger: 'blur' }
  ],
  deliveryType: [{ required: true, message: '请选择领取方式', trigger: 'change' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  address: [{
    validator: (rule, value, callback) => {
      if (applyForm.deliveryType === 2 && !String(value || '').trim()) {
        callback(new Error('送宠上门需要填写送达地址'))
        return
      }
      callback()
    },
    trigger: 'blur'
  }]
}

const sourceLabel = (source) => {
  const map = { 1: '用户发布', 2: '平台发布' }
  return map[source] || '其他'
}

const petStatusLabel = (status) => {
  const map = { 2: '可领养', 3: '已锁定', 6: '送养完成' }
  return map[status] || '不可申请'
}

const formatAdoptionFee = (value) => {
  const fee = Number(value || 0)
  return fee <= 0 ? '免费领养' : `¥${fee.toFixed(2)}`
}

const setImageFallback = (event) => {
  if (event?.target && event.target.src !== fallbackImage) {
    event.target.src = fallbackImage
  }
}

const resetApplyForm = () => {
  applyForm.applyReason = ''
  applyForm.deliveryType = 1
  useDefaultPhone.value = !!defaultPhone.value
  useDefaultAddress.value = !!defaultAddress.value
  applyForm.contactPhone = useDefaultPhone.value ? defaultPhone.value : ''
  applyForm.address = ''
  nextTick(() => applyFormRef.value?.clearValidate?.())
}

const openApplyDialog = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录后再申请领养')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (!canApply.value) {
    ElMessage.warning('该宠物当前不可申请领养')
    return
  }
  resetApplyForm()
  showApplyDialog.value = true
}

const handleApply = async () => {
  const valid = await applyFormRef.value?.validate().catch(() => false)
  if (!valid || !pet.value) return

  submitting.value = true
  try {
    const res = await submitApply({
      petId: pet.value.id,
      applyReason: applyForm.applyReason,
      deliveryType: applyForm.deliveryType,
      contactPhone: applyForm.contactPhone,
      address: applyForm.deliveryType === 2 ? applyForm.address : ''
    })
    if (res.code === 200) {
      ElMessage.success('领养申请已提交，请等待审核')
      showApplyDialog.value = false
      router.push('/my-adoptions')
    } else {
      ElMessage.error(res.message || '申请提交失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '申请提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

watch(useDefaultPhone, (checked) => {
  applyForm.contactPhone = checked ? defaultPhone.value : ''
  nextTick(() => applyFormRef.value?.clearValidate?.(['contactPhone']))
})

watch(useDefaultAddress, (checked) => {
  applyForm.address = checked ? defaultAddress.value : ''
  nextTick(() => applyFormRef.value?.clearValidate?.(['address']))
})

watch(
  () => applyForm.deliveryType,
  async (value) => {
    if (value !== 2) {
      applyForm.address = ''
      await nextTick()
      applyFormRef.value?.clearValidate?.(['address'])
      return
    }
    applyForm.address = useDefaultAddress.value ? defaultAddress.value : ''
  }
)

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
  padding-bottom: 32px;
}

.back-bar {
  margin-bottom: 16px;
}

.detail-card {
  display: grid;
  grid-template-columns: minmax(420px, 0.95fr) minmax(0, 1.05fr);
  gap: 30px;
  padding: 28px;
  border-radius: 24px;
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  box-shadow: var(--shadow-sm);
}

.pet-image-wrap {
  position: relative;
  min-height: 520px;
  overflow: hidden;
  border-radius: 18px;
  background: var(--surface-soft);
}

.pet-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pet-type-badge {
  position: absolute;
  left: 16px;
  top: 16px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(37, 54, 74, 0.76);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.pet-info {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.pet-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.pet-header h1 {
  margin: 10px 0 0;
  color: var(--ink-strong);
  font-size: 34px;
  line-height: 1.18;
}

.fee-banner {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 18px 20px;
  border-radius: 16px;
  border: 1px solid rgba(204, 99, 58, 0.14);
  background: linear-gradient(135deg, rgba(204, 99, 58, 0.12), rgba(255, 238, 228, 0.96));
}

.fee-banner.free {
  border-color: rgba(68, 169, 120, 0.16);
  background: linear-gradient(135deg, rgba(68, 169, 120, 0.1), rgba(237, 250, 243, 0.96));
}

.fee-banner span {
  color: #8a5d46;
  font-size: 13px;
  font-weight: 700;
}

.fee-banner.free span {
  color: #2f7a59;
}

.fee-banner strong {
  color: #b6512f;
  font-size: 30px;
  line-height: 1;
}

.fee-banner.free strong {
  color: #2f7a59;
}

.fee-banner small {
  color: var(--ink-body);
  font-size: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-item,
.health-section,
.pet-description {
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--surface-soft);
}

.info-item span,
.health-section > span {
  display: block;
  margin-bottom: 6px;
  color: var(--ink-muted);
  font-size: 12px;
}

.info-item strong {
  color: var(--ink-strong);
  font-size: 15px;
}

.health-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.empty-text {
  color: var(--ink-muted);
  font-size: 13px;
}

.pet-description h3 {
  margin: 0 0 8px;
  color: var(--ink-strong);
  font-size: 16px;
}

.pet-description p {
  margin: 0;
  color: var(--ink-body);
  line-height: 1.75;
  white-space: pre-wrap;
}

.adopt-btn {
  width: 100%;
  height: 48px;
  font-weight: 700;
}

.apply-dialog {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.apply-pet-card {
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid var(--line-soft);
  background: var(--surface-soft);
}

.apply-pet-card img {
  display: block;
  width: 100%;
  height: 220px;
  object-fit: cover;
}

.apply-pet-card div {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

.apply-pet-card strong {
  color: var(--ink-strong);
  font-size: 20px;
}

.apply-pet-card span {
  color: var(--ink-body);
  font-size: 13px;
}

.apply-pet-card em {
  color: #b6512f;
  font-style: normal;
  font-weight: 800;
}

.apply-form {
  min-width: 0;
}

.field-with-check {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

@media (max-width: 960px) {
  .detail-card,
  .apply-dialog {
    grid-template-columns: 1fr;
  }

  .pet-image-wrap {
    min-height: 360px;
  }
}
</style>
