<template>
  <div class="services-page page-shell">
    <section class="page-hero list-hero">
      <div>
        <span class="page-kicker">Pet Service</span>
        <h1 class="page-title">宠物服务</h1>
        <p class="page-desc">页面结构和领养大厅保持一致：先看说明，再筛选，再浏览规整卡片，最后进入详情或预约。</p>
      </div>
      <div class="hero-summary-grid">
        <article class="hero-summary-card">
          <strong>{{ total }}</strong>
          <span>服务项目数量</span>
        </article>
        <article class="hero-summary-card">
          <strong>4</strong>
          <span>服务分类</span>
        </article>
      </div>
    </section>

    <section class="section-block surface-panel filter-panel list-filter-panel">
      <div class="filter-row">
        <span class="filter-label">服务类型</span>
        <el-radio-group v-model="currentType" @change="handleTypeChange">
          <el-radio-button :value="null">全部</el-radio-button>
          <el-radio-button :value="1">洗护</el-radio-button>
          <el-radio-button :value="2">美容</el-radio-button>
          <el-radio-button :value="3">医疗</el-radio-button>
          <el-radio-button :value="4">寄养</el-radio-button>
        </el-radio-group>
      </div>
      <span class="soft-chip">点击卡片查看详情并预约</span>
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
            <p class="list-card-note">{{ typeLabel(svc.type) }}</p>
            <p class="list-card-desc">{{ truncate(svc.description || '支持在线预约，适合展示完整的服务流程。', 48) }}</p>
            <div class="list-card-meta-row">
              <span>{{ svc.duration ? `${svc.duration} 分钟` : '时长待确认' }}</span>
              <span>查看详情</span>
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
        @current-change="fetchServices"
        background
      />
    </div>

    <el-dialog v-model="showDetail" :title="currentService?.name" width="560px" :close-on-click-modal="false">
      <div v-if="currentService" class="detail-panel">
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

        <el-divider>预约信息</el-divider>

        <el-form ref="bookFormRef" :model="bookForm" :rules="bookRules" label-width="88px">
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
            />
          </el-form-item>

          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="bookForm.remark"
              type="textarea"
              :rows="3"
              maxlength="200"
              show-word-limit
              placeholder="可填写特殊需求，选填"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showDetail = false">取消</el-button>
        <el-button type="primary" :loading="booking" @click="handleBook">确认预约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createAppointment } from '@/api/appointment'
import { getMyPets } from '@/api/pet'
import { getServicePage } from '@/api/service'
import { getCosUrl } from '@/utils/request'
import { createSvgPlaceholder } from '@/utils/placeholders'

const router = useRouter()
const services = ref([])
const total = ref(0)
const loading = ref(false)
const currentType = ref(null)
const page = ref(1)
const pageSize = 9

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
    1: '洗护',
    2: '美容',
    3: '医疗',
    4: '寄养'
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

const disabledDate = (date) => date.getTime() < Date.now() - 86400000

const handleTypeChange = () => {
  page.value = 1
  fetchServices()
}

const fetchServices = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (currentType.value) params.type = currentType.value

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
      myPets.value = res.data?.records || []
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
      ElMessage.success('预约成功')
      showDetail.value = false
    } else {
      ElMessage.error(res.message || '预约失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '预约失败，请稍后重试')
  } finally {
    booking.value = false
  }
}

onMounted(fetchServices)
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
  gap: 16px;
  padding: 22px 26px;
  border-radius: 22px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  color: var(--ink-body);
  font-size: 14px;
  font-weight: 700;
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
  min-height: 180px;
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

.list-card-note {
  color: var(--brand-strong);
  font-size: 14px;
  font-weight: 600;
}

.list-card-desc {
  color: var(--ink-body);
  line-height: 1.7;
  flex: 1;
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
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 28px 0 8px;
}

.detail-panel {
  display: grid;
  gap: 16px;
}

.detail-media {
  overflow: hidden;
  border-radius: 16px;
  background: var(--surface-soft);
  min-height: 200px;
}

.detail-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  padding: 14px;
  border-radius: 14px;
  background: var(--surface-soft);
}

.detail-item span {
  display: block;
  margin-bottom: 6px;
  color: var(--ink-muted);
  font-size: 12px;
}

.detail-item strong {
  color: var(--ink-strong);
  font-size: 15px;
}

.detail-item .price {
  color: var(--brand-strong);
}

.detail-desc {
  color: var(--ink-body);
  line-height: 1.7;
}

.select-empty {
  padding: 12px;
  color: var(--ink-muted);
  text-align: center;
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
