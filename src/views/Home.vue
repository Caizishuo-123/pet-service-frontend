<template>
  <div class="home-page page-shell">
    <section class="page-hero home-hero">
      <div class="hero-copy">
        <span class="page-kicker">宠物服务平台</span>
        <h1 class="page-title">让领养、预约和交流，<br>都变得更顺手一点。</h1>
        <p class="hero-desc">在这里，我们连接每一个温暖的家与每一个待领养的生命。提供专业的宠物医疗与美容服务，让每一份爱心都能找到归宿。</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" round @click="router.push('/adoption')">
            <el-icon><Search /></el-icon>
            去领养大厅
          </el-button>
          <el-button size="large" round @click="router.push('/services')">查看服务</el-button>
        </div>
        <div class="hero-features">
          <span class="feature-chip">官方认证领养</span>
          <span class="feature-chip">24h 专家支持</span>
          <span class="feature-chip">社区真实互动</span>
        </div>

        <div class="hero-illustration" aria-hidden="true">
          <img src="@/assets/hero-illustration-transparent.png" alt="" />
        </div>
      </div>

      <div class="hero-aside">
        <article class="hero-news">
          <div class="hero-news-head">
            <div>
              <span class="page-kicker">社区快讯</span>
              <h3>今日热门标题</h3>
            </div>
            <button class="section-link plain-button" type="button" @click="router.push('/community')">
              进入社区
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>

          <div v-if="newsItems.length" class="news-list">
            <article v-for="item in newsItems" :key="item.id" class="news-item" @click="router.push(`/post/${item.id}`)">
              <span class="news-tag" :class="{ 'is-notice': item.__isNotice }">
                {{ item.__isNotice ? '公告' : '社区' }}
              </span>
              <p class="news-title">{{ item.title || '未命名帖子' }}</p>
              <span v-if="item.__date" class="news-date">{{ item.__date }}</span>
            </article>
          </div>
          <el-empty v-else-if="loaded" description="暂无社区动态" :image-size="72" />
          <el-skeleton v-else :rows="6" animated />
        </article>
      </div>
    </section>

    <section class="section-block surface-panel section-panel">
      <div class="section-heading home-heading">
        <div>
          <span class="page-kicker">待领养宠物</span>
          <h2>先看看最近推荐的宠物档案</h2>
          <p>卡片信息保持简洁，名称、年龄、性别和品种放在同一层级，浏览起来会更整齐。</p>
        </div>
        <div class="home-heading-actions">
          <el-button
            class="refresh-button"
            circle
            size="small"
            :loading="refreshingPets"
            :disabled="!pets.length || refreshingPets"
            aria-label="刷新推荐宠物"
            title="换一批"
            @click="refreshPets"
          >
            <el-icon><Refresh /></el-icon>
          </el-button>
          <button class="section-link plain-button" type="button" @click="router.push('/adoption')">
            查看全部
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>
      </div>

      <div v-if="pets.length" class="pet-marquee" :class="{ 'is-static': pets.length <= marqueeMin }">
        <div :key="petMarqueeKey" class="pet-marquee-track" :style="{ '--marquee-duration': `${marqueeDuration}s` }">
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

          <template v-if="pets.length > marqueeMin">
            <article v-for="pet in pets" :key="`dup-${pet.id}`" class="pet-card" @click="router.push(`/pet/${pet.id}`)">
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
          </template>
        </div>
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
              <span class="soft-tag">{{ postDisplayLabel(posts[0]) }}</span>
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
import { ArrowRight, Refresh, Search } from '@element-plus/icons-vue'
import { getAdoptionPets, getPosts, getServices } from '@/api/home'
import { getCosUrl } from '@/utils/request'
import { createSvgPlaceholder } from '@/utils/placeholders'

const router = useRouter()
const pets = ref([])
const services = ref([])
const posts = ref([])
const loaded = ref(false)
const refreshingPets = ref(false)
const petMarqueeKey = ref(0)
const petPage = ref(1)
const petTotalPages = ref(0)

const petPlaceholder = createSvgPlaceholder('PET', '#eaf0f8', '#416894')
const postPlaceholder = createSvgPlaceholder('POST', '#e4edf9', '#416894')

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

const postCategoryLabel = (category) => {
  const labels = {
    1: '分享',
    2: '求助',
    3: '科普',
    4: '讨论',
    5: '其他'
  }
  return labels[category] || '动态'
}

const postDisplayLabel = (post) => {
  if (!post) return '动态'
  if (post.type === 2) return '公告'
  const category = post.category ?? post.type
  return postCategoryLabel(category)
}

const NEWS_LIMIT = 6
const ANNOUNCE_LIMIT = 2
const marqueeMin = 4

const isAnnouncement = (post) => post?.type === 2

const pickPostTime = (post) =>
  post?.publishTime ||
  post?.createTime ||
  post?.createdAt ||
  post?.create_time ||
  post?.updateTime ||
  post?.updatedAt ||
  post?.updated_at ||
  ''

const formatNewsDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const shuffle = (items) => {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const PET_PAGE_SIZE = 6

const pickTotalPages = (payload) => {
  if (!payload) return 0
  const candidates = [
    payload.pages,
    payload.totalPages,
    payload.total_pages,
    payload.pageCount,
    payload.page_count
  ]
  for (const value of candidates) {
    const num = Number(value)
    if (Number.isFinite(num) && num > 0) return num
  }
  return 0
}

const loadPets = async (page) => {
  const res = await getAdoptionPets(page, PET_PAGE_SIZE)
  if (res?.code !== 200) return false

  const payload = res.data || {}
  pets.value = shuffle(payload.records || [])
  petTotalPages.value = pickTotalPages(payload)
  petPage.value = page
  return true
}

const refreshPets = async () => {
  if (refreshingPets.value) return
  refreshingPets.value = true

  try {
    const total = petTotalPages.value
    const nextPage = total > 1 ? (petPage.value % total) + 1 : 1
    const ok = await loadPets(nextPage)

    // Fallback: at least rotate/shuffle locally so UI feels responsive.
    if (!ok && pets.value.length > 1) {
      pets.value = shuffle(pets.value)
    }
  } catch (error) {
    console.error('刷新推荐宠物失败', error)
    if (pets.value.length > 1) {
      pets.value = shuffle(pets.value)
    }
  } finally {
    petMarqueeKey.value += 1
    refreshingPets.value = false
  }
}

const marqueeDuration = computed(() => Math.max(18, pets.value.length * 3.5))

const newsItems = computed(() => {
  if (!posts.value.length) return []
  const items = posts.value.slice()
  const byTime = items
    .map((post) => ({ post, time: new Date(pickPostTime(post)).getTime() || 0 }))
    .sort((a, b) => b.time - a.time)
    .map((entry) => entry.post)

  const announcements = byTime.filter(isAnnouncement).slice(0, ANNOUNCE_LIMIT)
  const announcementIds = new Set(announcements.map((post) => post.id))
  const regularPool = items.filter((post) => !isAnnouncement(post) && !announcementIds.has(post.id))
  const fillCount = Math.max(NEWS_LIMIT - announcements.length, 0)
  const randomPosts = shuffle(regularPool).slice(0, fillCount)

  return [
    ...announcements.map((post) => ({
      ...post,
      __isNotice: true,
      __date: formatNewsDate(pickPostTime(post))
    })),
    ...randomPosts.map((post) => ({
      ...post,
      __isNotice: false,
      __date: formatNewsDate(pickPostTime(post))
    }))
  ]
})
onMounted(async () => {
  try {
    const [petRes, serviceRes, postRes] = await Promise.allSettled([
      getAdoptionPets(1, PET_PAGE_SIZE),
      getServices(1, 4),
      getPosts(1, 12)
    ])

    if (petRes.status === 'fulfilled' && petRes.value?.code === 200) {
      const payload = petRes.value.data || {}
      pets.value = shuffle(payload.records || [])
      petTotalPages.value = pickTotalPages(payload)
      petPage.value = 1
    }

    if (serviceRes.status === 'fulfilled' && serviceRes.value?.code === 200) {
      services.value = serviceRes.value.data?.records || []
    }

    if (postRes.status === 'fulfilled' && postRes.value?.code === 200) {
      posts.value = postRes.value.data?.records || []
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
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.8fr);
  gap: 40px;
  align-items: center;
  background: radial-gradient(circle at 20% 50%, rgba(95, 136, 198, 0.05) 0%, transparent 50%),
              linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
  overflow: hidden;
}


.hero-copy {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-self: stretch;
}

.hero-copy > * {
  position: relative;
  z-index: 2;
}

.hero-illustration {
  position: absolute;
  right: -8px;
  bottom: -35px;
  width: clamp(180px, 26vw, 320px);
  pointer-events: none;
  user-select: none;
  z-index: 0;
  opacity: 0.98;
  filter: drop-shadow(0 16px 38px rgba(37, 54, 74, 0.12));
}

.hero-illustration img {
  width: 100%;
  height: auto;
}

.hero-desc {
  max-width: 640px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-top: 60px;
}

.hero-features {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.feature-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: var(--surface-soft);
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  font-size: 13px;
  color: var(--ink-body);
  font-weight: 600;
  transition: all 0.3s ease;
}

.feature-chip:hover {
  background: #fff;
  border-color: var(--brand);
  transform: translateY(-1px);
}

.hero-news,
.pet-card,
.service-card,
.post-featured,
.post-mini-card {
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  box-shadow: var(--shadow-sm);
}

.hero-news {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 24px;
  height: 100%;
}

.hero-aside {
  display: flex;
  flex-direction: column;
}

.hero-news-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.hero-news-head h3 {
  margin: 8px 0 0;
  font-size: 20px;
}

.news-list {
  display: grid;
  gap: 12px;
}

.news-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--surface-soft);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.news-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  background: #f3f7ff;
}

.news-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand-strong);
  font-size: 12px;
  font-weight: 700;
}

.news-tag.is-notice {
  background: #fde7cf;
  color: #9a6b2f;
}

.news-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.news-date {
  font-size: 12px;
  color: var(--ink-muted);
  white-space: nowrap;
}

.pet-card:hover,
.service-card:hover,
.post-featured:hover,
.post-mini-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}
.pet-body h3,
.service-card h3,
.post-featured h3,
.post-mini-card h3 {
  margin: 14px 0 8px;
  font-size: 20px;
  line-height: 1.35;
}

.service-card p,
.post-featured p,
.post-mini-card p {
  color: var(--ink-body);
  line-height: 1.75;
}

.card-meta-row,
.card-title-row,
.service-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.card-meta-row span,
.card-title-row span {
  color: var(--ink-muted);
  font-size: 13px;
}

.section-panel {
  border-radius: 24px;
  padding: 28px;
}

.home-heading {
  margin-bottom: 24px;
}

.home-heading-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.plain-button {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.refresh-button {
  --el-button-size: 38px;
  --el-button-bg-color: rgba(95, 136, 198, 0.12);
  --el-button-border-color: rgba(95, 136, 198, 0.18);
  --el-button-text-color: var(--brand-strong);
  --el-button-hover-bg-color: rgba(95, 136, 198, 0.2);
  --el-button-hover-border-color: rgba(95, 136, 198, 0.26);
  --el-button-hover-text-color: var(--brand-strong);
  --el-button-active-bg-color: rgba(95, 136, 198, 0.24);
  --el-button-active-border-color: rgba(95, 136, 198, 0.3);
  box-shadow: 0 8px 18px rgba(95, 136, 198, 0.14);
}

.pet-marquee {
  position: relative;
  overflow: hidden;
}

.pet-marquee-track {
  display: flex;
  gap: 20px;
  width: max-content;
  animation: pet-marquee var(--marquee-duration, 24s) linear infinite;
}

.pet-marquee:hover .pet-marquee-track {
  animation-play-state: paused;
}

.pet-marquee.is-static .pet-marquee-track {
  animation: none;
}

.pet-card {
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  flex: 0 0 240px;
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
  display: flex;
  flex-direction: column;
  border-radius: 24px;
}

.compact-heading h2 {
  font-size: 24px;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  flex: 1;
  grid-auto-rows: 1fr;
  align-content: stretch;
}

.service-card {
  display: flex;
  flex-direction: column;
  min-height: 168px;
  padding: 18px;
  border-radius: 20px;
  cursor: pointer;
  height: 100%;
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
  flex: 1;
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

@keyframes pet-marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@media (max-width: 1180px) {
  .home-hero {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .hero-illustration {
    position: relative;
    right: auto;
    bottom: auto;
    width: min(320px, 76%);
    margin-top: 22px;
    align-self: flex-end;
    opacity: 1;
  }

  .hero-illustration img {
    max-width: none;
  }

  .content-split,
  .community-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .hero-stats {
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
  }

  .stat-line {
    display: none;
  }
  .service-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    display: grid;
  }

  .hero-actions :deep(.el-button) {
    width: 100%;
  }

  .hero-news {
    min-height: auto;
  }

  .hero-news-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .home-heading-actions {
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .news-item {
    grid-template-columns: auto 1fr;
  }

  .news-date {
    display: none;
  }

  .pet-card {
    flex-basis: 200px;
  }

  .section-panel {
    padding: 20px;
  }
}
</style>
