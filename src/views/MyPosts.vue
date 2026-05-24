<template>
  <div class="my-posts-page page-shell">
    <section class="page-hero posts-hero">
      <div class="hero-copy">
        <span class="page-kicker">我的帖子</span>
        <h1 class="page-title">管理你的社区内容</h1>
        <p class="page-desc">集中查看自己发布的帖子，支持按分类筛选、编辑和删除。</p>
      </div>
    </section>

    <section class="surface-panel posts-panel">
      <div class="section-heading posts-heading">
        <div>
          <h2>帖子列表</h2>
          <p>你的社区内容在这里集中管理。</p>
        </div>
        <div class="filter-shell">
          <el-radio-group v-model="currentCategory" @change="handleCategoryChange" size="large">
            <el-radio-button :value="null">全部</el-radio-button>
            <el-radio-button :value="1">分享</el-radio-button>
            <el-radio-button :value="2">求助</el-radio-button>
            <el-radio-button :value="3">科普</el-radio-button>
            <el-radio-button :value="4">讨论</el-radio-button>
            <el-radio-button :value="5">其他</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div v-if="loading" class="loading-area">
        <el-skeleton :rows="5" animated />
      </div>

      <template v-else>
        <div v-if="posts.length" class="post-list">
          <article class="post-card" v-for="post in posts" :key="post.id">
            <div class="post-thumb" @click="goDetail(post.id)">
              <img
                v-if="post.imageUrl"
                :src="getCosUrl(post.imageUrl)"
                :alt="post.title"
                @error="setImageFallback($event, postPlaceholder)"
              />
              <div v-else class="post-empty">{{ postCategoryLabel(post.category ?? post.type) }}</div>
            </div>

            <div class="post-body">
              <div class="post-head">
                <span class="soft-tag">{{ postCategoryLabel(post.category ?? post.type) }}</span>
                <span class="post-time">{{ formatTime(post.createTime) }}</span>
              </div>
              <h3 class="post-title" @click="goDetail(post.id)">{{ post.title }}</h3>
              <p class="post-desc">{{ truncate(post.content, 120) }}</p>
              <div class="post-footer">
                <div class="post-stats">
                  <span>点赞 {{ post.likeCount || 0 }}</span>
                  <span v-if="post.commentCount !== undefined">评论 {{ post.commentCount || 0 }}</span>
                </div>
                <div class="post-actions">
                  <el-button size="small" @click="goDetail(post.id)">查看</el-button>
                  <el-button size="small" type="primary" plain @click="openEdit(post)">编辑</el-button>
                  <el-button size="small" type="danger" plain @click="handleDelete(post)">删除</el-button>
                </div>
              </div>
            </div>
          </article>
        </div>

        <el-empty v-else description="暂无帖子" :image-size="120">
          <el-button type="primary" @click="router.push('/community')">去社区发帖</el-button>
        </el-empty>
      </template>
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

    <el-dialog v-model="editVisible" title="编辑帖子" width="560px" :close-on-click-modal="false">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="分类" prop="category">
          <el-radio-group v-model="editForm.category">
            <el-radio :value="1">分享</el-radio>
            <el-radio :value="2">求助</el-radio>
            <el-radio :value="3">科普</el-radio>
            <el-radio :value="4">讨论</el-radio>
            <el-radio :value="5">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title" maxlength="50" show-word-limit placeholder="请输入帖子标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="editForm.content" type="textarea" :rows="6" maxlength="2000" show-word-limit placeholder="请输入帖子内容" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            class="post-image-uploader"
            action="/api/cos/upload?type=post"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :on-error="handleImageError"
            :before-upload="beforeImageUpload"
          >
            <img v-if="editForm.imageUrl" :src="getCosUrl(editForm.imageUrl)" class="edit-image" />
            <div v-else class="edit-upload-placeholder">添加图片</div>
          </el-upload>
          <el-button v-if="editForm.imageUrl" size="small" text type="danger" @click="editForm.imageUrl = ''">移除图片</el-button>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editing" @click="handleUpdate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deletePost, getMyPostPage, updatePost } from '@/api/post'
import { getCosUrl } from '@/utils/request'
import { createSvgPlaceholder } from '@/utils/placeholders'

const router = useRouter()
const posts = ref([])
const total = ref(0)
const loading = ref(false)
const currentCategory = ref(null)
const page = ref(1)
const pageSize = 10
const editVisible = ref(false)
const editing = ref(false)
const editFormRef = ref(null)

const editForm = reactive({
  id: null,
  category: 1,
  title: '',
  content: '',
  imageUrl: ''
})

const editRules = {
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

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

const postPlaceholder = createSvgPlaceholder('POST', '#e9f0f8', '#416894', 420, 320)

const postCategoryLabel = (category) => {
  const map = { 1: '分享', 2: '求助', 3: '科普', 4: '讨论', 5: '其他' }
  return map[category] || '内容'
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
  page.value = 1
  fetchPosts()
}

const fetchPosts = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (currentCategory.value) params.category = currentCategory.value
    const res = await getMyPostPage(params)
    if (res.code === 200) {
      posts.value = res.data?.records || []
      total.value = res.data?.total || 0
    }
  } catch (e) {
    console.error('获取我的帖子失败', e)
  } finally {
    loading.value = false
  }
}

const goDetail = (id) => {
  router.push(`/post/${id}`)
}

const openEdit = (post) => {
  editForm.id = post.id
  editForm.category = post.category || 1
  editForm.title = post.title || ''
  editForm.content = post.content || ''
  editForm.imageUrl = post.imageUrl || ''
  editVisible.value = true
}

const handleImageSuccess = (response) => {
  if (response?.code === 200) {
    editForm.imageUrl = response.data
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response?.message || '上传失败')
  }
}

const handleImageError = () => {
  ElMessage.error('上传失败，请稍后重试')
}

const beforeImageUpload = (rawFile) => {
  const isValidFormat = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png' || rawFile.type === 'image/webp'
  const isLt5M = rawFile.size / 1024 / 1024 < 5
  if (!isValidFormat) ElMessage.error('上传图片只能是 JPG/PNG/WEBP 格式')
  if (!isLt5M) ElMessage.error('上传图片大小不能超过 5MB')
  return isValidFormat && isLt5M
}

const handleUpdate = async () => {
  const valid = await editFormRef.value?.validate().catch(() => false)
  if (!valid) return
  editing.value = true
  try {
    const res = await updatePost({
      id: editForm.id,
      category: editForm.category,
      title: editForm.title,
      content: editForm.content,
      imageUrl: editForm.imageUrl || null
    })
    if (res.code === 200) {
      ElMessage.success('帖子已更新')
      editVisible.value = false
      fetchPosts()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '更新失败')
  } finally {
    editing.value = false
  }
}

const handleDelete = async (post) => {
  try {
    await ElMessageBox.confirm('确定删除这篇帖子吗？删除后不可恢复。', '删除帖子', { type: 'warning' })
  } catch {
    return
  }

  try {
    const res = await deletePost(post.id)
    if (res.code === 200) {
      ElMessage.success('帖子已删除')
      if (posts.value.length === 1 && page.value > 1) {
        page.value -= 1
      }
      fetchPosts()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '删除失败')
  }
}

onMounted(fetchPosts)
</script>

<style scoped>
.my-posts-page {
  padding-bottom: 24px;
}

.posts-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.posts-panel {
  padding: 28px;
  border-radius: var(--radius-lg);
}

.posts-heading {
  margin-bottom: 22px;
  align-items: flex-start;
}

.posts-heading h2 {
  margin: 8px 0 10px;
  font-size: 26px;
}

.posts-heading p {
  margin: 0;
  color: var(--ink-body);
}

.filter-shell {
  background: var(--surface-soft);
  padding: 6px;
  border-radius: 999px;
}

.loading-area {
  padding: 40px 0;
}

.post-list {
  display: grid;
  gap: 16px;
}

.post-card {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  box-shadow: var(--shadow-sm);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.post-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.post-thumb {
  overflow: hidden;
  border-radius: 18px;
  min-height: 156px;
  background: var(--surface-soft);
  cursor: pointer;
}

.post-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--brand-strong);
  font-weight: 700;
  background: linear-gradient(135deg, #edf3fb, #f9fbff);
}

.post-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.post-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.post-time {
  color: var(--ink-muted);
  font-size: 13px;
}

.post-title {
  margin: 14px 0 10px;
  font-size: 20px;
  cursor: pointer;
}

.post-desc {
  color: var(--ink-body);
  line-height: 1.75;
  flex: 1;
  margin: 0;
}

.post-footer {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.post-stats {
  display: flex;
  gap: 14px;
  color: var(--ink-muted);
  font-size: 13px;
}

.post-actions {
  display: flex;
  gap: 8px;
}

.post-image-uploader :deep(.el-upload) {
  width: 180px;
  height: 120px;
  border: 1px dashed var(--line-soft);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface-soft);
}

.edit-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-upload-placeholder {
  width: 180px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-muted);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 24px 0 16px;
}

@media (max-width: 960px) {
  .posts-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .posts-panel {
    padding: 22px;
  }

  .post-card {
    grid-template-columns: 1fr;
  }

  .post-thumb {
    min-height: 200px;
  }

  .post-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .posts-heading {
    gap: 12px;
  }

  .filter-shell {
    width: 100%;
  }
}
</style>
