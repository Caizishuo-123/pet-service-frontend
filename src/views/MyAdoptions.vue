<template>
  <div class="my-adoptions-page page-shell">
    <section class="page-hero adoptions-hero">
      <div class="hero-copy">
        <span class="page-kicker">我的领养</span>
        <h1 class="page-title">跟踪领养申请进度</h1>
        <p class="page-desc">查看申请、审核、待支付和完成状态，待审核申请也可以主动取消。</p>
      </div>
    </section>

    <section class="surface-panel adoptions-panel">
      <div class="section-heading adoptions-heading">
        <div>
          <h2>申请记录</h2>
          <p>待审核、待支付、拒绝、完成和取消的申请都会保留在这里。</p>
        </div>
        <div class="filter-shell">
          <el-radio-group v-model="currentStatus" @change="handleStatusChange" size="large">
            <el-radio-button :value="null">全部</el-radio-button>
            <el-radio-button :value="1">待审核</el-radio-button>
            <el-radio-button :value="2">待支付</el-radio-button>
            <el-radio-button :value="3">已拒绝</el-radio-button>
            <el-radio-button :value="4">已完成</el-radio-button>
            <el-radio-button :value="5">已取消</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div v-if="loading" class="loading-area">
        <el-skeleton :rows="5" animated />
      </div>

      <template v-else>
        <div v-if="applies.length" class="apply-list">
          <article class="apply-card" v-for="item in applies" :key="item.id">
            <div class="card-left">
              <img v-if="item.petImage" :src="getCosUrl(item.petImage)" class="pet-avatar" @error="setImageFallback" />
              <div v-else class="pet-avatar-placeholder">宠</div>
            </div>

            <div class="card-body">
              <div class="card-row-top">
                <h4 class="card-title">{{ item.petName || '未知宠物' }}</h4>
                <el-tag :type="statusTagType(item.status)" size="small" class="status-tag">
                  {{ statusLabel(item.status) }}
                </el-tag>
              </div>
              <p class="card-info">
                <span>品种 · {{ item.petBreed || '未知' }}</span>
                <span>方式 · {{ deliveryLabel(item.deliveryType) }}</span>
                <span v-if="item.orderTotalPrice !== undefined && item.orderTotalPrice !== null">金额 · {{ formatPriceText(item.orderTotalPrice) }}</span>
              </p>
              <p class="card-time" v-if="item.createTime">申请时间 · {{ formatTime(item.createTime) }}</p>
              <p class="card-remark" v-if="item.applyReason">理由 · {{ item.applyReason }}</p>
            </div>

            <div class="card-actions">
              <el-button v-if="canPay(item)" type="primary" size="small" @click="goPay(item)">去支付</el-button>
              <el-button v-if="item.status === 1" size="small" plain type="warning" @click="handleCancel(item)">取消申请</el-button>
              <el-button size="small" plain @click="openDetail(item)">详情</el-button>
            </div>
          </article>
        </div>

        <el-empty v-else description="暂无领养申请" :image-size="120">
          <el-button type="primary" @click="router.push('/adoption')">去领养大厅</el-button>
        </el-empty>
      </template>
    </section>

    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next"
        @current-change="fetchApplies" background />
    </div>

    <el-dialog v-model="detailVisible" title="领养申请详情" width="720px" destroy-on-close>
      <div v-if="detailLoading" class="detail-loading">
        <el-skeleton :rows="4" animated />
      </div>
      <div v-else-if="detail" class="detail-content">
        <el-steps align-center class="status-steps">
          <el-step title="提交申请" :status="adoptionStepStatus(detail.status, 0)" />
          <el-step title="审核结果" :status="adoptionStepStatus(detail.status, 1)" />
          <el-step title="待支付" :status="adoptionStepStatus(detail.status, 2)" />
          <el-step title="领养完成" :status="adoptionStepStatus(detail.status, 3)" />
        </el-steps>

        <div class="detail-grid">
          <div class="detail-item">
            <span>宠物</span>
            <strong>{{ detail.petName || '未知宠物' }}</strong>
          </div>
          <div class="detail-item">
            <span>申请状态</span>
            <strong>{{ statusLabel(detail.status) }}</strong>
          </div>
          <div class="detail-item">
            <span>品种</span>
            <strong>{{ detail.petBreed || '-' }}</strong>
          </div>
          <div class="detail-item">
            <span>领养费用</span>
            <strong>{{ formatPriceText(detail.orderTotalPrice ?? detail.petAdoptionFee) }}</strong>
          </div>
          <div class="detail-item">
            <span>领取方式</span>
            <strong>{{ deliveryLabel(detail.deliveryType) }}</strong>
          </div>
          <div class="detail-item">
            <span>联系电话</span>
            <strong>{{ detail.contactPhone || '-' }}</strong>
          </div>
          <div class="detail-item" v-if="detail.address">
            <span>送达地址</span>
            <strong>{{ detail.address }}</strong>
          </div>
          <div class="detail-item" v-if="detail.orderNo">
            <span>订单编号</span>
            <strong>{{ detail.orderNo }}</strong>
          </div>
          <div class="detail-item full" v-if="detail.petDescription">
            <span>送养说明</span>
            <strong>{{ detail.petDescription }}</strong>
          </div>
          <div class="detail-item full" v-if="detail.applyReason">
            <span>申请理由</span>
            <strong>{{ detail.applyReason }}</strong>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="detail?.status === 1" type="warning" plain @click="handleCancel(detail)">取消申请</el-button>
        <el-button v-if="canPay(detail)" type="primary" @click="goPay(detail)">去支付</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyApplies, getApplyDetail, cancelApply } from '@/api/adoption'
import { getCosUrl } from '@/utils/request'
import { createSvgPlaceholder } from '@/utils/placeholders'

const router = useRouter()
const applies = ref([])
const total = ref(0)
const loading = ref(false)
const currentStatus = ref(null)
const page = ref(1)
const pageSize = 10
const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)
const petPlaceholder = createSvgPlaceholder('PET', '#eaf0f8', '#416894', 120, 120)

const statusLabel = (status) => {
  const map = { 1: '待审核', 2: '待支付', 3: '已拒绝', 4: '已完成', 5: '已取消' }
  return map[status] || '未知'
}

const statusTagType = (status) => {
  const map = { 1: 'warning', 2: 'primary', 3: 'danger', 4: 'success', 5: 'info' }
  return map[status] || 'info'
}

const deliveryLabel = (type) => {
  const map = { 1: '上门自取', 2: '送宠上门' }
  return map[type] || '未选择'
}

const formatTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const formatPriceText = (value) => {
  const price = Number(value || 0)
  return price <= 0 ? '免费领养' : `¥${price.toFixed(2)}`
}

const setImageFallback = (event) => {
  if (event?.target && event.target.src !== petPlaceholder) {
    event.target.src = petPlaceholder
  }
}

const canPay = (item) => item?.status === 2 && item?.orderId && item?.orderPayStatus === 0

const adoptionStepStatus = (status, index) => {
  if (status === 1) return index === 0 ? 'process' : 'wait'
  if (status === 2) {
    if (index < 2) return 'success'
    return index === 2 ? 'process' : 'wait'
  }
  if (status === 3 || status === 5) {
    if (index === 0) return 'success'
    if (index === 1) return 'error'
    return 'wait'
  }
  if (status === 4) return 'success'
  return 'wait'
}

const handleStatusChange = () => {
  page.value = 1
  fetchApplies()
}

const fetchApplies = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (currentStatus.value !== null) params.status = currentStatus.value
    const res = await getMyApplies(params)
    if (res.code === 200) {
      applies.value = res.data?.records || []
      total.value = res.data?.total || 0
    }
  } catch (e) {
    console.error('获取领养申请失败', e)
  } finally {
    loading.value = false
  }
}

const openDetail = async (item) => {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res = await getApplyDetail(item.id)
    if (res.code === 200) {
      detail.value = res.data
    } else {
      ElMessage.error(res.message || '获取详情失败')
      detailVisible.value = false
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '获取详情失败')
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

const handleCancel = (item) => {
  if (!item?.id || item.status !== 1) return
  ElMessageBox.confirm('确认取消这条待审核的领养申请吗？取消后该记录会保留为已取消。', '取消申请', {
    confirmButtonText: '确认取消',
    cancelButtonText: '再想想',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await cancelApply(item.id)
      if (res.code === 200) {
        ElMessage.success('申请已取消')
        detailVisible.value = false
        fetchApplies()
      } else {
        ElMessage.error(res.message || '取消失败')
      }
    } catch (e) {
      ElMessage.error(e.response?.data?.message || '取消失败')
    }
  })
}

const goPay = (item) => {
  if (!item?.orderId) return
  router.push({ path: '/checkout', query: { orderId: item.orderId } })
}

onMounted(() => fetchApplies())
</script>

<style scoped>
.my-adoptions-page {
  padding-bottom: 24px;
}

.adoptions-hero {
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

.adoptions-panel {
  padding: 28px;
  border-radius: var(--radius-lg);
}

.adoptions-heading {
  margin-bottom: 22px;
  align-items: flex-start;
}

.adoptions-heading h2 {
  margin: 8px 0 10px;
  font-size: 26px;
}

.adoptions-heading p {
  margin: 0;
  color: var(--ink-body);
}

.filter-shell {
  background: var(--surface-soft);
  padding: 6px;
  border-radius: 999px;
}

.apply-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.apply-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 22px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.apply-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-left,
.card-actions {
  flex-shrink: 0;
}

.pet-avatar,
.pet-avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 16px;
}

.pet-avatar {
  object-fit: cover;
}

.pet-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-soft);
  color: var(--brand-strong);
  font-size: 24px;
  font-weight: 800;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.card-title {
  margin: 0;
  color: var(--ink-strong);
  font-size: 16px;
  font-weight: 700;
}

.status-tag {
  border-radius: 999px;
}

.card-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 0 0 4px;
  color: var(--ink-body);
  font-size: 13px;
}

.card-time {
  margin: 0 0 2px;
  color: var(--ink-muted);
  font-size: 13px;
}

.card-remark {
  margin: 0;
  color: var(--ink-muted);
  font-size: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.loading-area {
  padding: 40px 0;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 24px 0 16px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-steps {
  margin-top: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--surface-soft);
}

.detail-item.full {
  grid-column: 1 / -1;
}

.detail-item span {
  color: var(--ink-muted);
  font-size: 12px;
}

.detail-item strong {
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 960px) {
  .adoptions-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .adoptions-panel {
    padding: 22px;
  }

  .apply-card {
    align-items: flex-start;
  }
}
</style>
