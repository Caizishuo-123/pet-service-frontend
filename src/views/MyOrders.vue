<template>
  <div class="my-orders-page page-shell">
    <section class="page-hero orders-hero">
      <div class="hero-copy">
        <span class="page-kicker">我的订单</span>
        <h1 class="page-title">管理你的服务订单</h1>
        <p class="page-desc">查看支付状态、服务信息与时间记录，订单一目了然。</p>
      </div>
      <div class="hero-tags">
        <span class="soft-chip">支持筛选支付状态</span>
        <span class="soft-chip">订单信息自动同步</span>
      </div>
    </section>

    <section class="surface-panel orders-panel">
      <div class="section-heading orders-heading">
        <div>
          <h2>订单列表</h2>
          <p>按状态查看订单，支付记录与服务信息更清楚。</p>
        </div>
        <div class="filter-shell">
          <el-radio-group v-model="currentStatus" @change="handleStatusChange" size="large">
            <el-radio-button :value="null">全部</el-radio-button>
            <el-radio-button :value="0">待支付</el-radio-button>
            <el-radio-button :value="1">已支付</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div v-if="loading" class="loading-area">
        <el-skeleton :rows="5" animated />
      </div>

      <template v-else>
        <div v-if="orders.length" class="order-list">
          <article class="order-card" v-for="item in orders" :key="item.id">
            <header class="order-card-header">
              <div>
                <span class="order-no">订单号</span>
                <strong>{{ item.id }}</strong>
              </div>
              <el-tag :type="item.payStatus === 1 ? 'success' : 'warning'" size="small" class="status-tag">
                {{ item.payStatus === 1 ? '已支付' : '待支付' }}
              </el-tag>
            </header>

            <div class="order-card-body">
              <div class="order-info-grid">
                <div class="order-info-item">
                  <span class="label">服务名称</span>
                  <span class="value">{{ item.serviceName || '未知服务' }}</span>
                </div>
                <div class="order-info-item">
                  <span class="label">宠物</span>
                  <span class="value">{{ item.petName || '未知宠物' }}</span>
                </div>
                <div class="order-info-item">
                  <span class="label">订单金额</span>
                  <span class="value price">¥{{ item.totalPrice || '0.00' }}</span>
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
            </div>

            <footer class="order-card-footer" v-if="item.payStatus === 0">
              <el-button type="primary" size="small" @click="handlePay(item)">
                <span class="pay-icon">支付</span> 去支付
              </el-button>
            </footer>
          </article>
        </div>

        <el-empty v-else description="暂无订单" :image-size="120">
          <el-button type="primary" @click="$router.push('/services')">去预约服务</el-button>
        </el-empty>
      </template>
    </section>

    <div class="pagination-wrap" v-if="total > pageSize">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next"
        @current-change="fetchOrders" background />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyOrders } from '@/api/order'

const router = useRouter()
const orders = ref([])
const total = ref(0)
const loading = ref(false)
const currentStatus = ref(null)
const page = ref(1)
const pageSize = 10

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const handleStatusChange = () => {
  page.value = 1
  fetchOrders()
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (currentStatus.value !== null) params.payStatus = currentStatus.value
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
  router.push({ path: '/checkout', query: { orderId: item.id } })
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
}

/* ========== Order Cards ========== */
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

/* ========== Other ========== */
.loading-area {
  padding: 40px 0;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 24px 0 16px;
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

  .filter-shell {
    width: 100%;
  }

  .order-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
