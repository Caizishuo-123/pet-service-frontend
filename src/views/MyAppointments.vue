<template>
  <div class="appointments-page page-shell">
    <section class="page-hero appointments-hero">
      <div class="hero-copy">
        <span class="page-kicker">我的预约</span>
        <h1 class="page-title">查看你的服务预约</h1>
        <p class="page-desc">管理服务时间、宠物信息与预约状态，安排更清晰。</p>
      </div>
      <div class="hero-tags">
        <span class="soft-chip">支持状态筛选</span>
        <span class="soft-chip">可快速取消预约</span>
      </div>
    </section>

    <section class="surface-panel appointments-panel">
      <div class="section-heading appointments-heading">
        <div>
          <h2>预约记录</h2>
          <p>聚焦服务与时间信息，快速确认安排。</p>
        </div>
        <div class="filter-shell">
          <el-radio-group v-model="currentStatus" @change="handleStatusChange" size="large">
            <el-radio-button :value="null">全部</el-radio-button>
            <el-radio-button :value="1">已预约</el-radio-button>
            <el-radio-button :value="2">已完成</el-radio-button>
            <el-radio-button :value="3">已取消</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div v-if="loading" class="loading-area">
        <el-skeleton :rows="5" animated />
      </div>

      <template v-else>
        <div v-if="appointments.length" class="appointment-list">
          <article class="appointment-card" v-for="item in appointments" :key="item.id">
            <div class="card-left">
              <img v-if="item.petImage" :src="getCosUrl(item.petImage)" class="pet-avatar"
                @error="(e) => e.target.src = 'https://via.placeholder.com/60?text=pet'" />
              <div v-else class="pet-avatar-placeholder">宠</div>
            </div>
            <div class="card-body">
              <div class="card-row-top">
                <h4 class="card-title">{{ item.serviceName || '未知服务' }}</h4>
                <el-tag :type="statusTagType(item.status)" size="small" class="status-tag">
                  {{ statusLabel(item.status) }}
                </el-tag>
              </div>
              <p class="card-info">
                <span>宠物 · {{ item.petName || '未知宠物' }}</span>
                <span v-if="item.servicePrice">费用 · ¥{{ item.servicePrice }}</span>
              </p>
              <p class="card-time" v-if="item.appointmentTime">
                预约时间 · {{ formatTime(item.appointmentTime) }}
              </p>
              <p class="card-remark" v-if="item.remark">备注 · {{ item.remark }}</p>
            </div>
            <div class="card-actions">
              <el-button v-if="item.status === 1" type="danger" size="small" plain @click="handleCancel(item)">
                取消预约
              </el-button>
            </div>
          </article>
        </div>

        <el-empty v-else description="暂无预约记录" :image-size="120">
          <el-button type="primary" @click="router.push('/services')">去预约服务</el-button>
        </el-empty>
      </template>
    </section>

    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next"
        @current-change="fetchAppointments" background />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyAppointments, cancelAppointment } from '@/api/appointment'
import { getCosUrl } from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const appointments = ref([])
const total = ref(0)
const loading = ref(false)
const currentStatus = ref(null)
const page = ref(1)
const pageSize = 10

const statusLabel = (s) => {
  const map = { 1: '已预约', 2: '已完成', 3: '已取消' }
  return map[s] || '未知'
}

const statusTagType = (s) => {
  const map = { 1: 'primary', 2: 'success', 3: 'info' }
  return map[s] || 'info'
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const handleStatusChange = () => {
  page.value = 1
  fetchAppointments()
}

const fetchAppointments = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (currentStatus.value) params.status = currentStatus.value
    const res = await getMyAppointments(params)
    if (res.code === 200) {
      appointments.value = res.data?.records || []
      total.value = res.data?.total || 0
    }
  } catch (e) {
    console.error('获取预约列表失败', e)
  } finally {
    loading.value = false
  }
}

const handleCancel = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消「${item.serviceName}」的预约吗？`,
      '取消预约',
      { confirmButtonText: '确认取消', cancelButtonText: '返回', type: 'warning' }
    )
  } catch {
    return
  }

  try {
    const res = await cancelAppointment(item.id)
    if (res.code === 200) {
      ElMessage.success('已取消预约')
      fetchAppointments()
    } else {
      ElMessage.error(res.message || '取消失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '取消失败，请稍后重试')
  }
}

onMounted(() => fetchAppointments())
</script>

<style scoped>
.appointments-page {
  padding-bottom: 24px;
}

.appointments-hero {
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

.appointments-panel {
  padding: 28px;
  border-radius: var(--radius-lg);
}

.appointments-heading {
  margin-bottom: 22px;
  align-items: flex-start;
}

.appointments-heading h2 {
  margin: 8px 0 10px;
  font-size: 26px;
}

.appointments-heading p {
  margin: 0;
  color: var(--ink-body);
}

.filter-shell {
  background: var(--surface-soft);
  padding: 6px;
  border-radius: 999px;
}

/* ========== Appointment Cards ========== */
.appointment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.appointment-card {
  background: var(--surface-strong);
  border-radius: var(--radius-md);
  padding: 20px 22px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid var(--line-soft);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.appointment-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-left {
  flex-shrink: 0;
}

.pet-avatar {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  object-fit: cover;
  box-shadow: 0 10px 22px rgba(37, 54, 74, 0.12);
}

.pet-avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--surface-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
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
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-strong);
}

.status-tag {
  border-radius: 999px;
}

.card-info {
  font-size: 13px;
  color: var(--ink-body);
  display: flex;
  gap: 16px;
  margin-bottom: 4px;
}

.card-time {
  font-size: 13px;
  color: var(--ink-muted);
  margin-bottom: 2px;
}

.card-remark {
  font-size: 12px;
  color: var(--ink-muted);
}

.card-actions {
  flex-shrink: 0;
}

.loading-area {
  padding: 40px 0;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 24px 0 16px;
}

@media (max-width: 960px) {
  .appointments-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .appointments-panel {
    padding: 22px;
  }

  .appointment-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-row-top {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .appointments-heading {
    gap: 12px;
  }

  .filter-shell {
    width: 100%;
  }

  .card-info {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
