<template>
  <div class="checkout-page" v-loading.fullscreen.lock="paying" element-loading-text="正在安全支付中..."
    element-loading-background="rgba(255, 255, 255, 0.9)">

    <div class="page-header">
      <el-button text @click="router.back()">
        <el-icon>
          <ArrowLeft />
        </el-icon> 返回订单
      </el-button>
      <h2>收银台</h2>
      <div style="width: 80px"></div> <!-- 占位保持居中 -->
    </div>

    <template v-if="order">
      <div v-if="success" class="success-result">
        <div class="success-icon">
          <el-icon><Select /></el-icon>
        </div>
        <h2 class="success-title">支付成功</h2>
        <p class="success-desc">您的订单已支付完成，服务人员将尽快与您联系。</p>
        <div class="success-amount">¥{{ order.totalPrice || '0.00' }}</div>
        <p class="countdown-text">{{ countdown }} 秒后自动返回订单列表...</p>
        <el-button type="primary" round @click="router.replace('/my-orders')" style="margin-top:20px;width:160px">
          立即查看订单
        </el-button>
      </div>

      <div v-else class="checkout-container">
        <!-- 订单金额与信息 -->
        <div class="order-summary-card">
          <div class="amount-wrap">
            <span class="currency">¥</span>
            <span class="amount">{{ order.totalPrice || '0.00' }}</span>
          </div>
          <p class="order-no-text">订单编号：{{ order.id }}</p>

          <el-divider border-style="dashed" />

          <div class="order-detail-list">
            <div class="detail-row">
              <span class="label">服务名称</span>
              <span class="value">{{ order.serviceName || '未知服务' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">服务宠物</span>
              <span class="value">{{ order.petName || '未知宠物' }}</span>
            </div>
            <div class="detail-row" v-if="order.createTime">
              <span class="label">创建时间</span>
              <span class="value">{{ formatTime(order.createTime) }}</span>
            </div>
          </div>
        </div>

        <!-- 支付方式选择 -->
        <div class="payment-methods">
          <h3 class="section-title">选择支付方式</h3>

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

        <!-- 支付按钮 -->
        <div class="pay-action">
          <el-button type="primary" size="large" class="pay-btn" @click="handlePay">
            确认支付 ¥{{ order.totalPrice || '0.00' }}
          </el-button>
          <p class="safe-tip">
            <el-icon>
              <Lock />
            </el-icon> 平台担保交易，您的资金安全无忧
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

const payMethod = ref(1) // 1 微信, 2 支付宝
const paying = ref(false)
const success = ref(false)
const countdown = ref(3)
let timer = null

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
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
      // 如果已经支付过，直接显示成功状态或者跳回
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

  // 1. 弹出遮罩层（全屏 Loading），显示正在支付...
  paying.value = true

  // 2. 模拟真实的网络处理延迟 (沉浸式体验)
  setTimeout(async () => {
    try {
      const res = await simulatePay(order.value.id, payMethod.value)
      if (res.code === 200) {
        paying.value = false
        success.value = true // 切换为成功付款界面

        // 倒计时跳回列表
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
  }, 1800) // 延迟1.8s
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

/* ========== Order Summary ========== */
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
  align-items: center;
  font-size: 14px;
}

.detail-row .label {
  color: #909399;
}

.detail-row .value {
  font-weight: 600;
  color: #303133;
}

/* ========== Payment Methods ========== */
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
  border-color: #409EFF;
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

/* ========== Actions ========== */
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

/* ========== Success ========== */
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
</style>
