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
      <div class="filter-row">
        <span class="filter-label">帖子分类</span>
        <el-radio-group v-model="currentType" @change="handleTypeChange">
          <el-radio-button :value="null">全部</el-radio-button>
          <el-radio-button :value="1">晒宠</el-radio-button>
          <el-radio-button :value="2">求助</el-radio-button>
          <el-radio-button :value="3">科普</el-radio-button>
        </el-radio-group>
      </div>
      <span class="soft-chip">支持发布图文内容</span>
    </section>

    <div v-if="loading" class="section-block surface-panel loading-panel">
      <el-skeleton :rows="6" animated />
    </div>

    <section v-else class="section-block">
      <div v-if="posts.length" class="community-list">
        <article v-for="post in posts" :key="post.id" class="community-card" @click="router.push(`/post/${post.id}`)">
          <div class="community-thumb">
            <img
              v-if="post.imageUrl"
              :src="getCosUrl(post.imageUrl)"
              :alt="post.title"
              @error="setImageFallback($event, postPlaceholder)"
            />
            <div v-else class="community-empty">{{ postTypeLabel(post.type) }}</div>
          </div>

          <div class="community-body">
            <div class="community-head">
              <span class="soft-tag">{{ postTypeLabel(post.type) }}</span>
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

    <el-dialog v-model="showCreate" title="发布帖子" width="560px" :close-on-click-modal="false">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="分类" prop="type">
          <el-radio-group v-model="createForm.type">
            <el-radio :value="1">晒宠</el-radio>
            <el-radio :value="2">求助</el-radio>
            <el-radio :value="3">科普</el-radio>
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
        <el-form-item label="图片链接" prop="imageUrl">
          <el-input v-model="createForm.imageUrl" placeholder="选填：填写图片 URL" />
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
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import { createPost, getPostPage } from '@/api/post'
import { getCosUrl } from '@/utils/request'
import { createSvgPlaceholder } from '@/utils/placeholders'

const router = useRouter()
const posts = ref([])
const total = ref(0)
const loading = ref(false)
const currentType = ref(null)
const page = ref(1)
const pageSize = 10

const showCreate = ref(false)
const creating = ref(false)
const createFormRef = ref(null)

const postPlaceholder = createSvgPlaceholder('POST', '#e9f0f8', '#416894', 420, 320)

const createForm = reactive({
  type: 1,
  title: '',
  content: '',
  imageUrl: ''
})

const createRules = {
  type: [{ required: true, message: '请选择分类', trigger: 'change' }],
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度应为 2-50 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 5, message: '内容至少 5 个字', trigger: 'blur' }
  ]
}

const postTypeLabel = (type) => {
  const map = {
    1: '晒宠',
    2: '求助',
    3: '科普'
  }
  return map[type] || '内容'
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

const handleTypeChange = () => {
  page.value = 1
  fetchPosts()
}

const fetchPosts = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (currentType.value) params.type = currentType.value

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

  createForm.type = 1
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
      type: createForm.type,
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
</script>

<style scoped>
.community-page {
  max-width: 1080px;
  padding-bottom: 32px;
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

.community-list {
  display: grid;
  gap: 16px;
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
