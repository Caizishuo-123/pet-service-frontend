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
          <strong>2</strong>
          <span>支持筛选维度</span>
        </article>
      </div>
    </section>

    <section class="section-block surface-panel filter-panel list-filter-panel">
      <div class="filter-row">
        <span class="filter-label">宠物类型</span>
        <el-radio-group v-model="filters.type" @change="handleSearch">
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
              <span>{{ healthLabel(pet.healthStatus) }}</span>
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
        @current-change="fetchPets"
        background
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAdoptionPage } from '@/api/pet'
import { getCosUrl } from '@/utils/request'
import { createSvgPlaceholder } from '@/utils/placeholders'

const router = useRouter()
const pets = ref([])
const total = ref(0)
const loading = ref(false)

const petPlaceholder = createSvgPlaceholder('PET', '#eaf0f8', '#416894', 600, 420)

const filters = reactive({
  type: null,
  gender: null,
  page: 1,
  pageSize: 12
})

const healthLabel = (status) => {
  const map = {
    1: '健康',
    2: '亚健康',
    3: '生病',
    4: '残疾'
  }
  return map[status] || '状态待更新'
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

const handleSearch = () => {
  filters.page = 1
  fetchPets()
}

const fetchPets = async () => {
  loading.value = true
  try {
    const params = { page: filters.page, pageSize: filters.pageSize }
    if (filters.type) params.type = filters.type
    if (filters.gender) params.gender = filters.gender

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

onMounted(fetchPets)
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
  flex-wrap: wrap;
  gap: 24px;
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
  align-items: center;
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

  .pet-list-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .list-filter-panel {
    padding: 18px;
  }

  .hero-summary-grid,
  .pet-list-grid {
    grid-template-columns: 1fr;
  }
}
</style>
