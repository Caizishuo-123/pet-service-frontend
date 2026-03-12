<template>
  <div class="post-detail-page" v-loading="loading">
    <!-- 返回 -->
    <div class="back-bar">
      <el-button text @click="router.back()">
        <el-icon>
          <ArrowLeft />
        </el-icon> 返回社区
      </el-button>
    </div>

    <template v-if="post">
      <!-- 帖子主体 -->
      <div class="post-main">
        <div class="post-header">
          <el-tag :type="postTypeTag(post.type)" size="small" effect="plain">
            {{ postTypeLabel(post.type) }}
          </el-tag>
          <h1 class="post-title">{{ post.title }}</h1>
        </div>

        <div class="post-author-bar">
          <div class="author-info">
            <el-avatar :size="36" :src="getCosUrl(post.avatar)" v-if="post.avatar" />
            <el-avatar :size="36" style="background:#409EFF;" v-else>
              {{ post.username?.charAt(0)?.toUpperCase() || 'U' }}
            </el-avatar>
            <div class="author-text">
              <span class="author-name">{{ post.username || '匿名' }}</span>
              <span class="author-time">{{ formatTime(post.createTime) }}</span>
            </div>
          </div>
          <div class="post-actions">
            <el-button :type="liked ? 'danger' : 'default'" round size="small" @click="handleLike">
              {{ liked ? '❤️' : '🤍' }} {{ post.likeCount || 0 }}
            </el-button>
            <el-button v-if="isMyPost" type="danger" text size="small" @click="handleDeletePost">
              删除帖子
            </el-button>
          </div>
        </div>

        <!-- 帖子图片 -->
        <div class="post-image" v-if="post.imageUrl">
          <img :src="getCosUrl(post.imageUrl)" :alt="post.title"
            @error="(e) => e.target.src = 'https://via.placeholder.com/800x400?text=📷'" />
        </div>

        <!-- 帖子正文 -->
        <div class="post-content">
          <p>{{ post.content }}</p>
        </div>
      </div>

      <!-- 评论区 -->
      <div class="comment-section">
        <h3 class="comment-title">💬 评论 ({{ commentTotal }})</h3>

        <!-- 发表评论 -->
        <div class="comment-input-area">
          <el-input v-model="commentText" type="textarea" :rows="3" placeholder="写下你的评论..." maxlength="500"
            show-word-limit />
          <el-button type="primary" :loading="commenting" @click="handleAddComment" :disabled="!commentText.trim()"
            style="margin-top:8px;">
            发表评论
          </el-button>
        </div>

        <!-- 评论列表 -->
        <div class="comment-list" v-if="comments.length">
          <div class="comment-item" v-for="c in comments" :key="c.id">
            <div class="comment-avatar">
              <el-avatar :size="32" :src="getCosUrl(c.avatar)" v-if="c.avatar" />
              <el-avatar :size="32" style="background:#67c23a;font-size:12px;" v-else>
                {{ c.username?.charAt(0)?.toUpperCase() || 'U' }}
              </el-avatar>
            </div>
            <div class="comment-body">
              <div class="comment-meta">
                <span class="comment-author">{{ c.username || '匿名' }}</span>
                <span class="comment-time">{{ formatTime(c.createTime) }}</span>
                <el-button v-if="isMyComment(c)" text type="danger" size="small" @click="handleDeleteComment(c)"
                  class="comment-del-btn">
                  删除
                </el-button>
              </div>
              <p class="comment-text">{{ c.content }}</p>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无评论，快来发表第一条吧" :image-size="60" />

        <!-- 评论分页 -->
        <div class="pagination-wrap" v-if="commentTotal > commentPageSize">
          <el-pagination v-model:current-page="commentPage" :page-size="commentPageSize" :total="commentTotal"
            layout="prev, pager, next" @current-change="fetchComments" background small />
        </div>
      </div>
    </template>

    <el-empty v-else-if="!loading" description="帖子不存在或已被删除" :image-size="120">
      <el-button type="primary" @click="router.push('/community')">返回社区</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostDetail, deletePost, getComments, addComment, deleteComment, toggleLike, getLikeStatus } from '@/api/post'
import { getCosUrl } from '@/utils/request'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const post = ref(null)
const loading = ref(true)
const liked = ref(false)

// 评论
const comments = ref([])
const commentTotal = ref(0)
const commentPage = ref(1)
const commentPageSize = 10
const commentText = ref('')
const commenting = ref(false)

const isMyPost = computed(() => {
  return post.value?.username && userStore.username === post.value.username
})

const isMyComment = (c) => {
  return c.username && userStore.username === c.username
}

const postTypeLabel = (t) => {
  const map = { 1: '📸 晒宠', 2: '❓ 求助', 3: '📖 科普' }
  return map[t] || '其他'
}

const postTypeTag = (t) => {
  const map = { 1: 'warning', 2: 'danger', 3: 'success' }
  return map[t] || 'info'
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ===== 数据加载 =====
const fetchPost = async () => {
  try {
    const res = await getPostDetail(route.params.id)
    if (res.code === 200) {
      post.value = res.data
    }
  } catch (e) {
    console.error('获取帖子详情失败', e)
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  try {
    const res = await getComments({ postId: route.params.id, page: commentPage.value, pageSize: commentPageSize })
    if (res.code === 200) {
      comments.value = res.data?.records || []
      commentTotal.value = res.data?.total || 0
    }
  } catch (e) {
    console.error('获取评论失败', e)
  }
}

const fetchLikeStatus = async () => {
  if (!localStorage.getItem('token')) return
  try {
    const res = await getLikeStatus(route.params.id)
    if (res.code === 200) {
      liked.value = res.data === true
    }
  } catch (e) {
    // 未登录时忽略
  }
}

// ===== 操作 =====
const handleLike = async () => {
  if (!localStorage.getItem('token')) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  try {
    const res = await toggleLike(route.params.id)
    if (res.code === 200) {
      liked.value = !liked.value
      if (post.value) {
        post.value.likeCount = (post.value.likeCount || 0) + (liked.value ? 1 : -1)
      }
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleAddComment = async () => {
  if (!localStorage.getItem('token')) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (!commentText.value.trim()) return

  commenting.value = true
  try {
    const res = await addComment({ postId: Number(route.params.id), content: commentText.value })
    if (res.code === 200) {
      ElMessage.success('评论成功')
      commentText.value = ''
      commentPage.value = 1
      fetchComments()
    } else {
      ElMessage.error(res.message || '评论失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '评论失败')
  } finally {
    commenting.value = false
  }
}

const handleDeleteComment = async (c) => {
  try {
    await ElMessageBox.confirm('确定删除这条评论吗？', '删除评论', { type: 'warning' })
  } catch { return }

  try {
    const res = await deleteComment(c.id)
    if (res.code === 200) {
      ElMessage.success('已删除')
      fetchComments()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '删除失败')
  }
}

const handleDeletePost = async () => {
  try {
    await ElMessageBox.confirm('确定删除这篇帖子吗？删除后不可恢复。', '删除帖子', { type: 'warning' })
  } catch { return }

  try {
    const res = await deletePost(route.params.id)
    if (res.code === 200) {
      ElMessage.success('帖子已删除')
      router.push('/community')
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '删除失败')
  }
}

onMounted(() => {
  fetchPost()
  fetchComments()
  fetchLikeStatus()
})
</script>

<style scoped>
.post-detail-page {
  max-width: 800px;
  margin: 0 auto;
}

.back-bar {
  margin-bottom: 16px;
}

/* ========== Post Main ========== */
.post-main {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.post-title {
  font-size: 24px;
  font-weight: 800;
  color: #1f2937;
}

.post-author-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f2f3f5;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-text {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.author-time {
  font-size: 12px;
  color: #c0c4cc;
}

.post-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-image {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  max-height: 500px;
}

.post-image img {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
}

.post-content {
  font-size: 15px;
  color: #303133;
  line-height: 1.8;
  white-space: pre-wrap;
}

/* ========== Comment Section ========== */
.comment-section {
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.comment-title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 20px;
}

.comment-input-area {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f2f3f5;
}

/* ========== Comment List ========== */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
  min-width: 0;
  padding-bottom: 14px;
  border-bottom: 1px solid #fafafa;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.comment-author {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #c0c4cc;
}

.comment-del-btn {
  margin-left: auto;
  font-size: 12px;
}

.comment-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 20px 0 4px;
}
</style>
