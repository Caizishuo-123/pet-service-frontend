<template>
  <div class="adoption-page page-shell">
    <section class="page-hero list-hero">
      <div>
        <span class="page-kicker">Adoption Hall</span>
        <h1 class="page-title">领养大厅</h1>
        <!-- <p class="page-desc">看看正在开放领养的宠物，按类型、品种、年龄和费用筛选，找到适合你的陪伴。</p> -->
      </div>
      <div class="hero-summary-grid">
        <article class="hero-summary-card">
          <strong>{{ total }}</strong>
          <span>当前领养信息</span>
        </article>
      </div>
    </section>

    <section class="section-block surface-panel filter-panel list-filter-panel">
      <div class="filter-toolbar">
        <div class="toolbar-filters">
          <div class="toolbar-item">
            <span class="toolbar-label">类型</span>
            <el-select v-model="filters.type" placeholder="全部类型" clearable @change="handleTypeChange">
              <el-option label="全部类型" :value="null" />
              <el-option label="小猫" :value="1" />
              <el-option label="小狗" :value="2" />
            </el-select>
          </div>

          <div class="toolbar-item">
            <span class="toolbar-label">性别</span>
            <el-select v-model="filters.gender" placeholder="不限性别" clearable @change="handleSearch">
              <el-option label="不限性别" :value="null" />
              <el-option label="公" :value="1" />
              <el-option label="母" :value="2" />
            </el-select>
          </div>

          <div class="toolbar-item">
            <span class="toolbar-label">品种</span>
            <el-select
              v-model="filters.breed"
              :placeholder="breedPlaceholder"
              clearable
              filterable
              :disabled="!showBreedFilter"
              @change="handleSearch"
            >
              <el-option v-for="breed in breeds" :key="breed" :label="breed" :value="breed" />
            </el-select>
          </div>

          <div class="toolbar-item">
            <span class="toolbar-label">年龄</span>
            <el-select v-model="filters.ageRange" placeholder="全部年龄" clearable @change="handleSearch">
              <el-option
                v-for="option in ageRangeOptions"
                :key="option.value || 'all-age'"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>

          <div class="toolbar-item">
            <span class="toolbar-label">费用</span>
            <el-select v-model="filters.feeRange" placeholder="全部费用" clearable @change="handleSearch">
              <el-option
                v-for="option in feeRangeOptions"
                :key="option.value || 'all-fee'"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
        </div>

        <div class="toolbar-search">
          <el-input
            class="search-input"
            v-model="keyword"
            placeholder="搜索宠物名、品种或描述"
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
    </section>

    <div v-if="loading" class="section-block surface-panel loading-panel">
      <el-skeleton :rows="5" animated />
    </div>

    <section v-else class="section-block">
      <div v-if="pets.length" class="list-grid pet-list-grid">
        <article v-for="pet in pets" :key="pet.id" class="list-card pet-card" @click="router.push(`/pet/${pet.id}`)">
          <div class="list-card-media pet-media">
            <img :src="getCosUrl(pet.image)" :alt="pet.name" @error="setImageFallback($event, petPlaceholder)" />
            <span class="list-card-badge">{{ pet.type === 1 ? '小猫' : '小狗' }}</span>
          </div>
          <div class="list-card-body">
            <div class="list-card-title-row">
              <h3>{{ pet.name }}</h3>
              <span class="fee-inline">{{ formatAdoptionFee(pet.adoptionFee) }}</span>
            </div>
            <div class="list-card-facts">
              <span>{{ pet.gender === 1 ? '公' : pet.gender === 2 ? '母' : '性别待完善' }}</span>
              <span>{{ formatPetAge(pet.age) }}</span>
              <span>{{ pet.breed || '品种待完善' }}</span>
            </div>
              <div class="health-tag-row">
                <template v-if="getHealthStatusTags(pet.healthStatus).length">
                  <el-tag v-for="item in getHealthStatusTags(pet.healthStatus)" :key="item.value" size="small" :type="item.type" class="health-tag">
                    {{ item.label }}
                  </el-tag>
                </template>
                <span v-else class="health-empty">状态待更新</span>
              </div>
            <p class="list-card-desc">{{ truncate(pet.description || '可点击进入详情页查看完整领养信息。', 44) }}</p>
          </div>
        </article>
      </div>

      <el-empty v-else class="surface-panel empty-panel" description="暂无可领养宠物，请稍后再来看看" :image-size="110" />
    </section>

    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination
        v-model:current-page="filters.page"
        :page-size="filters.pageSize"
        :total="total"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
        background
      />
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAdoptionPage } from '@/api/pet'
import { getCosUrl } from '@/utils/request'
import { createSvgPlaceholder } from '@/utils/placeholders'
import { getHealthStatusTags } from '@/utils/healthStatus'
import { getPetBreedOptions } from '@/utils/petOptions'
import { formatPetAge } from '@/utils/petFormat'

const route = useRoute()
const router = useRouter()
const pets = ref([])
const total = ref(0)
const loading = ref(false)
const breeds = ref([])
const keyword = ref('')

const petPlaceholder = createSvgPlaceholder('PET', '#eaf0f8', '#416894', 600, 420)

const ageRangeOptions = [
  { label: '全部年龄', value: '', min: null, max: null },
  { label: '6个月以内', value: '0-6m', min: null, max: 6 },
  { label: '1岁以内', value: '0-12m', min: null, max: 12 },
  { label: '1-3岁', value: '12-36m', min: 12, max: 36 },
  { label: '3-8岁', value: '36-96m', min: 36, max: 96 },
  { label: '8岁以上', value: '96m+', min: 96, max: null }
]

const feeRangeOptions = [
  { label: '全部费用', value: '', min: null, max: null },
  { label: '免费领养', value: 'free', min: 0, max: 0 },
  { label: '0-200元', value: '0-200', min: 0, max: 200 },
  { label: '200-500元', value: '200-500', min: 200, max: 500 },
  { label: '500-1000元', value: '500-1000', min: 500, max: 1000 },
  { label: '1000元以上', value: '1000+', min: 1000, max: null }
]

const filters = reactive({
  type: null,
  breed: null,
  gender: null,
  ageRange: '',
  feeRange: '',
  page: 1,
  pageSize: 12
})

const showBreedFilter = computed(() => filters.type === 1 || filters.type === 2)
const breedPlaceholder = computed(() => {
  if (!showBreedFilter.value) return '先选择宠物类型'
  return '全部品种'
})

const truncate = (text, length) => {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length)}...` : text
}

const formatAdoptionFee = (value) => {
  const fee = Number(value || 0)
  return fee <= 0 ? '免费领养' : `￥${fee.toFixed(2)}`
}

const setImageFallback = (event, fallback) => {
  if (event?.target && event.target.src !== fallback) {
    event.target.src = fallback
  }
}

const getRangeOption = (options, value) => options.find((item) => item.value === value) || options[0]

const inferRangeValue = (options, min, max) => {
  const match = options.find((item) => item.min === min && item.max === max)
  return match ? match.value : ''
}

const handleSearch = () => {
  filters.page = 1
  syncQuery()
}

const handleTypeChange = () => {
  filters.breed = null
  if (showBreedFilter.value) {
    loadBreedOptions()
  } else {
    breeds.value = []
  }
  handleSearch()
}

const loadBreedOptions = () => {
  if (!showBreedFilter.value) {
    breeds.value = []
    return
  }
  breeds.value = getPetBreedOptions(filters.type)
}

const fetchPets = async () => {
  loading.value = true
  try {
    const ageRange = getRangeOption(ageRangeOptions, filters.ageRange)
    const feeRange = getRangeOption(feeRangeOptions, filters.feeRange)
    const params = { page: filters.page, pageSize: filters.pageSize }
    if (filters.type) params.type = filters.type
    if (filters.gender) params.gender = filters.gender
    if (filters.breed) params.breed = filters.breed
    if (ageRange.min !== null && ageRange.min !== undefined) params.ageMin = ageRange.min
    if (ageRange.max !== null && ageRange.max !== undefined) params.ageMax = ageRange.max
    if (feeRange.min !== null && feeRange.min !== undefined) params.priceMin = feeRange.min
    if (feeRange.max !== null && feeRange.max !== undefined) params.priceMax = feeRange.max
    if (keyword.value) params.keyword = keyword.value

    const res = await getAdoptionPage(params)
    if (res.code === 200) {
      pets.value = res.data?.records || []
      total.value = res.data?.total || 0
    }
  } catch (error) {
    console.error('获取宠物列表失败', error)
  } finally {
    loading.value = false
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

const applyQuery = async (query) => {
  const ageMin = toNumber(query.ageMin)
  const ageMax = toNumber(query.ageMax)
  const priceMin = toNumber(query.priceMin)
  const priceMax = toNumber(query.priceMax)

  filters.type = toNumber(query.type)
  filters.gender = toNumber(query.gender)
  filters.breed = query.breed || null
  filters.ageRange = query.ageRange || inferRangeValue(ageRangeOptions, ageMin, ageMax)
  filters.feeRange = query.feeRange || inferRangeValue(feeRangeOptions, priceMin, priceMax)
  filters.page = toNumber(query.page) || 1
  filters.pageSize = toNumber(query.pageSize) || 12
  keyword.value = query.keyword || ''

  if (showBreedFilter.value) {
    loadBreedOptions()
  } else {
    breeds.value = []
    filters.breed = null
  }
}

const syncQuery = () => {
  const query = {}
  if (filters.type) query.type = String(filters.type)
  if (filters.gender) query.gender = String(filters.gender)
  if (filters.breed) query.breed = filters.breed
  if (filters.ageRange) query.ageRange = filters.ageRange
  if (filters.feeRange) query.feeRange = filters.feeRange
  if (keyword.value) query.keyword = keyword.value
  if (filters.page && filters.page > 1) query.page = String(filters.page)
  if (filters.pageSize && filters.pageSize !== 12) query.pageSize = String(filters.pageSize)
  router.replace({ query })
}

watch(
  () => route.query,
  async (query) => {
    await applyQuery(query)
    fetchPets()
  },
  { immediate: true }
)
</script>

<style scoped>
.adoption-page {
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
  grid-template-columns: minmax(140px, 1fr);
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
  padding: 18px 20px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(232, 240, 252, 0.72), rgba(255, 255, 255, 0.98));
  border: 1px solid rgba(65, 90, 130, 0.08);
  box-shadow: 0 18px 36px rgba(37, 54, 74, 0.06);
}

.filter-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: space-between;
  overflow: visible;
}

.toolbar-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  flex-wrap: nowrap;
}

.toolbar-item {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 10px;
  min-width: max-content;
  flex-shrink: 0;
  padding: 6px 8px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(65, 90, 130, 0.08);
}

.toolbar-label {
  color: var(--ink-body);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.toolbar-item :deep(.el-select) {
  width: 116px;
}

.toolbar-search {
  width: 320px;
  min-width: 320px;
  flex-shrink: 0;
  margin-left: auto;
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

.pet-list-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.list-card {
  display: flex;
  flex-direction: column;
  height: 100%;
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
  position: relative;
  background: var(--surface-soft);
}

.pet-media {
  height: 220px;
  flex-shrink: 0;
}

.list-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-card-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(37, 54, 74, 0.74);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.list-card-fee {
  position: absolute;
  right: 14px;
  bottom: 14px;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(196, 71, 34, 0.92);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 10px 22px rgba(37, 54, 74, 0.18);
}

.list-card-fee.free {
  background: rgba(55, 124, 86, 0.9);
}

.list-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 142px;
  padding: 16px 20px 14px;
}

.list-card-title-row,
.list-card-facts {
  display: grid;
  align-items: center;
  min-width: 0;
}

.list-card-title-row {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.list-card-facts {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.list-card-title-row h3,
.list-card-desc {
  margin: 0;
}

.list-card-title-row h3,
.list-card-facts span,
.list-card-desc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-card-title-row h3 {
  min-width: 0;
  color: var(--ink-strong);
  font-size: 21px;
  font-weight: 800;
  line-height: 28px;
}

.fee-inline {
  max-width: 96px;
  color: #b6512f !important;
  font-size: 13px;
  font-weight: 700;
  line-height: 22px;
  text-align: right;
  white-space: nowrap;
}

.list-card-facts span {
  min-width: 0;
  color: var(--ink-muted);
  font-size: 13px;
  line-height: 22px;
}

.health-tag-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  align-items: center;
  min-width: 0;
  height: 24px;
  overflow: hidden;
}

.health-tag {
  max-width: 88px;
  flex: 0 0 auto;
  border-radius: 999px;
}

.health-tag-row:has(.health-tag:nth-of-type(4)) .health-tag:nth-of-type(n + 4) {
  display: none;
}

.health-tag-row:has(.health-tag:nth-of-type(4))::after {
  content: "...";
  flex: 0 0 auto;
  color: var(--ink-muted);
  font-size: 13px;
  line-height: 22px;
}

.health-empty {
  color: var(--ink-muted);
  font-size: 13px;
  line-height: 22px;
}

.list-card-desc {
  color: var(--ink-body);
  font-size: 14px;
  line-height: 22px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 28px 0 8px;
}

@media (max-width: 1180px) {
  .pet-list-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .list-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-filters {
    width: 100%;
    min-width: 0;
    flex-wrap: wrap;
  }

  .toolbar-item {
    min-width: 0;
    flex: 1 1 calc(50% - 6px);
  }

  .toolbar-item :deep(.el-select) {
    width: 100%;
  }

  .toolbar-search {
    width: 100%;
    min-width: 0;
    margin-left: 0;
  }

  .pet-list-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .list-filter-panel {
    padding: 18px;
  }

  .toolbar-item {
    flex: 1 1 100%;
  }

  .hero-summary-grid,
  .pet-list-grid {
    grid-template-columns: 1fr;
  }
}
</style>
