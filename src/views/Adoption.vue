<template>
  <div class="adoption-page page-shell">
    <section class="page-hero list-hero">
      <div>
        <span class="page-kicker">Adoption Hall</span>
        <h1 class="page-title">领养大厅</h1>
        <p class="page-desc">把领养信息整理成更规整的卡片列表，方便用户先筛选，再进入宠物详情页。</p>
      </div>
      <div class="hero-summary-grid">
        <article class="hero-summary-card">
          <strong>{{ total }}</strong>
          <span>当前领养信息</span>
        </article>
        <article class="hero-summary-card">
          <strong>5</strong>
          <span>支持筛选维度</span>
        </article>
      </div>
    </section>

    <section class="section-block surface-panel filter-panel list-filter-panel">
      <div class="filter-group">
        <div class="filter-row">
          <span class="filter-label">宠物类型</span>
          <el-radio-group v-model="filters.type" @change="handleTypeChange">
            <el-radio-button :value="null">全部</el-radio-button>
            <el-radio-button :value="1">猫咪</el-radio-button>
            <el-radio-button :value="2">狗狗</el-radio-button>
          </el-radio-group>
        </div>

        <div class="filter-row">
          <span class="filter-label">宠物性别</span>
          <el-radio-group v-model="filters.gender" @change="handleSearch">
            <el-radio-button :value="null">不限</el-radio-button>
            <el-radio-button :value="1">公</el-radio-button>
            <el-radio-button :value="2">母</el-radio-button>
          </el-radio-group>
        </div>

        <div class="filter-row">
          <span class="filter-label">年龄范围</span>
          <div class="range-inputs">
            <el-input-number v-model="filters.ageMin" :min="0" :max="30" controls-position="right" @change="handleSearch" />
            <span class="range-sep">至</span>
            <el-input-number v-model="filters.ageMax" :min="0" :max="30" controls-position="right" @change="handleSearch" />
            <span class="range-unit">岁</span>
          </div>
        </div>

        <div class="filter-row" v-if="showBreedFilter">
          <span class="filter-label">宠物品种</span>
          <el-select v-model="filters.breed" placeholder="全部品种" clearable :loading="breedsLoading" @change="handleSearch">
            <el-option v-for="breed in breeds" :key="breed" :label="breed" :value="breed" />
          </el-select>
        </div>
      </div>
      <div class="filter-actions">
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
    </section>

    <div v-if="loading" class="section-block surface-panel loading-panel">
      <el-skeleton :rows="5" animated />
    </div>

    <section v-else class="section-block">
      <div v-if="pets.length" class="list-grid pet-list-grid">
        <article v-for="pet in pets" :key="pet.id" class="list-card pet-card" @click="router.push(`/pet/${pet.id}`)">
          <div class="list-card-media pet-media">
            <img :src="getCosUrl(pet.image)" :alt="pet.name" @error="setImageFallback($event, petPlaceholder)" />
            <span class="list-card-badge">{{ pet.type === 1 ? '猫咪' : '狗狗' }}</span>
          </div>
          <div class="list-card-body">
            <div class="list-card-title-row">
              <h3>{{ pet.name }}</h3>
              <span>{{ pet.age ? `${pet.age} 岁` : '年龄待完善' }}</span>
            </div>
            <p class="list-card-note">{{ pet.breed || '品种信息待完善' }}</p>
            <div class="list-card-meta-row">
              <span>{{ pet.gender === 1 ? '公' : pet.gender === 2 ? '母' : '性别待完善' }}</span>
              <div class="health-tag-row">
                <template v-if="getHealthStatusTags(pet.healthStatus).length">
                  <el-tag
                    v-for="item in getHealthStatusTags(pet.healthStatus)"
                    :key="item.value"
                    size="small"
                    :type="item.type"
                    class="health-tag"
                  >
                    {{ item.label }}
                  </el-tag>
                </template>
                <span v-else class="health-empty">状态待更新</span>
              </div>
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
import { getAdoptionBreeds, getAdoptionPage } from '@/api/pet'
import { getCosUrl } from '@/utils/request'
import { createSvgPlaceholder } from '@/utils/placeholders'
import { getHealthStatusTags } from '@/utils/healthStatus'

const route = useRoute()
const router = useRouter()
const pets = ref([])
const total = ref(0)
const loading = ref(false)
const breeds = ref([])
const breedsLoading = ref(false)
const keyword = ref('')

const petPlaceholder = createSvgPlaceholder('PET', '#eaf0f8', '#416894', 600, 420)

const filters = reactive({
  type: null,
  breed: null,
  gender: null,
  ageMin: null,
  ageMax: null,
  page: 1,
  pageSize: 12
})

const showBreedFilter = computed(() => filters.type === 1 || filters.type === 2)

const truncate = (text, length) => {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length)}...` : text
}

const setImageFallback = (event, fallback) => {
  if (event?.target && event.target.src !== fallback) {
    event.target.src = fallback
  }
}

const normalizeAgeRange = () => {
  if (filters.ageMin !== null && filters.ageMax !== null && filters.ageMin > filters.ageMax) {
    const temp = filters.ageMin
    filters.ageMin = filters.ageMax
    filters.ageMax = temp
  }
}

const handleSearch = () => {
  filters.page = 1
  normalizeAgeRange()
  syncQuery()
}

const handleTypeChange = async () => {
  filters.breed = null
  if (showBreedFilter.value) {
    await fetchBreeds()
  }
  handleSearch()
}

const fetchBreeds = async () => {
  if (!showBreedFilter.value) {
    breeds.value = []
    return
  }
  try {
    breedsLoading.value = true
    const res = await getAdoptionBreeds(filters.type)
    if (res.code === 200) {
      breeds.value = res.data || []
    }
  } catch (error) {
    console.error('获取品种列表失败', error)
  } finally {
    breedsLoading.value = false
  }
}

const fetchPets = async () => {
  loading.value = true
  try {
    const params = { page: filters.page, pageSize: filters.pageSize }
    if (filters.type) params.type = filters.type
    if (filters.gender) params.gender = filters.gender
    if (filters.breed) params.breed = filters.breed
    if (filters.ageMin !== null && filters.ageMin !== undefined) params.ageMin = filters.ageMin
    if (filters.ageMax !== null && filters.ageMax !== undefined) params.ageMax = filters.ageMax
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
  filters.type = toNumber(query.type)
  filters.gender = toNumber(query.gender)
  filters.breed = query.breed || null
  filters.ageMin = toNumber(query.ageMin)
  filters.ageMax = toNumber(query.ageMax)
  filters.page = toNumber(query.page) || 1
  filters.pageSize = toNumber(query.pageSize) || 12
  keyword.value = query.keyword || ''

  if (showBreedFilter.value) {
    await fetchBreeds()
  } else {
    breeds.value = []
  }
}

const syncQuery = () => {
  const query = {}
  if (filters.type) query.type = String(filters.type)
  if (filters.gender) query.gender = String(filters.gender)
  if (filters.breed) query.breed = filters.breed
  if (filters.ageMin !== null && filters.ageMin !== undefined) query.ageMin = String(filters.ageMin)
  if (filters.ageMax !== null && filters.ageMax !== undefined) query.ageMax = String(filters.ageMax)
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
  align-items: flex-start;
  gap: 18px;
  padding: 18px 20px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(232, 240, 252, 0.72), rgba(255, 255, 255, 0.98));
  border: 1px solid rgba(65, 90, 130, 0.08);
  box-shadow: 0 18px 36px rgba(37, 54, 74, 0.06);
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 18px;
  flex: 1;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
  padding: 6px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(65, 90, 130, 0.08);
}

.filter-row :deep(.el-select) {
  min-width: 180px;
}

.filter-label {
  color: var(--ink-body);
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.range-inputs {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.range-sep,
.range-unit {
  font-size: 12px;
  color: var(--ink-muted);
}

.filter-actions {
  min-width: 280px;
  display: flex;
  justify-content: flex-end;
}

.filter-actions :deep(.el-input__inner) {
  min-width: 240px;
}

.search-input {
  width: 100%;
  max-width: 360px;
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

.list-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 178px;
  padding: 18px;
}

.list-card-title-row,
.list-card-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.list-card-title-row h3,
.list-card-note,
.list-card-desc {
  margin: 0;
}

.list-card-title-row span,
.list-card-meta-row span {
  color: var(--ink-muted);
  font-size: 13px;
}

.health-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
  max-width: 180px;
}

.health-tag {
  border-radius: 999px;
}

.health-empty {
  color: var(--ink-muted);
}

.list-card-note {
  color: var(--brand-strong);
  font-size: 14px;
  font-weight: 600;
}

.list-card-desc {
  color: var(--ink-body);
  line-height: 1.7;
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

  .list-filter-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-actions {
    width: 100%;
    min-width: 0;
  }

  .pet-list-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .list-filter-panel {
    padding: 18px;
  }

  .filter-row {
    flex-wrap: wrap;
  }

  .hero-summary-grid,
  .pet-list-grid {
    grid-template-columns: 1fr;
  }
}
</style>
