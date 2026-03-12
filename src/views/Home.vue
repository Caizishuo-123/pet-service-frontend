<template>
  <div class="home-page page-shell">
    <section class="page-hero home-hero">
      <div class="hero-copy">
        <span class="page-kicker">宠物服务平台</span>
        <h1 class="page-title">让领养、预约和交流，都变得更顺手一点。</h1>
        <p class="page-desc hero-desc">
          首页不强调夸张视觉，而是把用户最常用的内容放在最前面。先看领养宠物，再看热门服务，最后浏览社区动态，整体信息更集中，也更像一个完成度扎实的毕业设计作品。
        </p>

        <div class="hero-actions">
          <el-button type="primary" size="large" round @click="router.push('/adoption')">
            <el-icon><Search /></el-icon>
            去领养大厅
          </el-button>
          <el-button size="large" round @click="router.push('/services')">查看服务</el-button>
        </div>

        <div class="hero-stats">
          <article v-for="item in metrics" :key="item.label" class="stat-card">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </article>
        </div>
      </div>

      <div class="hero-aside">
        <article class="hero-highlight hero-highlight-main" @click="router.push('/adoption')">
          <span class="soft-tag">推荐入口</span>
          <h3>{{ primaryHighlight.title }}</h3>
          <p>{{ primaryHighlight.desc }}</p>
          <div class="hero-highlight-meta">
            <span>{{ primaryHighlight.metaLeft }}</span>
            <span>{{ primaryHighlight.metaRight }}</span>
          </div>
        </article>

        <div class="hero-highlight-list">
          <article v-for="item in secondaryHighlights" :key="item.route" class="hero-highlight hero-highlight-sub" @click="router.push(item.route)">
            <span class="soft-tag soft-tag-sub">{{ item.label }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section-block surface-panel section-panel">
      <div class="section-heading home-heading">
        <div>
          <span class="page-kicker">待领养宠物</span>
          <h2>先看看最近推荐的宠物档案</h2>
          <p>卡片信息保持简洁，名称、年龄、性别和品种放在同一层级，浏览起来会更整齐。</p>
        </div>
        <button class="section-link plain-button" type="button" @click="router.push('/adoption')">
          查看全部
          <el-icon><ArrowRight /></el-icon>
        </button>
      </div>

      <div v-if="pets.length" class="pet-grid">
        <article v-for="pet in pets" :key="pet.id" class="pet-card" @click="router.push(`/pet/${pet.id}`)">
          <div class="pet-media">
            <img :src="getCosUrl(pet.image)" :alt="pet.name" @error="setImageFallback($event, petPlaceholder)" />
            <span class="pet-badge">{{ pet.type === 1 ? '猫咪' : '狗狗' }}</span>
          </div>

          <div class="pet-body">
            <div class="card-title-row">
              <h3>{{ pet.name }}</h3>
              <span>{{ pet.age ? `${pet.age} 岁` : '待完善' }}</span>
            </div>
            <p class="card-main-note">{{ pet.breed || '品种信息待完善' }}</p>
            <div class="card-meta-row">
              <span>{{ pet.gender === 1 ? '公' : pet.gender === 2 ? '母' : '未知' }}</span>
              <span>可申请领养</span>
            </div>
          </div>
        </article>
      </div>
      <el-empty v-else-if="loaded" description="暂无可领养宠物" :image-size="88" />
      <el-skeleton v-else :rows="4" animated />
    </section>

    <section class="section-block content-split">
      <div class="surface-panel section-panel service-panel">
        <div class="section-heading home-heading compact-heading">
          <div>
            <span class="page-kicker">热门服务</span>
            <h2>常用服务</h2>
            <p>价格、时长和服务类型统一对齐，信息不乱。</p>
          </div>
          <button class="section-link plain-button" type="button" @click="router.push('/services')">
            更多服务
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>

        <div v-if="services.length" class="service-grid">
          <article v-for="service in services" :key="service.id" class="service-card" @click="router.push('/services')">
            <div class="service-card-top">
              <span class="soft-tag">{{ serviceTypeLabel(service.type) }}</span>
              <strong>¥{{ service.price }}</strong>
            </div>
            <h3>{{ service.name }}</h3>
            <p>{{ truncate(service.description || '支持在线预约，适合日常护理和基础照护场景。', 40) }}</p>
            <div class="card-meta-row">
              <span>{{ service.duration ? `${service.duration} 分钟` : '时长待确认' }}</span>
              <span>在线预约</span>
            </div>
          </article>
        </div>
        <el-empty v-else-if="loaded" description="暂无可用服务" :image-size="80" />
        <el-skeleton v-else :rows="4" animated />
      </div>

      <div class="surface-panel section-panel community-panel">
        <div class="section-heading home-heading compact-heading">
          <div>
            <span class="page-kicker">社区动态</span>
            <h2>最近分享</h2>
            <p>保留一条重点内容和几条简要列表，更容易对齐。</p>
          </div>
          <button class="section-link plain-button" type="button" @click="router.push('/community')">
            进入社区
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>

        <div v-if="posts.length" class="community-content">
          <article class="post-featured" @click="router.push(`/post/${posts[0].id}`)">
            <div class="post-featured-media">
              <img v-if="posts[0].imageUrl" :src="getCosUrl(posts[0].imageUrl)" :alt="posts[0].title" @error="setImageFallback($event, postPlaceholder)" />
              <div v-else class="post-placeholder">社区精选</div>
            </div>
            <div class="post-featured-body">
              <span class="soft-tag">{{ postTypeLabel(posts[0].type) }}</span>
              <h3>{{ posts[0].title }}</h3>
              <p>{{ truncate(posts[0].content, 82) }}</p>
              <div class="card-meta-row">
                <span>{{ posts[0].username || '匿名用户' }}</span>
                <span>{{ posts[0].likeCount || 0 }} 点赞</span>
              </div>
            </div>
          </article>

          <div class="post-list-mini">
            <article v-for="post in posts.slice(1, 4)" :key="post.id" class="post-mini-card" @click="router.push(`/post/${post.id}`)">
              <h3>{{ post.title }}</h3>
              <p>{{ truncate(post.content, 42) }}</p>
              <div class="card-meta-row">
                <span>{{ post.username || '匿名用户' }}</span>
                <span>{{ post.commentCount || 0 }} 评论</span>
              </div>
            </article>
          </div>
        </div>
        <el-empty v-else-if="loaded" description="暂无社区动态" :image-size="80" />
        <el-skeleton v-else :rows="4" animated />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Search } from '@element-plus/icons-vue'
import { getAdoptionPets, getPosts, getServices } from '@/api/home'
import { getCosUrl } from '@/utils/request'
import { createSvgPlaceholder } from '@/utils/placeholders'

const router = useRouter()
const pets = ref([])
const services = ref([])
const posts = ref([])
const petTotal = ref(0)
const serviceTotal = ref(0)
const postTotal = ref(0)
const loaded = ref(false)

const petPlaceholder = createSvgPlaceholder('PET', '#eaf0f8', '#416894')
const postPlaceholder = createSvgPlaceholder('POST', '#e4edf9', '#416894')

const formatMetric = (value) => {
  if (!loaded.value && !value) return '--'
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return String(value)
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

const serviceTypeLabel = (type) => {
  const labels = {
    1: '洗护',
    2: '美容',
    3: '医疗',
    4: '寄养'
  }
  return labels[type] || '服务'
}

const postTypeLabel = (type) => {
  const labels = {
    1: '晒宠',
    2: '求助',
    3: '科普'
  }
  return labels[type] || '动态'
}

const metrics = computed(() => [
  { label: '待领养宠物', value: formatMetric(petTotal.value) },
  { label: '热门服务', value: formatMetric(serviceTotal.value) },
  { label: '社区帖子', value: formatMetric(postTotal.value) }
])

const primaryHighlight = computed(() => {
  const pet = pets.value[0]
  return {
    title: pet?.name ? `${pet.name} 正在等待一个新家` : '从领养大厅开始浏览平台内容',
    desc: pet?.breed ? `${pet.breed}，资料已整理，可直接查看详细档案。` : '首页优先展示最新宠物档案，帮助用户快速进入领养流程。',
    metaLeft: pet?.gender === 1 ? '公' : pet?.gender === 2 ? '母' : '信息待完善',
    metaRight: pet?.age ? `${pet.age} 岁` : '等待了解'
  }
})

const secondaryHighlights = computed(() => [
  {
    label: '服务预约',
    title: services.value[0]?.name || '查看常用护理与照护服务',
    desc: truncate(services.value[0]?.description || '洗护、美容、医疗和寄养服务都支持分类查看。', 40),
    route: '/services'
  },
  {
    label: '社区分享',
    title: posts.value[0]?.title || '看看大家最近在讨论什么',
    desc: truncate(posts.value[0]?.content || '社区板块集中展示晒宠、求助与科普内容。', 40),
    route: '/community'
  }
])

onMounted(async () => {
  try {
    const [petRes, serviceRes, postRes] = await Promise.allSettled([
      getAdoptionPets(1, 4),
      getServices(1, 4),
      getPosts(1, 4)
    ])

    if (petRes.status === 'fulfilled' && petRes.value?.code === 200) {
      pets.value = petRes.value.data?.records || []
      petTotal.value = petRes.value.data?.total || pets.value.length
    }

    if (serviceRes.status === 'fulfilled' && serviceRes.value?.code === 200) {
      services.value = serviceRes.value.data?.records || []
      serviceTotal.value = serviceRes.value.data?.total || services.value.length
    }

    if (postRes.status === 'fulfilled' && postRes.value?.code === 200) {
      posts.value = postRes.value.data?.records || []
      postTotal.value = postRes.value.data?.total || posts.value.length
    }
  } catch (error) {
    console.error('首页数据加载失败', error)
  } finally {
    loaded.value = true
  }
})
</script>

<style scoped>
.home-page {
  padding-bottom: 36px;
}

.home-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.95fr);
  gap: 24px;
  align-items: stretch;
  background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-desc {
  max-width: 640px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 28px 0 24px;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: auto;
}

.stat-card,
.hero-highlight,
.pet-card,
.service-card,
.post-featured,
.post-mini-card {
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  box-shadow: var(--shadow-sm);
}

.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 96px;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f6f9fd 100%);
}

.stat-card strong {
  color: var(--brand-strong);
  font-size: 28px;
  line-height: 1;
}

.stat-card span {
  margin-top: 8px;
  color: var(--ink-body);
  font-size: 13px;
}

.hero-aside {
  display: grid;
  grid-template-rows: 1.25fr auto;
  gap: 16px;
}

.hero-highlight {
  border-radius: 20px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hero-highlight:hover,
.pet-card:hover,
.service-card:hover,
.post-featured:hover,
.post-mini-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.hero-highlight-main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 240px;
}

.hero-highlight-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.hero-highlight h3,
.pet-body h3,
.service-card h3,
.post-featured h3,
.post-mini-card h3 {
  margin: 14px 0 8px;
  font-size: 20px;
  line-height: 1.35;
}

.hero-highlight p,
.service-card p,
.post-featured p,
.post-mini-card p {
  color: var(--ink-body);
  line-height: 1.75;
}

.hero-highlight-meta,
.card-meta-row,
.card-title-row,
.service-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.hero-highlight-meta,
.card-meta-row span,
.card-title-row span {
  color: var(--ink-muted);
  font-size: 13px;
}

.soft-tag-sub {
  background: var(--surface-soft);
}

.section-panel {
  border-radius: 24px;
  padding: 28px;
}

.home-heading {
  margin-bottom: 24px;
}

.plain-button {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.pet-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.pet-card {
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
}

.pet-media {
  position: relative;
  height: 220px;
  background: var(--surface-soft);
}

.pet-media img,
.post-featured-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pet-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(37, 54, 74, 0.72);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.pet-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
}

.card-title-row h3,
.card-main-note {
  margin: 0;
}

.card-main-note {
  color: var(--brand-strong);
  font-size: 14px;
  font-weight: 600;
}

.content-split {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 24px;
}

.service-panel,
.community-panel {
  border-radius: 24px;
}

.compact-heading h2 {
  font-size: 24px;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.service-card {
  display: flex;
  flex-direction: column;
  min-height: 168px;
  padding: 18px;
  border-radius: 20px;
  cursor: pointer;
}

.service-card-top strong {
  color: var(--brand-strong);
  font-size: 22px;
}

.service-card p {
  margin: 0 0 16px;
  flex: 1;
}

.community-content {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  gap: 18px;
}

.post-featured {
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
}

.post-featured-media {
  height: 220px;
  background: var(--surface-soft);
}

.post-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--brand-strong);
  font-weight: 700;
  background: linear-gradient(135deg, #edf3fb, #f9fbff);
}

.post-featured-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
}

.post-featured-body p {
  margin: 0;
}

.post-list-mini {
  display: grid;
  gap: 14px;
}

.post-mini-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 128px;
  padding: 18px;
  border-radius: 18px;
  cursor: pointer;
}

.post-mini-card h3,
.post-mini-card p {
  margin: 0;
}

.post-mini-card p {
  margin: 10px 0 14px;
}

@media (max-width: 1180px) {
  .pet-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-split,
  .community-content,
  .home-hero {
    grid-template-columns: 1fr;
  }

  .hero-aside {
    grid-template-rows: auto;
  }
}

@media (max-width: 760px) {
  .service-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions,
  .hero-stats,
  .hero-highlight-list,
  .pet-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    display: grid;
  }

  .hero-actions :deep(.el-button) {
    width: 100%;
  }

  .section-panel {
    padding: 20px;
  }
}
</style>
