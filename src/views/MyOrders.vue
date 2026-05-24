<template>
  <div class="my-orders-page page-shell">
    <section class="page-hero orders-hero">
      <div class="hero-copy">
        <span class="page-kicker">我的订单</span>
        <h1 class="page-title">管理你的服务与领养订单</h1>
        <p class="page-desc">无论是预约服务还是领养支付，都可以在这里统一查看状态、金额和业务详情。</p>
      </div>
      <!-- <div class="hero-tags">
        <span class="soft-chip">支持按支付状态筛选</span>
        <span class="soft-chip">服务订单与领养订单自动区分</span>
      </div> -->
    </section>

    <section class="surface-panel orders-panel">
      <div class="section-heading orders-heading">
        <div>
          <h2>订单列表</h2>
          <p>订单号、业务类型、支付情况和业务信息会一起展示，更方便你追踪每一笔记录。</p>
        </div>
        <div class="orders-toolbar">
          <div class="filter-shell order-type-filter">
            <el-radio-group v-model="currentType" @change="handleTypeChange" size="large">
              <el-radio-button :value="null">全部类型</el-radio-button>
              <el-radio-button :value="1">服务预约</el-radio-button>
              <el-radio-button :value="2">领养支付</el-radio-button>
            </el-radio-group>
          </div>
          <div class="filter-shell">
            <el-radio-group v-model="currentStatus" @change="handleStatusChange" size="large">
              <el-radio-button :value="null">全部</el-radio-button>
              <el-radio-button :value="0">待支付</el-radio-button>
              <el-radio-button :value="1">已支付</el-radio-button>
            </el-radio-group>
          </div>
          <el-input
            class="orders-search"
            v-model="keyword"
            placeholder="搜索订单号、宠物名或服务名"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>
      </div>

      <div v-if="loading" class="loading-area">
        <el-skeleton :rows="5" animated />
      </div>

      <template v-else>
        <div v-if="orders.length" class="order-list">
          <article class="order-card" v-for="item in orders" :key="item.id">
            <header class="order-card-header">
              <div class="order-header-left">
                <div>
                  <span class="order-no">订单号</span>
                  <strong>{{ item.orderNo || item.id }}</strong>
                </div>
                <el-tag size="small" effect="plain" :type="getOrderTypeTagType(item.orderType)">
                  {{ getOrderTypeText(item) }}
                </el-tag>
              </div>
              <div class="header-statuses">
                <el-tag :type="item.payStatus === 1 ? 'success' : 'warning'" size="small" class="status-tag">
                  {{ item.payStatus === 1 ? '已支付' : '待支付' }}
                </el-tag>
                <el-tag :type="getBusinessStatusTagType(item)" size="small" effect="plain" class="status-tag">
                  {{ getBusinessStatusText(item) }}
                </el-tag>
              </div>
            </header>

            <div class="order-card-body">
              <div class="order-summary-row">
                <div class="summary-copy">
                  <div class="summary-title">{{ getBusinessName(item) }}</div>
                  <div class="summary-subtitle">{{ item.petName || '未知宠物' }}</div>
                </div>
                <div class="summary-amount">¥{{ formatPrice(item.totalPrice) }}</div>
              </div>
              <div class="order-info-grid">
                <div class="order-info-item">
                  <span class="label">宠物</span>
                  <span class="value">{{ item.petName || '未知宠物' }}</span>
                </div>
                <div class="order-info-item">
                  <span class="label">业务状态</span>
                  <span class="value">{{ getBusinessStatusText(item) }}</span>
                </div>
                <div class="order-info-item" v-if="item.orderType === 1 && item.appointmentTime">
                  <span class="label">预约时间</span>
                  <span class="value">{{ formatTime(item.appointmentTime) }}</span>
                </div>
                <div class="order-info-item" v-if="item.orderType === 2">
                  <span class="label">领取方式</span>
                  <span class="value">{{ formatDeliveryType(item.deliveryType) }}</span>
                </div>
                <div class="order-info-item" v-if="item.orderType === 2">
                  <span class="label">领养进度</span>
                  <span class="value">{{ formatAdoptionStatus(item.adoptionStatus) }}</span>
                </div>
                <div class="order-info-item" v-if="item.payMethod && item.payStatus === 1">
                  <span class="label">支付方式</span>
                  <span class="value">{{ item.payMethod === 1 ? '微信支付' : '支付宝' }}</span>
                </div>
                <div class="order-info-item" v-if="item.createTime">
                  <span class="label">创建时间</span>
                  <span class="value">{{ formatTime(item.createTime) }}</span>
                </div>
                <div class="order-info-item" v-if="item.payTime">
                  <span class="label">支付时间</span>
                  <span class="value">{{ formatTime(item.payTime) }}</span>
                </div>
              </div>
              <div v-if="item.payStatus === 0 && item.canPay === false && item.cannotPayReason" class="order-note">
                当前不可支付：{{ item.cannotPayReason }}
              </div>
            </div>

            <footer class="order-card-footer">
              <el-button size="small" plain @click="openDetail(item)">详情</el-button>
              <el-button v-if="item.payStatus === 0 && item.canPay" type="primary" size="small" @click="handlePay(item)">
                <span class="pay-icon">支付</span> 
              </el-button>
              <el-button v-else-if="item.payStatus === 0 && item.canPay === false" size="small" disabled>
                不可支付
              </el-button>
            </footer>
          </article>
        </div>

        <el-empty v-else description="暂无订单" :image-size="120">
          <div class="empty-actions">
            <el-button type="primary" @click="$router.push('/services')">去预约服务</el-button>
            <el-button plain @click="$router.push('/adoption')">去领养大厅</el-button>
          </div>
        </el-empty>
      </template>
    </section>

    <div class="pagination-wrap" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchOrders"
        background
      />
    </div>

    <el-dialog v-model="detailVisible" title="订单详情" width="720px" destroy-on-close>
      <div v-if="detailLoading" class="detail-loading">
        <el-skeleton :rows="4" animated />
      </div>
      <div v-else-if="detail" class="detail-content">
        <el-steps align-center class="status-steps">
          <el-step title="待支付" :status="orderStepStatus(detail.payStatus, 0)" />
          <el-step title="已支付" :status="orderStepStatus(detail.payStatus, 1)" />
        </el-steps>

        <div class="detail-grid">
          <div class="detail-item">
            <span>订单编号</span>
            <strong>{{ detail.orderNo || detail.id }}</strong>
          </div>
          <div class="detail-item">
            <span>订单类型</span>
            <strong>{{ getOrderTypeText(detail) }}</strong>
          </div>
          <div class="detail-item">
            <span>{{ getBusinessLabel(detail.orderType) }}</span>
            <strong>{{ getBusinessName(detail) }}</strong>
          </div>
          <div class="detail-item">
            <span>宠物</span>
            <strong>{{ detail.petName || '未知宠物' }}</strong>
          </div>
          <div class="detail-item">
            <span>订单金额</span>
            <strong>¥{{ formatPrice(detail.totalPrice) }}</strong>
          </div>
          <div class="detail-item">
            <span>支付状态</span>
            <strong>{{ detail.payStatus === 1 ? '已支付' : '待支付' }}</strong>
          </div>
          <div class="detail-item">
            <span>业务状态</span>
            <strong>{{ getBusinessStatusText(detail) }}</strong>
          </div>
          <div class="detail-item" v-if="detail.createTime">
            <span>创建时间</span>
            <strong>{{ formatTime(detail.createTime) }}</strong>
          </div>
          <div class="detail-item" v-if="detail.payTime">
            <span>支付时间</span>
            <strong>{{ formatTime(detail.payTime) }}</strong>
          </div>
          <div class="detail-item" v-if="detail.orderType === 1 && detail.appointmentTime">
            <span>预约时间</span>
            <strong>{{ formatTime(detail.appointmentTime) }}</strong>
          </div>
          <div class="detail-item" v-if="detail.orderType === 1 && detail.appointmentStatus">
            <span>预约状态</span>
            <strong>{{ formatAppointmentStatus(detail.appointmentStatus) }}</strong>
          </div>
          <div class="detail-item" v-if="detail.orderType === 2">
            <span>领养申请ID</span>
            <strong>{{ detail.adoptionApplyId || detail.relatedId || '-' }}</strong>
          </div>
          <div class="detail-item" v-if="detail.orderType === 2">
            <span>领取方式</span>
            <strong>{{ formatDeliveryType(detail.deliveryType) }}</strong>
          </div>
          <div class="detail-item" v-if="detail.orderType === 2">
            <span>领养进度</span>
            <strong>{{ formatAdoptionStatus(detail.adoptionStatus) }}</strong>
          </div>
          <div class="detail-item" v-if="detail.orderType === 2 && detail.contactPhone">
            <span>联系电话</span>
            <strong>{{ detail.contactPhone }}</strong>
          </div>
          <div class="detail-item" v-if="detail.orderType === 2 && detail.address">
            <span>送达地址</span>
            <strong>{{ detail.address }}</strong>
          </div>
          <div class="detail-item" v-if="detail.orderType === 2 && detail.applyReason">
            <span>申请理由</span>
            <strong>{{ detail.applyReason }}</strong>
          </div>
          <div class="detail-item full" v-if="detail.payStatus === 0 && detail.canPay === false && detail.cannotPayReason">
            <span>支付提示</span>
            <strong>{{ detail.cannotPayReason }}</strong>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button v-if="detail?.orderType === 1" plain @click="goBusinessDetail(detail)">查看预约</el-button>
        <el-button v-if="detail?.orderType === 2" plain @click="goBusinessDetail(detail)">查看申请</el-button>
        <el-button v-if="detail?.payStatus === 0 && detail?.canPay" type="primary" @click="handlePay(detail)">去支付</el-button>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyOrders, getOrderDetail } from '@/api/order'

const router = useRouter()
const orders = ref([])
const total = ref(0)
const loading = ref(false)
const currentStatus = ref(null)
const currentType = ref(null)
const keyword = ref('')
const page = ref(1)
const pageSize = 10
const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)

const orderTypeMap = {
  1: '服务预约',
  2: '领养支付'
}

const deliveryTypeMap = {
  1: '上门自取',
  2: '送宠上门'
}

const adoptionStatusMap = {
  1: '待审核',
  2: '待支付',
  3: '已拒绝',
  4: '已完成',
  5: '已取消'
}

const appointmentStatusMap = {
  1: '已预约',
  2: '已完成',
  3: '已取消'
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const formatPrice = (price) => {
  const amount = Number(price || 0)
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
}

const formatDeliveryType = (type) => deliveryTypeMap[type] || '未填写'

const formatAdoptionStatus = (status) => adoptionStatusMap[status] || '处理中'

const formatAppointmentStatus = (status) => appointmentStatusMap[status] || '处理中'

const getOrderTypeText = (item) => item?.orderTypeName || orderTypeMap[item?.orderType] || '普通订单'

const getOrderTypeTagType = (orderType) => (orderType === 2 ? 'warning' : 'primary')

const getBusinessLabel = (orderType) => (orderType === 2 ? '业务类型' : '服务名称')

const getBusinessName = (item) => item?.serviceName || item?.businessName || (item?.orderType === 2 ? '宠物领养' : '未知服务')

const getBusinessStatusText = (item) => {
  if (item?.businessStatusText) return item.businessStatusText
  if (item?.orderType === 1) return formatAppointmentStatus(item?.appointmentStatus)
  if (item?.orderType === 2) return formatAdoptionStatus(item?.adoptionStatus)
  return '处理中'
}

const getBusinessStatusTagType = (item) => {
  const status = item?.businessStatus
  if (item?.orderType === 1) {
    if (status === 1) return 'primary'
    if (status === 2) return 'success'
    if (status === 3) return 'info'
    return 'info'
  }
  if (item?.orderType === 2) {
    if (status === 1) return 'warning'
    if (status === 2) return 'primary'
    if (status === 3) return 'danger'
    if (status === 4) return 'success'
    if (status === 5) return 'info'
  }
  return 'info'
}

const orderStepStatus = (payStatus, index) => {
  if (payStatus === 1) return 'success'
  return index === 0 ? 'process' : 'wait'
}

const handleSearch = () => {
  page.value = 1
  fetchOrders()
}

const handleStatusChange = () => {
  page.value = 1
  fetchOrders()
}

const handleTypeChange = () => {
  page.value = 1
  fetchOrders()
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (currentStatus.value !== null) params.payStatus = currentStatus.value
    if (currentType.value !== null) params.orderType = currentType.value
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    const res = await getMyOrders(params)
    if (res.code === 200) {
      orders.value = res.data?.records || []
      total.value = res.data?.total || 0
    }
  } catch (e) {
    console.error('获取订单列表失败', e)
  } finally {
    loading.value = false
  }
}

const handlePay = (item) => {
  if (item?.canPay === false) return
  detailVisible.value = false
  router.push({ path: '/checkout', query: { orderId: item.id } })
}

const goBusinessDetail = (item) => {
  detailVisible.value = false
  if (item?.orderType === 1) {
    router.push('/my-appointments')
    return
  }
  if (item?.orderType === 2) {
    router.push('/my-adoptions')
  }
}

const openDetail = async (item) => {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res = await getOrderDetail(item.id)
    if (res.code === 200) {
      detail.value = res.data
    } else {
      detailVisible.value = false
    }
  } catch (e) {
    console.error(e)
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => fetchOrders())
</script>

<style scoped>
.my-orders-page {
  padding-bottom: 24px;
}

.orders-hero {
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

.orders-panel {
  padding: 28px;
  border-radius: var(--radius-lg);
}

.orders-heading {
  margin-bottom: 22px;
  align-items: flex-start;
  gap: 12px;
}

.orders-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-left: auto;
}

.orders-heading h2 {
  margin: 8px 0 10px;
  font-size: 26px;
}

.orders-heading p {
  margin: 0;
  color: var(--ink-body);
}

.filter-shell {
  background: var(--surface-soft);
  padding: 6px;
  border-radius: 999px;
  flex-shrink: 0;
}

.orders-search {
  width: 320px;
}

.orders-search :deep(.el-input__wrapper) {
  border-radius: 999px;
  border: 1px solid rgba(65, 90, 130, 0.15);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.orders-search :deep(.el-input-group__append) {
  padding: 0;
  background: transparent;
  border: none !important;
  box-shadow: none !important;
}

.orders-search :deep(.el-input-group__append .el-button) {
  height: 40px;
  min-width: 82px;
  margin: 0;
  padding: 0 20px;
  border-radius: 999px;
  border: none !important;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: var(--surface-strong);
  border-radius: var(--radius-md);
  border: 1px solid var(--line-soft);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(241, 245, 251, 0.8);
  border-bottom: 1px solid var(--line-soft);
}

.order-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.order-card-header strong {
  font-size: 15px;
  color: var(--ink-strong);
}

.order-no {
  display: block;
  font-size: 12px;
  color: var(--ink-muted);
  margin-bottom: 2px;
}

.status-tag {
  border-radius: 999px;
}

.order-card-body {
  padding: 18px 20px;
}

.header-statuses {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.order-summary-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.summary-copy {
  min-width: 0;
}

.summary-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink-strong);
}

.summary-subtitle {
  margin-top: 4px;
  color: var(--ink-muted);
  font-size: 13px;
}

.summary-amount {
  flex-shrink: 0;
  font-size: 24px;
  line-height: 1;
  font-weight: 800;
  color: #d9534f;
}

.order-info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px 18px;
}

.order-info-item .label {
  font-size: 12px;
  color: var(--ink-muted);
  display: block;
  margin-bottom: 2px;
}

.order-info-item .value {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-strong);
}

.order-info-item .value.price {
  color: #d9534f;
  font-size: 16px;
}

.order-note {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(236, 169, 64, 0.12);
  color: #9f6a1e;
  font-size: 13px;
}

.order-card-footer {
  padding: 12px 20px 18px;
  border-top: 1px solid var(--line-soft);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pay-icon {
  margin-right: 4px;
}

.empty-actions {
  display: flex;
  gap: 12px;
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
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--surface-soft);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item.full {
  grid-column: 1 / -1;
}

.detail-item span {
  font-size: 12px;
  color: var(--ink-muted);
}

@media (max-width: 960px) {
  .orders-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .orders-panel {
    padding: 22px;
  }

  .order-info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .orders-heading {
    gap: 12px;
  }

  .orders-toolbar {
    width: 100%;
    justify-content: flex-start;
  }

  .filter-shell {
    width: 100%;
  }

  .orders-search {
    width: 100%;
  }

  .order-card-header {
    align-items: flex-start;
    gap: 12px;
  }

  .order-summary-row {
    flex-direction: column;
  }

  .order-info-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .empty-actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>
