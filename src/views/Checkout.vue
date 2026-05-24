<template>
  <div
    class="checkout-page"
    v-loading.fullscreen.lock="paying"
    element-loading-text="正在处理模拟支付..."
    element-loading-background="rgba(255, 255, 255, 0.9)"
  >
    <div class="page-header">
      <el-button text @click="router.back()">
        <el-icon>
          <ArrowLeft />
        </el-icon>
        返回订单
      </el-button>
      <h2>收银台</h2>
      <div style="width: 80px"></div>
    </div>

    <template v-if="order">
      <div v-if="success" class="success-result">
        <div class="success-icon">
          <el-icon><Select /></el-icon>
        </div>
        <h2 class="success-title">支付成功</h2>
        <p class="success-desc">{{ getSuccessDescription(order) }}</p>
        <div class="success-amount">¥{{ formatPrice(order.totalPrice) }}</div>
        <p class="countdown-text">{{ countdown }} 秒后自动返回订单列表...</p>
        <div class="success-actions">
          <el-button type="primary" round @click="router.replace('/my-orders')">
            立即查看订单
          </el-button>
          <el-button v-if="order.orderType === 2" round plain @click="router.replace('/my-pets')">
            查看我的宠物
          </el-button>
          <el-button v-if="order.orderType === 1" round plain @click="router.replace('/my-appointments')">
            查看我的预约
          </el-button>
        </div>
      </div>

      <div v-else class="checkout-container">
        <div class="order-summary-card">
          <div class="amount-wrap">
            <span class="currency">¥</span>
            <span class="amount">{{ formatPrice(order.totalPrice) }}</span>
          </div>
          <p class="order-no-text">订单编号：{{ order.orderNo || order.id }}</p>

          <el-divider border-style="dashed" />

          <div class="order-detail-list">
            <div class="detail-row">
              <span class="label">订单类型</span>
              <span class="value">{{ getOrderTypeText(order) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ getBusinessLabel(order.orderType) }}</span>
              <span class="value">{{ getBusinessName(order) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">业务状态</span>
              <span class="value">{{ getBusinessStatusText(order) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">关联宠物</span>
              <span class="value">{{ order.petName || '未知宠物' }}</span>
            </div>
            <div class="detail-row" v-if="order.orderType === 1 && order.appointmentTime">
              <span class="label">预约时间</span>
              <span class="value">{{ formatTime(order.appointmentTime) }}</span>
            </div>
            <div class="detail-row" v-if="order.orderType === 2">
              <span class="label">领取方式</span>
              <span class="value">{{ formatDeliveryType(order.deliveryType) }}</span>
            </div>
            <div class="detail-row" v-if="order.orderType === 2 && order.contactPhone">
              <span class="label">联系电话</span>
              <span class="value">{{ order.contactPhone }}</span>
            </div>
            <div class="detail-row" v-if="order.orderType === 2 && order.address">
              <span class="label">送达地址</span>
              <span class="value">{{ order.address }}</span>
            </div>
            <div class="detail-row" v-if="order.orderType === 2 && order.applyReason">
              <span class="label">申请理由</span>
              <span class="value multiline">{{ order.applyReason }}</span>
            </div>
            <div class="detail-row" v-if="order.createTime">
              <span class="label">创建时间</span>
              <span class="value">{{ formatTime(order.createTime) }}</span>
            </div>
          </div>
        </div>

        <div class="payment-methods">
          <h3 class="section-title">选择支付方式</h3>
          <div v-if="order.canPay === false && order.cannotPayReason" class="checkout-alert">
            当前订单不可支付：{{ order.cannotPayReason }}
          </div>

          <div class="method-card" :class="{ active: payMethod === 1 }" @click="payMethod = 1">
            <div class="method-left">
              <div class="method-icon wechat">
                <el-icon>
                  <ChatDotRound />
                </el-icon>
              </div>
              <div class="method-info">
                <h4>微信支付</h4>
                <p>亿万用户的选择，更快更安全</p>
              </div>
            </div>
            <div class="method-right">
              <el-radio :value="1" v-model="payMethod" />
            </div>
          </div>

          <div class="method-card" :class="{ active: payMethod === 2 }" @click="payMethod = 2">
            <div class="method-left">
              <div class="method-icon alipay">
                <el-icon>
                  <Wallet />
                </el-icon>
              </div>
              <div class="method-info">
                <h4>支付宝</h4>
                <p>数亿用户都在用，安全可托付</p>
              </div>
            </div>
            <div class="method-right">
              <el-radio :value="2" v-model="payMethod" />
            </div>
          </div>
        </div>

        <div class="pay-action">
          <el-button type="primary" size="large" class="pay-btn" :disabled="order.canPay === false" @click="handlePay">
            确认支付 ¥{{ formatPrice(order.totalPrice) }}
          </el-button>
          <p class="safe-tip">
            <el-icon>
              <Lock />
            </el-icon>
            当前为模拟支付演示流程，确认后将直接更新订单状态
          </p>
        </div>
      </div>
    </template>

    <div v-else-if="loading" class="loading-state">
      <el-skeleton :rows="6" animated />
    </div>

    <el-empty v-else description="订单不可访问或已过期" :image-size="120">
      <el-button type="primary" @click="router.replace('/my-orders')">返回我的订单</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderDetail, simulatePay } from '@/api/order'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Select, ChatDotRound, Wallet, Lock } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)

const payMethod = ref(1)
const paying = ref(false)
const success = ref(false)
const countdown = ref(3)
let timer = null

const orderTypeMap = {
  1: '服务预约',
  2: '领养支付'
}

const deliveryTypeMap = {
  1: '上门自取',
  2: '送宠上门'
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

const getOrderTypeText = (item) => item?.orderTypeName || orderTypeMap[item?.orderType] || '普通订单'

const getBusinessLabel = (orderType) => (orderType === 2 ? '业务类型' : '服务名称')

const getBusinessName = (item) => item?.serviceName || item?.businessName || (item?.orderType === 2 ? '宠物领养' : '未知服务')

const getBusinessStatusText = (item) => {
  if (item?.businessStatusText) return item.businessStatusText
  if (item?.orderType === 1) {
    const map = { 1: '已预约', 2: '已完成', 3: '已取消' }
    return map[item?.appointmentStatus] || '处理中'
  }
  if (item?.orderType === 2) {
    const map = { 1: '待审核', 2: '待支付', 3: '已拒绝', 4: '已完成', 5: '已取消' }
    return map[item?.adoptionStatus] || '处理中'
  }
  return '处理中'
}

const getSuccessDescription = (item) => {
  if (item?.orderType === 2) {
    return '领养订单已支付完成，宠物已加入我的宠物。'
  }
  return '您的订单已支付完成，服务人员将尽快与您联系。'
}

const fetchOrder = async () => {
  const orderId = route.query.orderId
  if (!orderId) {
    loading.value = false
    return
  }
  try {
    const res = await getOrderDetail(orderId)
    if (res.code === 200) {
      order.value = res.data
      if (order.value.payStatus === 1) {
        ElMessage.info('该订单已完成支付')
        router.replace('/my-orders')
      }
    }
  } catch (e) {
    console.error('获取订单失败', e)
    ElMessage.error('无法获取订单信息')
  } finally {
    loading.value = false
  }
}

const handlePay = async () => {
  if (!order.value) return
  if (order.value.canPay === false) {
    ElMessage.warning(order.value.cannotPayReason || '当前订单不可支付')
    return
  }

  paying.value = true

  setTimeout(async () => {
    try {
      const res = await simulatePay(order.value.id, payMethod.value)
      if (res.code === 200) {
        paying.value = false
        success.value = true

        timer = setInterval(() => {
          countdown.value--
          if (countdown.value <= 0) {
            clearInterval(timer)
            router.replace('/my-orders')
          }
        }, 1000)
      } else {
        paying.value = false
        ElMessage.error(res.message || '支付失败')
      }
    } catch (e) {
      paying.value = false
      ElMessage.error(e.response?.data?.message || '支付异常，请重试')
    }
  }, 1800)
}

onMounted(() => fetchOrder())

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.checkout-page {
  max-width: 600px;
  margin: 0 auto;
  min-height: calc(100vh - 200px);
  padding-top: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.checkout-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.order-summary-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.amount-wrap {
  color: #303133;
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.amount-wrap .currency {
  font-size: 24px;
  font-weight: 600;
}

.amount-wrap .amount {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -1px;
}

.order-no-text {
  font-size: 14px;
  color: #909399;
  margin-bottom: 24px;
}

.order-detail-list {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  font-size: 14px;
}

.detail-row .label {
  color: #909399;
  flex-shrink: 0;
}

.detail-row .value {
  font-weight: 600;
  color: #303133;
  text-align: right;
}

.detail-row .value.multiline {
  white-space: pre-wrap;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 16px;
}

.payment-methods {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.checkout-alert {
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(236, 169, 64, 0.12);
  color: #9f6a1e;
  font-size: 13px;
}

.method-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 12px;
}

.method-card:last-child {
  margin-bottom: 0;
}

.method-card:hover {
  background: #f0f2f5;
}

.method-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.method-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.method-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.method-icon.wechat {
  background: #07c160;
}

.method-icon.alipay {
  background: #1677ff;
}

.method-info h4 {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.method-info p {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.pay-action {
  text-align: center;
  margin-top: 10px;
}

.pay-btn {
  width: 100%;
  height: 54px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 27px;
  box-shadow: 0 8px 16px rgba(64, 158, 255, 0.2);
  transition: all 0.3s ease;
}

.pay-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(64, 158, 255, 0.3);
}

.safe-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
  margin-top: 16px;
}

.success-result {
  background: #fff;
  border-radius: 16px;
  padding: 60px 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  text-align: center;
  animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f0f9eb;
  color: #67c23a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin-bottom: 24px;
}

.success-title {
  font-size: 24px;
  font-weight: 800;
  color: #303133;
  margin-bottom: 12px;
}

.success-desc {
  font-size: 15px;
  color: #606266;
  margin-bottom: 8px;
}

.success-amount {
  font-size: 32px;
  font-weight: 800;
  color: #303133;
  margin: 24px 0;
}

.countdown-text {
  font-size: 13px;
  color: #909399;
}

.success-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.success-actions .el-button {
  min-width: 140px;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.loading-state {
  padding: 40px;
  background: #fff;
  border-radius: 16px;
}

@media (max-width: 640px) {
  .detail-row {
    flex-direction: column;
    gap: 4px;
  }

  .detail-row .value {
    text-align: left;
  }
}
</style>
