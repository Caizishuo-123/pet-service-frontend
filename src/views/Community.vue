<template>
  <div class="community-page page-shell">
    <section class="page-hero list-hero">
      <div>
        <span class="page-kicker">Community</span>
        <h1 class="page-title">宠物社区</h1>
        <p class="page-desc">社区页也沿用同样的节奏：页头说明、分类筛选、规整列表和统一卡片信息，不再单独长一套样式。</p>
      </div>
      <div class="hero-actions">
        <article class="hero-summary-card">
          <strong>{{ total }}</strong>
          <span>社区内容数量</span>
        </article>
        <el-button type="primary" round size="large" @click="openCreateDialog">
          <el-icon><Edit /></el-icon>
          发布帖子
        </el-button>
      </div>
    </section>

    <section class="section-block surface-panel filter-panel list-filter-panel">
      <div class="filter-group">
        <div class="filter-row">
          <span class="filter-label">帖子分类</span>
          <el-radio-group v-model="currentCategory" @change="handleCategoryChange">
            <el-radio-button :value="null">全部</el-radio-button>
            <el-radio-button :value="1">分享</el-radio-button>
            <el-radio-button :value="2">求助</el-radio-button>
            <el-radio-button :value="3">科普</el-radio-button>
            <el-radio-button :value="4">讨论</el-radio-button>
            <el-radio-button :value="5">其他</el-radio-button>
          </el-radio-group>
        </div>
        <span class="soft-chip">支持发布图文内容</span>
      </div>
      <div class="filter-actions">
        <el-input
          class="search-input"
          v-model="keyword"
          placeholder="搜索标题或内容"
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

    <section class="section-block community-main">
      <div class="community-main-grid">
        <div class="community-feed">
          <div v-if="loading" class="surface-panel loading-panel">
            <el-skeleton :rows="6" animated />
          </div>

          <section v-else>
            <div v-if="posts.length" class="community-list">
              <article v-for="post in posts" :key="post.id" class="community-card" @click="router.push(`/post/${post.id}`)">
                <div class="community-thumb">
                  <img
                    v-if="post.imageUrl"
                    :src="getCosUrl(post.imageUrl)"
                    :alt="post.title"
                    @error="setImageFallback($event, postPlaceholder)"
                  />
            <div v-else class="community-empty">{{ getPostCategoryLabel(post) }}</div>
                </div>

                <div class="community-body">
            <div class="community-head">
              <div class="post-tag-row">
                <span class="soft-tag">{{ getPostCategoryLabel(post) }}</span>
                <span v-if="post.type === 2" class="notice-tag">公告</span>
              </div>
              <span class="community-time">{{ formatTime(post.createTime) }}</span>
            </div>
                  <h3>{{ post.title }}</h3>
                  <p>{{ truncate(post.content, 120) }}</p>
                  <div class="community-footer">
                    <div class="author-info">
                      <el-avatar v-if="post.avatar" :size="28" :src="getCosUrl(post.avatar)" />
                      <el-avatar v-else :size="28" class="author-fallback">
                        {{ post.username?.charAt(0)?.toUpperCase() || 'U' }}
                      </el-avatar>
                      <span>{{ post.username || '匿名用户' }}</span>
                    </div>
                    <div class="community-stats">
                      <span>点赞 {{ post.likeCount || 0 }}</span>
                      <span>评论 {{ post.commentCount || 0 }}</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <el-empty v-else class="surface-panel empty-panel" description="暂无帖子，快来发布第一条内容吧" :image-size="110" />
          </section>

          <div class="pagination-wrap" v-if="total > 0">
            <el-pagination
              v-model:current-page="page"
              :page-size="pageSize"
              :total="total"
              layout="prev, pager, next"
              @current-change="fetchPosts"
              background
            />
          </div>
        </div>

        <aside class="community-aside">
          <div class="community-spotlight">
            <div class="spotlight-shell">
              <div class="spotlight-grid">
              <div class="surface-panel hot-panel">
                <div class="panel-header">
                  <div>
                    <h3>热榜</h3>
                    <p>按点赞与评论热度排序</p>
                  </div>
                </div>
                <div v-if="hotLoading" class="panel-loading">
                  <el-skeleton :rows="4" animated />
                </div>
                <div v-else>
                  <div v-if="hotPosts.length" class="hot-list">
                    <article class="hot-item" v-for="(post, idx) in hotPosts" :key="post.id" @click="router.push(`/post/${post.id}`)">
                      <span class="hot-rank">#{{ idx + 1 }}</span>
                      <div class="hot-content">
                        <h4>{{ post.title }}</h4>
                        <div class="hot-meta">
                          <span>{{ getPostCategoryLabel(post) }}</span>
                          <span>👍 {{ post.likeCount || 0 }}</span>
                          <span>💬 {{ post.commentCount || 0 }}</span>
                        </div>
                      </div>
                    </article>
                  </div>
                  <el-empty v-else description="暂无热榜内容" :image-size="80" />
                </div>
              </div>

              <div class="surface-panel notice-panel">
                <div class="panel-header">
                  <div>
                    <h3>公告专区</h3>
                    <p>社区运营信息与活动提醒</p>
                  </div>
                </div>
                <div v-if="noticeLoading" class="panel-loading">
                  <el-skeleton :rows="4" animated />
                </div>
                <div v-else>
                  <div v-if="noticePosts.length" class="notice-list">
                    <article class="notice-item" v-for="notice in noticePosts" :key="notice.id" @click="router.push(`/post/${notice.id}`)">
                      <div class="notice-title">
                        <span class="notice-dot"></span>
                        {{ notice.title }}
                      </div>
                      <div class="notice-time">{{ formatTime(notice.createTime) }}</div>
                    </article>
                  </div>
                  <el-empty v-else description="暂无公告" :image-size="80" />
                </div>
              </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <el-dialog v-model="showCreate" title="发布帖子" width="560px" :close-on-click-modal="false">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="分类" prop="category">
          <el-radio-group v-model="createForm.category">
            <el-radio :value="1">分享</el-radio>
            <el-radio :value="2">求助</el-radio>
            <el-radio :value="3">科普</el-radio>
            <el-radio :value="4">讨论</el-radio>
            <el-radio :value="5">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="createForm.title" maxlength="50" show-word-limit placeholder="请输入帖子标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="createForm.content"
            type="textarea"
            :rows="6"
            maxlength="2000"
            show-word-limit
            placeholder="分享你的养宠故事或提问内容"
          />
        </el-form-item>
        <el-form-item label="图片" prop="imageUrl">
          <el-upload
            class="post-image-uploader"
            action="/api/cos/upload?type=post"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :on-error="handleImageError"
            :before-upload="beforeImageUpload"
          >
            <img v-if="createForm.imageUrl" :src="getCosUrl(createForm.imageUrl)" class="post-image" />
            <div v-else class="post-upload-placeholder">
              <el-icon class="post-upload-icon">
                <Plus />
              </el-icon>
              <span>添加图片</span>
            </div>
          </el-upload>
          <div class="upload-tip">支持 JPG/PNG/WEBP 格式，不超过 5MB</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit, Plus } from '@element-plus/icons-vue'
import { createPost, getHotPostPage, getNoticePage, getPostPage } from '@/api/post'
import { getCosUrl } from '@/utils/request'
import { createSvgPlaceholder } from '@/utils/placeholders'

const router = useRouter()
const posts = ref([])
const total = ref(0)
const loading = ref(false)
const currentCategory = ref(null)
const page = ref(1)
const pageSize = 10
const keyword = ref('')
const hotPosts = ref([])
const noticePosts = ref([])
const hotLoading = ref(false)
const noticeLoading = ref(false)

const showCreate = ref(false)
const creating = ref(false)
const createFormRef = ref(null)

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

const postPlaceholder = createSvgPlaceholder('POST', '#e9f0f8', '#416894', 420, 320)

const createForm = reactive({
  category: 1,
  title: '',
  content: '',
  imageUrl: ''
})

const createRules = {
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度应为 2-50 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 5, message: '内容至少 5 个字', trigger: 'blur' }
  ]
}

const handleImageSuccess = (response) => {
  if (response?.code === 200) {
    createForm.imageUrl = response.data
    ElMessage.success('上传成功')
  } else {
    ElMessage.error('上传失败: ' + (response?.message || response?.msg || '未知错误'))
  }
}

const handleImageError = () => {
  ElMessage.error('上传失败，请稍后重试')
}

const beforeImageUpload = (rawFile) => {
  const isValidFormat = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png' || rawFile.type === 'image/webp'
  const isLt5M = rawFile.size / 1024 / 1024 < 5

  if (!isValidFormat) {
    ElMessage.error('上传图片只能是 JPG/PNG/WEBP 格式!')
  }
  if (!isLt5M) {
    ElMessage.error('上传图片大小不能超过 5MB!')
  }
  return isValidFormat && isLt5M
}

const postCategoryLabel = (category) => {
  const map = {
    1: '分享',
    2: '求助',
    3: '科普',
    4: '讨论',
    5: '其他'
  }
  return map[category] || '内容'
}

const getPostCategoryLabel = (post) => {
  if (!post) return '内容'
  const category = post.category ?? post.type
  return postCategoryLabel(category)
}

const truncate = (text, length) => {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length)}...` : text
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const setImageFallback = (event, fallback) => {
  if (event?.target && event.target.src !== fallback) {
    event.target.src = fallback
  }
}

const handleCategoryChange = () => {
  handleSearch()
}

const handleSearch = () => {
  page.value = 1
  fetchPosts()
}

const fetchHotPosts = async () => {
  hotLoading.value = true
  try {
    const res = await getHotPostPage({ page: 1, pageSize: 5 })
    if (res.code === 200) {
      hotPosts.value = res.data?.records || []
    }
  } catch (error) {
    console.error('获取热榜失败', error)
  } finally {
    hotLoading.value = false
  }
}

const fetchNoticePosts = async () => {
  noticeLoading.value = true
  try {
    const res = await getNoticePage({ page: 1, pageSize: 5 })
    if (res.code === 200) {
      noticePosts.value = res.data?.records || []
    }
  } catch (error) {
    console.error('获取公告失败', error)
  } finally {
    noticeLoading.value = false
  }
}

const fetchPosts = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (currentCategory.value) params.category = currentCategory.value
    if (keyword.value) params.keyword = keyword.value

    const res = await getPostPage(params)
    if (res.code === 200) {
      posts.value = res.data?.records || []
      total.value = res.data?.total || 0
    }
  } catch (error) {
    console.error('获取帖子列表失败', error)
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: '/community' } })
    return
  }

  createForm.category = 1
  createForm.title = ''
  createForm.content = ''
  createForm.imageUrl = ''
  showCreate.value = true
}

const handleCreate = async () => {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return

  creating.value = true
  try {
    const res = await createPost({
      category: createForm.category,
      title: createForm.title,
      content: createForm.content,
      imageUrl: createForm.imageUrl || null
    })

    if (res.code === 200) {
      ElMessage.success('发布成功')
      showCreate.value = false
      page.value = 1
      fetchPosts()
    } else {
      ElMessage.error(res.message || '发布失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '发布失败，请稍后重试')
  } finally {
    creating.value = false
  }
}

onMounted(fetchPosts)
onMounted(fetchHotPosts)
onMounted(fetchNoticePosts)
</script>

<style scoped>
.community-page {
  max-width: 1240px;
  padding-bottom: 32px;
}

.community-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
  align-items: start;
}

.community-feed {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.community-aside {
  display: flex;
  width: 100%;
}

.list-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-end;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.hero-summary-card {
  min-width: 150px;
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
  flex-wrap: wrap;
  padding: 6px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(65, 90, 130, 0.08);
}

.filter-label {
  color: var(--ink-body);
  font-size: 14px;
  font-weight: 700;
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

.community-list {
  display: grid;
  gap: 16px;
}

.community-spotlight {
  margin-top: 0;
  width: 100%;
}

.spotlight-shell {
  width: 100%;
  padding: 12px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(224, 234, 248, 0.65), rgba(255, 255, 255, 0.96));
  border: 1px solid rgba(61, 95, 140, 0.08);
  box-shadow: 0 18px 40px rgba(37, 54, 74, 0.08);
}

.spotlight-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  width: 100%;
}

.community-spotlight .surface-panel {
  border-radius: 22px;
  border: 1px solid rgba(61, 95, 140, 0.1);
  background: #fff;
  box-shadow: 0 14px 26px rgba(37, 54, 74, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding: 0 2px 10px;
  border-radius: 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(61, 95, 140, 0.12);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  position: relative;
  padding-left: 18px;
  color: var(--ink-strong);
}

.panel-header h3::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #3f6fb0, #6c8bd9);
  box-shadow: 0 0 0 4px rgba(63, 111, 176, 0.12);
}

.notice-panel .panel-header h3::before {
  background: linear-gradient(135deg, #6a8fcb, #86b0e4);
  box-shadow: 0 0 0 6px rgba(134, 176, 228, 0.14);
}

.panel-header p {
  margin: 0;
  color: var(--ink-muted);
  font-size: 11px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: none;
  white-space: nowrap;
}

.panel-loading {
  padding: 12px 0;
}

.hot-list,
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hot-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(61, 95, 140, 0.08);
  background: #fff;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hot-item::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(75, 121, 194, 0.6), rgba(75, 121, 194, 0.1));
}

.hot-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.hot-rank {
  min-width: 30px;
  height: 30px;
  border-radius: 9px;
  background: rgba(95, 136, 198, 0.12);
  color: #2e507d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
}

.hot-content h4 {
  margin: 0 0 4px;
  font-size: 13px;
  color: var(--ink-strong);
}

.hot-meta {
  display: flex;
  gap: 10px;
  color: var(--ink-muted);
  font-size: 11px;
}

.notice-item {
  position: relative;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(61, 95, 140, 0.08);
  background: #fff;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.notice-item::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(106, 143, 203, 0.6), rgba(106, 143, 203, 0.12));
}

.notice-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.notice-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-strong);
  margin-bottom: 0;
}

.notice-time {
  font-size: 11px;
  color: var(--ink-muted);
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(95, 136, 198, 0.1);
  border: 1px solid rgba(95, 136, 198, 0.18);
  white-space: nowrap;
}

.notice-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #6a8fcb, #86b0e4);
  box-shadow: 0 0 0 6px rgba(134, 176, 228, 0.18);
}

.community-card {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.community-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.community-thumb {
  overflow: hidden;
  border-radius: 18px;
  min-height: 156px;
  background: var(--surface-soft);
}

.community-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.community-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--brand-strong);
  font-weight: 700;
  background: linear-gradient(135deg, #edf3fb, #f9fbff);
}

.community-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.community-head,
.community-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.community-time,
.community-stats span {
  color: var(--ink-muted);
  font-size: 13px;
}

.community-body h3 {
  margin: 14px 0 10px;
  font-size: 20px;
}

.community-body p {
  color: var(--ink-body);
  line-height: 1.75;
  flex: 1;
}

.post-tag-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* ========== Upload ========== */
.post-image-uploader :deep(.el-upload) {
  width: 160px;
  height: 120px;
  border-radius: 16px;
  border: 1px dashed var(--line-soft);
  background: var(--surface-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.post-image-uploader :deep(.el-upload:hover) {
  border-color: var(--brand-strong);
  background: #fff;
  box-shadow: 0 10px 22px rgba(37, 54, 74, 0.08);
}

.post-image {
  width: 160px;
  height: 120px;
  object-fit: cover;
  border-radius: 14px;
  display: block;
}

.post-upload-placeholder {
  width: 160px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--ink-muted);
  font-size: 12px;
}

.post-upload-icon {
  font-size: 24px;
  color: var(--ink-muted);
}

.upload-tip {
  margin-top: 8px;
  color: var(--ink-muted);
  font-size: 12px;
}

.community-footer {
  margin-top: 14px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink-body);
  font-size: 14px;
}

.author-fallback {
  background: linear-gradient(135deg, #5f88c6, #7aa0d8);
  color: #fff;
}

.community-stats {
  display: flex;
  gap: 14px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 28px 0 8px;
}

@media (max-width: 900px) {
  .list-hero,
  .list-filter-panel,
  .hero-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .community-main-grid {
    grid-template-columns: 1fr;
  }

  .community-aside {
    order: 2;
  }

  .filter-actions {
    width: 100%;
    min-width: 0;
  }

  .community-card {
    grid-template-columns: 1fr;
  }

  .community-thumb {
    min-height: 200px;
  }

  .community-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .list-filter-panel {
    padding: 18px;
  }
}
</style>
