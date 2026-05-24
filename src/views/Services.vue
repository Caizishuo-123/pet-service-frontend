<template>
  <div class="services-page page-shell">
    <section class="page-hero list-hero">
      <div>
        <span class="page-kicker">Pet Service</span>
        <h1 class="page-title">宠物服务</h1>
        <!-- <p class="page-desc">预约美容、洗护、医疗、寄养等宠物服务，选择合适时间后即可在线下单。</p> -->
      </div>
      <div class="hero-summary-grid">
        <article class="hero-summary-card">
          <strong>{{ total }}</strong>
          <span>服务项目数量</span>
        </article>
        <article class="hero-summary-card">
          <strong>6</strong>
          <span>服务分类</span>
        </article>
      </div>
    </section>

    <section class="section-block surface-panel filter-panel list-filter-panel">
      <div class="filter-group">
        <div class="filter-row">
          <span class="filter-label">服务类型</span>
          <el-select v-model="currentType" class="type-select" placeholder="全部类型" clearable @change="handleTypeChange">
            <el-option label="全部类型" :value="null" />
            <el-option v-for="item in serviceTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div class="filter-row">
          <span class="filter-label">价格区间</span>
          <div class="range-inputs">
            <el-input-number v-model="priceMin" :min="0" :max="9999" controls-position="right" @change="handleSearch" />
            <span class="range-sep">至</span>
            <el-input-number v-model="priceMax" :min="0" :max="9999" controls-position="right" @change="handleSearch" />
            <span class="range-unit">元</span>
          </div>
        </div>
        <div class="filter-row">
          <span class="filter-label">排序方式</span>
          <el-select v-model="sort" class="sort-select" placeholder="默认排序" @change="handleSearch">
            <el-option label="默认排序" value="" />
            <el-option label="价格从低到高" value="priceAsc" />
            <el-option label="价格从高到低" value="priceDesc" />
          </el-select>
        </div>
      </div>
      <div class="filter-actions">
        <el-input
          class="search-input"
          v-model="keyword"
          placeholder="搜索服务名称或描述"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
    </section>

    <div v-if="loading" class="section-block surface-panel loading-panel">
      <el-skeleton :rows="5" animated />
    </div>

    <section v-else class="section-block">
      <div v-if="services.length" class="list-grid service-list-grid">
        <article v-for="svc in services" :key="svc.id" class="list-card service-card" @click="openDetail(svc)">
          <div class="list-card-media service-media">
            <img
              v-if="svc.imageUrl"
              :src="getCosUrl(svc.imageUrl)"
              :alt="svc.name"
              @error="setImageFallback($event, servicePlaceholder)"
            />
            <div v-else class="service-placeholder">{{ typeLabel(svc.type) }}</div>
          </div>
          <div class="list-card-body service-card-body">
            <div class="list-card-title-row">
              <h3>{{ svc.name }}</h3>
              <strong class="price-text">¥{{ svc.price }}</strong>
            </div>
            <div class="service-facts-row">
              <span>{{ typeLabel(svc.type) }}</span>
              <span>{{ svc.duration ? `${svc.duration} 分钟` : '时长待确认' }}</span>
              <span>{{ svc.contactPhone || '电话待确认' }}</span>
            </div>
            <p class="list-card-desc">{{ svc.description || '可在线预约，服务人员会按预约时间为宠物提供照护。' }}</p>
            <div class="list-card-meta-row">
              <span>查看详情</span>
              <span>立即预约</span>
            </div>
          </div>
        </article>
      </div>

      <el-empty v-else class="surface-panel empty-panel" description="暂无可用服务" :image-size="110" />
    </section>

    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
        background
      />
    </div>

    <el-dialog
      v-model="showDetail"
      :title="currentService?.name"
      width="760px"
      class="service-book-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="currentService" class="detail-panel detail-panel-split">
        <section class="detail-info-column">
          <div class="detail-media">
            <img
              v-if="currentService.imageUrl"
              :src="getCosUrl(currentService.imageUrl)"
              :alt="currentService.name"
              @error="setImageFallback($event, servicePlaceholder)"
            />
            <div v-else class="detail-placeholder">{{ typeLabel(currentService.type) }}</div>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span>服务类型</span>
              <strong>{{ typeLabel(currentService.type) }}</strong>
            </div>
            <div class="detail-item">
              <span>价格</span>
              <strong class="price">¥{{ currentService.price }}</strong>
            </div>
            <div v-if="currentService.duration" class="detail-item">
              <span>服务时长</span>
              <strong>{{ currentService.duration }} 分钟</strong>
            </div>
            <div v-if="currentService.contactPhone" class="detail-item">
              <span>联系电话</span>
              <strong>{{ currentService.contactPhone }}</strong>
            </div>
          </div>

          <p v-if="currentService.description" class="detail-desc">{{ currentService.description }}</p>
        </section>

        <section class="book-form-column">
          <h3>预约信息</h3>
          <el-form ref="bookFormRef" :model="bookForm" :rules="bookRules" label-position="top">
            <el-form-item label="选择宠物" prop="petId">
              <el-select
                v-model="bookForm.petId"
                placeholder="请选择您的宠物"
                style="width: 100%"
                :loading="petsLoading"
                @focus="loadMyPets"
              >
                <el-option v-for="pet in myPets" :key="pet.id" :label="pet.name" :value="pet.id">
                  <span>{{ pet.name }}（{{ pet.breed || '未知品种' }}）</span>
                </el-option>
                <template #empty>
                  <div class="select-empty">暂无宠物，请先到“我的宠物”页面添加</div>
                </template>
              </el-select>
            </el-form-item>

            <el-form-item label="预约时间" prop="appointmentTime">
              <el-date-picker
                v-model="bookForm.appointmentTime"
                type="datetime"
                placeholder="请选择预约时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                :disabled-date="disabledDate"
                :disabled-time="disabledTime"
              />
            </el-form-item>

            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="bookForm.remark"
                type="textarea"
                :rows="4"
                maxlength="200"
                show-word-limit
                placeholder="可填写特殊需求，选填"
              />
            </el-form-item>
          </el-form>
        </section>
      </div>

      <template #footer>
        <el-button @click="showDetail = false">取消</el-button>
        <el-button type="primary" :loading="booking" @click="handleBook">确认预约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createAppointment } from '@/api/appointment'
import { getMyPets } from '@/api/pet'
import { getServiceDetail, getServicePage } from '@/api/service'
import { getCosUrl } from '@/utils/request'
import { createSvgPlaceholder } from '@/utils/placeholders'

const route = useRoute()
const router = useRouter()
const services = ref([])
const total = ref(0)
const loading = ref(false)
const currentType = ref(null)
const page = ref(1)
const pageSize = 9
const keyword = ref('')
const priceMin = ref(null)
const priceMax = ref(null)
const sort = ref('')
const serviceTypes = [
  { value: 1, label: '美容' },
  { value: 2, label: '洗护' },
  { value: 3, label: '医疗' },
  { value: 4, label: '寄养' },
  { value: 5, label: '训练' },
  { value: 6, label: '接送' }
]

const showDetail = ref(false)
const currentService = ref(null)
const booking = ref(false)
const bookFormRef = ref(null)
const myPets = ref([])
const petsLoading = ref(false)

const servicePlaceholder = createSvgPlaceholder('CARE', '#e8eff9', '#416894', 800, 420)

const bookForm = reactive({
  petId: null,
  appointmentTime: '',
  remark: ''
})

const bookRules = {
  petId: [{ required: true, message: '请选择宠物', trigger: 'change' }],
  appointmentTime: [{ required: true, message: '请选择预约时间', trigger: 'change' }]
}

const typeLabel = (type) => {
  const map = {
    1: '美容',
    2: '洗护',
    3: '医疗',
    4: '寄养',
    5: '训练',
    6: '接送'
  }
  return map[type] || '服务'
}

const truncate = (text, length) => {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length)}...` : text
}

const setImageFallback = (event, fallback) => {
  if (event?.target && event.target.src !== fallback) {
    event.target.src = fallback
  }
}

const getStartOfToday = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

const disabledDate = (date) => date.getTime() < getStartOfToday()

const disabledTime = (date) => {
  if (!date) return {}
  const now = new Date()
  const isSameDay = date.toDateString() === now.toDateString()
  if (!isSameDay) return {}

  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  return {
    disabledHours: () => Array.from({ length: currentHour }, (_, i) => i),
    disabledMinutes: (hour) => (hour === currentHour ? Array.from({ length: currentMinute + 1 }, (_, i) => i) : []),
    disabledSeconds: () => []
  }
}

const normalizePriceRange = () => {
  if (priceMin.value !== null && priceMax.value !== null && priceMin.value > priceMax.value) {
    const temp = priceMin.value
    priceMin.value = priceMax.value
    priceMax.value = temp
  }
}

const handleTypeChange = () => {
  handleSearch()
}

const handleSearch = () => {
  page.value = 1
  normalizePriceRange()
  syncQuery()
}

const fetchServices = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (currentType.value) params.type = currentType.value
    if (keyword.value) params.keyword = keyword.value
    if (priceMin.value !== null && priceMin.value !== undefined) params.minPrice = priceMin.value
    if (priceMax.value !== null && priceMax.value !== undefined) params.maxPrice = priceMax.value
    if (sort.value) params.sort = sort.value

    const res = await getServicePage(params)
    if (res.code === 200) {
      services.value = res.data?.records || []
      total.value = res.data?.total || 0
    }
  } catch (error) {
    console.error('获取服务列表失败', error)
  } finally {
    loading.value = false
  }
}

const openServiceFromQuery = async (serviceId) => {
  const id = toNumber(serviceId)
  if (!id) return
  if (showDetail.value && Number(currentService.value?.id) === id) return

  let service = services.value.find((item) => Number(item.id) === id)
  if (!service) {
    try {
      const res = await getServiceDetail(id)
      if (res.code === 200) {
        service = res.data
      }
    } catch (error) {
      console.error('获取服务详情失败', error)
    }
  }

  if (service) {
    openDetail(service)
  }
}

const handlePageChange = () => {
  syncQuery()
}

const toNumber = (val) => {
  if (val === undefined || val === null || val === '') return null
  const num = Number(val)
  return Number.isFinite(num) ? num : null
}

const applyQuery = (query) => {
  currentType.value = toNumber(query.type)
  page.value = toNumber(query.page) || 1
  keyword.value = query.keyword || ''
  priceMin.value = toNumber(query.minPrice)
  priceMax.value = toNumber(query.maxPrice)
  sort.value = query.sort || ''
}

const syncQuery = () => {
  const query = {}
  if (currentType.value) query.type = String(currentType.value)
  if (keyword.value) query.keyword = keyword.value
  if (priceMin.value !== null && priceMin.value !== undefined) query.minPrice = String(priceMin.value)
  if (priceMax.value !== null && priceMax.value !== undefined) query.maxPrice = String(priceMax.value)
  if (sort.value) query.sort = sort.value
  if (page.value && page.value > 1) query.page = String(page.value)
  router.replace({ query })
}

const openDetail = (service) => {
  currentService.value = service
  bookForm.petId = null
  bookForm.appointmentTime = ''
  bookForm.remark = ''
  showDetail.value = true
}

const loadMyPets = async () => {
  if (myPets.value.length) return
  petsLoading.value = true
  try {
    const res = await getMyPets(1, 100)
    if (res.code === 200) {
      myPets.value = (res.data?.records || []).filter((pet) => pet.status === 1)
    }
  } catch (error) {
    console.error('获取宠物列表失败', error)
  } finally {
    petsLoading.value = false
  }
}

const handleBook = async () => {
  const valid = await bookFormRef.value?.validate().catch(() => false)
  if (!valid) return

  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: '/services' } })
    return
  }

  booking.value = true
  try {
    const res = await createAppointment({
      serviceId: currentService.value.id,
      petId: bookForm.petId,
      appointmentTime: bookForm.appointmentTime,
      remark: bookForm.remark
    })

    if (res.code === 200) {
      showDetail.value = false
      await showBookingSuccess(res.data)
    } else {
      ElMessage.error(res.message || '预约失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '预约失败，请稍后重试')
  } finally {
    booking.value = false
  }
}

const showBookingSuccess = async (data = {}) => {
  try {
    await ElMessageBox.confirm(
      '预约已创建，请完成订单支付。支付完成后，服务人员会按预约时间为您安排服务。',
      '预约成功',
      {
        type: 'success',
        confirmButtonText: '去支付',
        cancelButtonText: '查看我的预约',
        distinguishCancelAndClose: true
      }
    )
    if (data.orderId) {
      router.push({ path: '/checkout', query: { orderId: data.orderId } })
    } else {
      router.push('/my-orders')
    }
  } catch (action) {
    if (action === 'cancel') {
      router.push('/my-appointments')
    }
  }
}

watch(
  () => route.query,
  async (query) => {
    applyQuery(query)
    await fetchServices()
    await openServiceFromQuery(query.serviceId)
  },
  { immediate: true }
)
</script>

<style scoped>
.services-page {
  padding-bottom: 32px;
}

.list-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-end;
}

.hero-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 14px;
}

.hero-summary-card {
  min-height: 96px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  box-shadow: var(--shadow-sm);
}

.hero-summary-card strong {
  display: block;
  color: var(--brand-strong);
  font-size: 28px;
  line-height: 1;
}

.hero-summary-card span {
  display: block;
  margin-top: 8px;
  color: var(--ink-body);
  font-size: 13px;
}

.list-filter-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(232, 240, 252, 0.72), rgba(255, 255, 255, 0.98));
  border: 1px solid rgba(65, 90, 130, 0.08);
  box-shadow: 0 18px 36px rgba(37, 54, 74, 0.06);
}

.filter-group {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  padding: 6px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(65, 90, 130, 0.08);
  white-space: nowrap;
}

.type-select {
  width: 126px;
}

.sort-select {
  width: 150px;
}

.filter-row :deep(.el-select__wrapper) {
  min-height: 40px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 0 0 1px rgba(65, 90, 130, 0.14) inset;
}

.filter-row :deep(.el-select__selected-item) {
  color: var(--ink-body);
  font-weight: 400;
}

.range-inputs {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.range-inputs :deep(.el-input-number) {
  width: 104px;
}

.range-sep,
.range-unit {
  font-size: 12px;
  color: var(--ink-muted);
}

.filter-label {
  color: var(--ink-body);
  font-size: 14px;
  font-weight: 700;
}

.filter-actions {
  width: 310px;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.filter-actions :deep(.el-input__inner) {
  min-width: 0;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 999px;
  border: 1px solid rgba(65, 90, 130, 0.15);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.search-input :deep(.el-input-group__append) {
  border: none !important;
  border-left: none !important;
  padding: 0;
  background: transparent;
  box-shadow: none !important;
  display: flex;
  align-items: center;
}

.search-input :deep(.el-input-group__append .el-button) {
  height: 36px;
  margin: 4px;
  padding: 0 18px;
  border-radius: 999px;
  border: none !important;
  color: #fff;
  background: linear-gradient(135deg, #4e79be, #6a8fcb);
  box-shadow: 0 8px 18px rgba(78, 121, 190, 0.28);
}

.search-input :deep(.el-input-group__append .el-button:hover) {
  filter: brightness(0.96);
}

.search-input :deep(.el-input__inner) {
  height: 40px;
}

.loading-panel,
.empty-panel {
  border-radius: 22px;
  padding: 26px;
}

.list-grid {
  display: grid;
  gap: 20px;
}

.service-list-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.list-card {
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.list-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.list-card-media {
  background: var(--surface-soft);
}

.service-media {
  height: 210px;
}

.list-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.service-placeholder,
.detail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--brand-strong);
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #edf3fb, #f9fbff);
}

.list-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
}

.service-card-body {
  min-height: 136px;
}

.list-card-title-row,
.list-card-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.list-card-title-row h3,
.list-card-note,
.list-card-desc {
  margin: 0;
}

.list-card-title-row h3 {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-card-note {
  color: var(--brand-strong);
  font-size: 14px;
  font-weight: 600;
}

.list-card-desc {
  color: var(--ink-body);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-facts-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  color: var(--ink-muted);
  font-size: 13px;
}

.service-facts-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-card-meta-row span,
.price-text {
  color: var(--ink-muted);
  font-size: 13px;
}

.price-text {
  color: var(--brand-strong);
  font-size: 22px;
  font-weight: 700;
  white-space: nowrap;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 28px 0 8px;
}

.detail-panel {
  display: grid;
  gap: 12px;
  max-height: 64vh;
  overflow-y: auto;
  padding-right: 4px;
}

.detail-panel-split {
  grid-template-columns: minmax(0, 0.9fr) minmax(300px, 1fr);
  align-items: start;
}

.detail-info-column,
.book-form-column {
  display: grid;
  gap: 12px;
}

.book-form-column {
  padding: 14px;
  border-radius: 14px;
  background: var(--surface-soft);
}

.book-form-column h3 {
  margin: 0 0 2px;
  font-size: 18px;
}

.detail-media {
  overflow: hidden;
  border-radius: 14px;
  background: var(--surface-soft);
  height: 220px;
}

.detail-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.detail-item {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--surface-soft);
}

.detail-item span {
  display: block;
  margin-bottom: 4px;
  color: var(--ink-muted);
  font-size: 12px;
}

.detail-item strong {
  color: var(--ink-strong);
  font-size: 14px;
}

.detail-item .price {
  color: var(--brand-strong);
}

.detail-desc {
  margin: 0;
  color: var(--ink-body);
  line-height: 1.6;
  font-size: 14px;
}

.select-empty {
  padding: 12px;
  color: var(--ink-muted);
  text-align: center;
}

:deep(.service-book-dialog .el-dialog__body) {
  padding: 12px 20px;
}

:deep(.service-book-dialog .el-dialog__footer) {
  padding-top: 8px;
}

:deep(.service-book-dialog .el-divider) {
  margin: 8px 0 16px;
}

:deep(.service-book-dialog .el-form-item) {
  margin-bottom: 14px;
}

@media (max-width: 900px) {
  .detail-panel-split {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1080px) {
  .service-list-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .list-hero,
  .list-filter-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-actions {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .hero-summary-grid,
  .service-list-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .list-filter-panel {
    padding: 18px;
  }
}
</style>
