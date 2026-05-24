<template>
  <div class="home-page page-shell">
    <section class="page-hero home-hero">
      <div class="hero-copy">
        <span class="page-kicker">宠物服务平台</span>
        <h1 class="page-title">让领养、预约和交流，<br>都变得更简单。</h1>
        <p class="hero-desc">在这里浏览待领养宠物，预约洗护、美容、医疗和寄养服务，也可以和其他养宠用户分享经验、交流问题。</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" round @click="router.push('/adoption')">
            <el-icon>
              <Search />
            </el-icon>
            去领养大厅
          </el-button>
          <el-button size="large" round @click="router.push('/services')">查看服务</el-button>
        </div>
        <div class="hero-features">
          <span class="feature-chip">平台审核领养</span>
          <span class="feature-chip">在线预约服务</span>
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
              <span class="page-kicker">公告通知</span>
              <h3>重要通知</h3>
            </div>
            <button class="section-link plain-button" type="button" @click="router.push('/community')">
              查看公告
              <el-icon>
                <ArrowRight />
              </el-icon>
            </button>
          </div>

          <div v-if="newsItems.length" class="news-list">
            <article v-for="item in newsItems" :key="item.__key" class="news-item"
              :class="{ 'is-placeholder': item.__placeholder }"
              @click="!item.__placeholder && router.push(`/post/${item.id}`)">
              <template v-if="!item.__placeholder">
                <span class="news-tag is-notice">公告</span>
                <p class="news-title" :title="item.title || '未命名公告'">{{ item.title || '未命名公告' }}</p>
                <span v-if="item.__date" class="news-date">{{ item.__date }}</span>
              </template>
            </article>
          </div>
          <el-empty v-else-if="loaded" description="暂无公告通知" :image-size="72" />
          <el-skeleton v-else :rows="6" animated />
        </article>
      </div>
    </section>

    <section class="section-block surface-panel section-panel">
      <div class="section-heading home-heading">
        <div>
          <span class="page-kicker">待领养宠物</span>
          <h2>看看近期开放领养的宠物</h2>
          <p>为你随机推荐正在等待新家的小猫和小狗，点击卡片可查看详细资料并提交领养申请。</p>
        </div>
        <div class="home-heading-actions">
          <el-button class="refresh-button" circle size="small" :loading="refreshingPets"
            :disabled="!petPool.length || refreshingPets" aria-label="刷新推荐宠物" title="换一批" @click="refreshPets">
            <el-icon>
              <Refresh />
            </el-icon>
          </el-button>
          <button class="section-link plain-button" type="button" @click="router.push('/adoption')">
            查看全部
            <el-icon>
              <ArrowRight />
            </el-icon>
          </button>
        </div>
      </div>

      <div v-if="pets.length" class="pet-marquee" :class="{ 'is-static': pets.length <= marqueeMin }">
        <div :key="petMarqueeKey" class="pet-marquee-track" :style="{ '--marquee-duration': `${marqueeDuration}s` }">
          <article v-for="pet in pets" :key="pet.id" class="pet-card" @click="router.push(`/pet/${pet.id}`)">
            <div class="pet-media">
              <img :src="getCosUrl(pet.image)" :alt="pet.name" @error="setImageFallback($event, petPlaceholder)" />
              <span class="pet-badge">{{ pet.type === 1 ? '小猫' : '小狗' }}</span>
            </div>

            <div class="pet-body">
              <div class="card-title-row">
                <h3>{{ pet.name }}</h3>
                <span>{{ pet.age ? `${pet.age} 月` : '年龄待完善' }}</span>
              </div>
              <p class="card-main-note">{{ pet.breed || '品种信息待完善' }}</p>
              <div class="card-meta-row">
                <span>{{ pet.gender === 1 ? '公' : pet.gender === 2 ? '母' : '未知' }}</span>
                <span>{{ pet.adoptionFee > 0 ? `领养费 ¥${pet.adoptionFee}` : '免费领养' }}</span>
              </div>
            </div>
          </article>

          <template v-if="pets.length > marqueeMin">
            <article v-for="pet in pets" :key="`dup-${pet.id}`" class="pet-card" @click="router.push(`/pet/${pet.id}`)">
              <div class="pet-media">
                <img :src="getCosUrl(pet.image)" :alt="pet.name" @error="setImageFallback($event, petPlaceholder)" />
                <span class="pet-badge">{{ pet.type === 1 ? '小猫' : '小狗' }}</span>
              </div>

              <div class="pet-body">
                <div class="card-title-row">
                  <h3>{{ pet.name }}</h3>
                  <span>{{ pet.age ? `${pet.age} 月` : '年龄待完善' }}</span>
                </div>
                <p class="card-main-note">{{ pet.breed || '品种信息待完善' }}</p>
                <div class="card-meta-row">
                  <span>{{ pet.gender === 1 ? '公' : pet.gender === 2 ? '母' : '未知' }}</span>
                  <span>{{ pet.adoptionFee > 0 ? `领养费 ¥${pet.adoptionFee}` : '免费领养' }}</span>
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
          <div class="heading-copy">
            <span class="page-kicker">热门服务</span>
            <h2>常用宠物服务</h2>
            <p>洗护、美容、医疗、寄养等服务可在线预约。</p>
          </div>
          <button class="section-link plain-button" type="button" @click="router.push('/services')">
            更多服务
            <el-icon>
              <ArrowRight />
            </el-icon>
          </button>
        </div>

        <div v-if="services.length" class="service-grid">
          <article v-for="service in services" :key="service.id" class="service-card" @click="openService(service)">
            <div class="service-card-top">
              <span class="soft-tag">{{ serviceTypeLabel(service.type) }}</span>
              <strong>¥{{ service.price }}</strong>
            </div>
            <h3>{{ service.name }}</h3>
            <p>{{ truncate(service.description || '支持在线预约，适合日常护理和基础照护场景。', 40) }}</p>
            <div class="card-meta-row">
              <span>{{ service.duration ? `${service.duration} 分钟` : '时长待确认' }}</span>
              <span>立即预约</span>
            </div>
          </article>
        </div>
        <el-empty v-else-if="loaded" description="暂无可用服务" :image-size="80" />
        <el-skeleton v-else :rows="4" animated />
      </div>

      <div class="surface-panel section-panel community-panel">
        <div class="section-heading home-heading compact-heading">
          <div class="heading-copy">
            <span class="page-kicker">社区精选</span>
            <h2>热门帖子</h2>
            <p>看看养宠用户的经验分享、求助讨论和科普内容。</p>
          </div>
          <button class="section-link plain-button" type="button" @click="router.push('/community')">
            进入社区
            <el-icon>
              <ArrowRight />
            </el-icon>
          </button>
        </div>

        <div v-if="posts.length" class="community-content">
          <article class="post-featured" @click="router.push(`/post/${posts[0].id}`)">
            <div class="post-featured-media">
              <img v-if="posts[0].imageUrl" :src="getCosUrl(posts[0].imageUrl)" :alt="posts[0].title"
                @error="setImageFallback($event, postPlaceholder)" />
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
            <article v-for="post in posts.slice(1, 4)" :key="post.id" class="post-mini-card"
              @click="router.push(`/post/${post.id}`)">
              <h3>{{ post.title }}</h3>
              <p>{{ truncate(post.content, 42) }}</p>
              <div class="card-meta-row">
                <span>{{ post.username || '匿名用户' }}</span>
                <span>{{ post.commentCount || 0 }} 评论</span>
              </div>
            </article>
          </div>
        </div>
        <el-empty v-else-if="loaded" description="暂无热门帖子" :image-size="80" />
        <el-skeleton v-else :rows="4" animated />
      </div>
    </section>

    <el-dialog v-model="showDetail" :title="currentService?.name" width="760px" class="service-book-dialog"
      :close-on-click-modal="false">
      <div v-if="currentService" class="detail-panel detail-panel-split">
        <section class="detail-info-column">
          <div class="detail-media">
            <img v-if="currentService.imageUrl" :src="getCosUrl(currentService.imageUrl)" :alt="currentService.name"
              @error="setImageFallback($event, servicePlaceholder)" />
            <div v-else class="detail-placeholder">{{ serviceTypeLabel(currentService.type) }}</div>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span>服务类型</span>
              <strong>{{ serviceTypeLabel(currentService.type) }}</strong>
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
              <el-select v-model="bookForm.petId" placeholder="请选择您的宠物" style="width: 100%" :loading="petsLoading"
                @focus="loadMyPets">
                <el-option v-for="pet in myPets" :key="pet.id" :label="pet.name" :value="pet.id">
                  <span>{{ pet.name }}（{{ pet.breed || '未知品种' }}）</span>
                </el-option>
                <template #empty>
                  <div class="select-empty">暂无宠物，请先到“我的宠物”页面添加</div>
                </template>
              </el-select>
            </el-form-item>

            <el-form-item label="预约时间" prop="appointmentTime">
              <el-date-picker v-model="bookForm.appointmentTime" type="datetime" placeholder="请选择预约时间"
                style="width: 100%" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm:ss"
                :disabled-date="disabledDate" :disabled-time="disabledTime" />
            </el-form-item>

            <el-form-item label="备注" prop="remark">
              <el-input v-model="bookForm.remark" type="textarea" :rows="4" maxlength="200" show-word-limit
                placeholder="可填写特殊需求，选填" />
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, Refresh, Search } from '@element-plus/icons-vue'
import { createAppointment } from '@/api/appointment'
import { getAdoptionPets, getHotPosts, getNotices, getServices } from '@/api/home'
import { getMyPets } from '@/api/pet'
import { getCosUrl } from '@/utils/request'
import { createSvgPlaceholder } from '@/utils/placeholders'

const router = useRouter()
const petPool = ref([])
const pets = ref([])
const services = ref([])
const posts = ref([])
const notices = ref([])
const loaded = ref(false)
const refreshingPets = ref(false)
const petMarqueeKey = ref(0)
const showDetail = ref(false)
const currentService = ref(null)
const booking = ref(false)
const bookFormRef = ref(null)
const myPets = ref([])
const petsLoading = ref(false)

const petPlaceholder = createSvgPlaceholder('PET', '#eaf0f8', '#416894')
const postPlaceholder = createSvgPlaceholder('POST', '#e4edf9', '#416894')
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

const PET_POOL_SIZE = 50
const PET_RECOMMEND_SIZE = 8
const NOTICE_DISPLAY_LIMIT = 5
const marqueeMin = 4

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
    1: '美容',
    2: '洗护',
    3: '医疗',
    4: '寄养',
    5: '训练',
    6: '接送'
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

const pickRandomPets = () => {
  pets.value = shuffle(petPool.value).slice(0, PET_RECOMMEND_SIZE)
}

const loadPetPool = async () => {
  const res = await getAdoptionPets(1, PET_POOL_SIZE)
  if (res?.code !== 200) return false

  petPool.value = res.data?.records || []
  pickRandomPets()
  return true
}

const refreshPets = async () => {
  if (refreshingPets.value) return
  refreshingPets.value = true

  try {
    if (!petPool.value.length) {
      await loadPetPool()
    } else {
      pickRandomPets()
    }
  } catch (error) {
    console.error('刷新推荐宠物失败', error)
  } finally {
    petMarqueeKey.value += 1
    refreshingPets.value = false
  }
}

const openService = (service) => {
  currentService.value = service
  bookForm.petId = null
  bookForm.appointmentTime = ''
  bookForm.remark = ''
  showDetail.value = true
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
    router.push({ path: '/login', query: { redirect: '/home' } })
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

const marqueeDuration = computed(() => Math.max(18, pets.value.length * 3.5))

const newsItems = computed(() =>
  Array.from({ length: NOTICE_DISPLAY_LIMIT }, (_, index) => {
    const post = notices.value[index]
    if (!post) {
      return {
        __key: `placeholder-${index}`,
        __placeholder: true
      }
    }
    return {
      ...post,
      __key: post.id,
      __isNotice: true,
      __date: formatNewsDate(pickPostTime(post))
    }
  })
)

onMounted(async () => {
  try {
    const [petRes, serviceRes, postRes, noticeRes] = await Promise.allSettled([
      getAdoptionPets(1, PET_POOL_SIZE),
      getServices(1, 4),
      getHotPosts(1, 4),
      getNotices(1, NOTICE_DISPLAY_LIMIT)
    ])

    if (petRes.status === 'fulfilled' && petRes.value?.code === 200) {
      petPool.value = petRes.value.data?.records || []
      pickRandomPets()
    }

    if (serviceRes.status === 'fulfilled' && serviceRes.value?.code === 200) {
      services.value = serviceRes.value.data?.records || []
    }

    if (postRes.status === 'fulfilled' && postRes.value?.code === 200) {
      posts.value = postRes.value.data?.records || []
    }

    if (noticeRes.status === 'fulfilled' && noticeRes.value?.code === 200) {
      notices.value = noticeRes.value.data?.records || []
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
  align-items: stretch;
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

.hero-copy>* {
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
  justify-content: center;
}

.hero-aside {
  display: flex;
  flex-direction: column;
  min-height: 100%;
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
  grid-template-rows: repeat(5, 54px);
  max-height: none;
  overflow: hidden;
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

.news-item:not(.is-placeholder):hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  background: #f3f7ff;
}

.news-item.is-placeholder {
  cursor: default;
  opacity: 0;
  pointer-events: none;
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
  min-width: 0;
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

.compact-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  column-gap: 16px;
  row-gap: 8px;
}

.compact-heading .page-kicker {
  grid-column: 1 / -1;
  grid-row: 1;
  justify-self: stretch;
  justify-content: flex-start;
  white-space: nowrap;
}

.compact-heading .heading-copy {
  display: contents;
}

.compact-heading h2 {
  grid-column: 1;
  grid-row: 2;
  margin: 10px 0 0;
  min-width: 0;
}

.compact-heading p {
  grid-column: 1 / -1;
  grid-row: 3;
  min-width: 0;
}

.compact-heading .section-link {
  grid-column: 2;
  grid-row: 2;
  justify-self: end;
  align-self: center;
  min-width: 86px;
  white-space: nowrap;
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
