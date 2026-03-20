<template>
  <div class="my-pets-page page-shell">
    <section class="page-hero pets-hero">
      <div class="hero-copy">
        <span class="page-kicker">我的宠物</span>
        <h1 class="page-title">管理你的宠物档案</h1>
        <p class="page-desc">记录宠物信息与健康状态，预约服务时选择更方便。</p>
      </div>
      <div class="hero-tags">
        <span class="soft-chip">共 {{ total }} 只宠物</span>
        <span class="soft-chip">支持上传照片与描述</span>
      </div>
    </section>

    <section class="surface-panel pets-panel">
      <div class="section-heading pets-heading">
        <div>
          <h2>宠物档案</h2>
          <p>卡片化展示更清晰，支持编辑与快速管理。</p>
        </div>
        <el-button type="primary" round @click="openForm(null)">
          <el-icon>
            <Plus />
          </el-icon>
          添加宠物
        </el-button>
      </div>

      <div v-if="loading" class="loading-area">
        <el-skeleton :rows="4" animated />
      </div>

      <template v-else>
        <div v-if="pets.length" class="pet-grid card-grid-3">
          <article class="pet-card" v-for="pet in pets" :key="pet.id">
            <div class="pet-media">
              <img :src="getCosUrl(pet.image)" :alt="pet.name"
                @error="(e) => e.target.src = 'https://via.placeholder.com/300x200?text=pet'" />
              <span class="pet-badge pet-type">{{ pet.type === 1 ? '猫咪' : '狗狗' }}</span>
              <span class="pet-badge pet-status" :data-status="pet.status">{{ statusLabel(pet.status) }}</span>
            </div>
            <div class="pet-body">
              <div class="pet-title-row">
                <h3 class="pet-name">{{ pet.name }}</h3>
                <span class="pet-age">{{ pet.age ? `${pet.age} 岁` : '年龄未知' }}</span>
              </div>
              <p class="pet-meta">{{ pet.breed || '品种待补充' }} · {{ pet.gender === 1 ? '公' : '母' }}</p>
              <div class="pet-meta-row">
                <span>健康：{{ pet.source === 2 ? healthSummary(pet.healthStatus) : healthLabel(pet.healthStatus) }}</span>
                <span>状态：{{ statusLabel(pet.status) }}</span>
                <span>来源：{{ sourceLabel(pet.source) }}</span>
              </div>
              <div class="pet-card-actions">
                <el-button type="primary" text size="small" @click="openForm(pet)">编辑</el-button>
                <el-button type="danger" text size="small" @click="handleDelete(pet)">删除</el-button>
              </div>
            </div>
          </article>
        </div>

        <el-empty v-else description="还没有宠物，快来添加一只吧！" :image-size="120">
          <el-button type="primary" @click="openForm(null)">添加宠物</el-button>
        </el-empty>
      </template>
    </section>

    <div class="pagination-wrap" v-if="total > pageSize">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next"
        @current-change="fetchPets" background />
    </div>

    <el-dialog v-model="showForm" :title="isEdit ? '编辑宠物' : '添加宠物'" width="520px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px" size="large">
        <el-form-item label="名字" prop="name">
          <el-input v-model="form.name" placeholder="请输入宠物名字" maxlength="20" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio :value="1">猫咪</el-radio>
            <el-radio :value="2">狗狗</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="品种" prop="breed">
          <el-input v-model="form.breed" placeholder="如：金毛、布偶猫等" maxlength="30" />
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="form.age" :min="0" :max="30" placeholder="岁" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio :value="1">公</el-radio>
            <el-radio :value="2">母</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="健康" prop="healthStatus">
          <el-select v-model="form.healthStatus" placeholder="请选择健康状态" style="width:100%">
            <el-option label="健康" :value="1" />
            <el-option label="亚健康" :value="2" />
            <el-option label="生病" :value="3" />
            <el-option label="残疾" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="图片" prop="image">
          <el-upload
            class="pet-image-uploader"
            action="/api/cos/upload?type=pet"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :on-error="handleImageError"
            :before-upload="beforeImageUpload"
          >
            <img v-if="form.image" :src="getCosUrl(form.image)" class="pet-image" />
            <div v-else class="pet-upload-placeholder">
              <el-icon class="pet-upload-icon">
                <Plus />
              </el-icon>
              <span>添加图片</span>
            </div>
          </el-upload>
          <div class="upload-tip">支持 JPG/PNG/WEBP 格式，不超过 5MB</div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="描述一下宠物的性格、特点（选填）" maxlength="500"
            show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '确认添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getMyPets, addPet, updatePet, deletePet } from '@/api/pet'
import { getCosUrl } from '@/utils/request'
import { getHealthStatusSummary } from '@/utils/healthStatus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const pets = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = 9

const showForm = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const editId = ref(null)

const form = reactive({
  name: '',
  type: 1,
  breed: '',
  age: null,
  gender: 1,
  healthStatus: 1,
  image: '',
  description: ''
})

const formRules = {
  name: [{ required: true, message: '请输入宠物名字', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  healthStatus: [{ required: true, message: '请选择健康状态', trigger: 'change' }]
}

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

const handleImageSuccess = (response) => {
  if (response?.code === 200) {
    form.image = response.data
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

const statusLabel = (s) => {
  const map = { 1: '正常', 2: '待领养', 3: '已领养' }
  return map[s] || '未知'
}

const statusTagType = (s) => {
  const map = { 1: 'success', 2: 'warning', 3: 'info' }
  return map[s] || 'info'
}

const healthLabel = (h) => {
  const map = { 1: '健康', 2: '亚健康', 3: '生病', 4: '残疾' }
  return map[h] || '未知'
}

const healthSummary = (status) => {
  const summary = getHealthStatusSummary(status)
  return summary || '状态待更新'
}

const sourceLabel = (source) => {
  const map = { 1: '自有', 2: '领养' }
  return map[source] || '未知'
}

const fetchPets = async () => {
  loading.value = true
  try {
    const res = await getMyPets(page.value, pageSize)
    if (res.code === 200) {
      pets.value = res.data?.records || []
      total.value = res.data?.total || 0
    }
  } catch (e) {
    console.error('获取宠物列表失败', e)
  } finally {
    loading.value = false
  }
}

const openForm = (pet) => {
  if (pet) {
    isEdit.value = true
    editId.value = pet.id
    Object.assign(form, {
      name: pet.name,
      type: pet.type,
      breed: pet.breed || '',
      age: pet.age,
      gender: pet.gender,
      healthStatus: pet.healthStatus,
      image: pet.image || '',
      description: pet.description || ''
    })
  } else {
    isEdit.value = false
    editId.value = null
    Object.assign(form, {
      name: '',
      type: 1,
      breed: '',
      age: null,
      gender: 1,
      healthStatus: 1,
      image: '',
      description: ''
    })
  }
  showForm.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = { ...form }
    if (isEdit.value) data.id = editId.value

    const res = isEdit.value ? await updatePet(data) : await addPet(data)
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
      showForm.value = false
      fetchPets()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (pet) => {
  try {
    await ElMessageBox.confirm(`确定要删除「${pet.name}」吗？删除后不可恢复。`, '删除宠物', { type: 'warning' })
  } catch { return }

  try {
    const res = await deletePet(pet.id)
    if (res.code === 200) {
      ElMessage.success('已删除')
      fetchPets()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '删除失败')
  }
}

onMounted(() => fetchPets())
</script>

<style scoped>
.my-pets-page {
  padding-bottom: 24px;
}

.pets-hero {
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

.pets-panel {
  padding: 28px;
  border-radius: var(--radius-lg);
}

.pets-heading {
  margin-bottom: 24px;
}

.pets-heading h2 {
  margin: 8px 0 10px;
  font-size: 26px;
}

.pets-heading p {
  margin: 0;
  color: var(--ink-body);
}

/* ========== Upload ========== */
.pet-image-uploader :deep(.el-upload) {
  width: 140px;
  height: 140px;
  border-radius: 16px;
  border: 1px dashed var(--line-soft);
  background: var(--surface-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.pet-image-uploader :deep(.el-upload:hover) {
  border-color: var(--brand-strong);
  background: #fff;
  box-shadow: 0 10px 22px rgba(37, 54, 74, 0.08);
}

.pet-image {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 14px;
  display: block;
}

.pet-upload-placeholder {
  width: 140px;
  height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--ink-muted);
  font-size: 12px;
}

.pet-upload-icon {
  font-size: 24px;
  color: var(--ink-muted);
}

.upload-tip {
  margin-top: 8px;
  color: var(--ink-muted);
  font-size: 12px;
}

/* ========== Pet Cards ========== */
.pet-grid {
  margin-top: 8px;
}

.pet-card {
  background: var(--surface-strong);
  border-radius: var(--radius-md);
  border: 1px solid var(--line-soft);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pet-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.pet-media {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(95, 136, 198, 0.12), rgba(241, 221, 194, 0.2));
}

.pet-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.pet-card:hover .pet-media img {
  transform: scale(1.05);
}

.pet-badge {
  position: absolute;
  top: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.92);
  color: var(--ink-strong);
  border: 1px solid var(--line-soft);
  box-shadow: 0 6px 16px rgba(37, 54, 74, 0.12);
}

.pet-type {
  left: 12px;
}

.pet-status {
  right: 12px;
}

.pet-status[data-status="1"] {
  background: rgba(68, 169, 120, 0.12);
  color: #2f7a59;
  border-color: rgba(68, 169, 120, 0.2);
}

.pet-status[data-status="2"] {
  background: rgba(236, 169, 64, 0.16);
  color: #9b5a18;
  border-color: rgba(236, 169, 64, 0.25);
}

.pet-status[data-status="3"] {
  background: rgba(124, 136, 154, 0.18);
  color: #5b6675;
  border-color: rgba(124, 136, 154, 0.24);
}

.pet-body {
  padding: 16px 18px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pet-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.pet-name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink-strong);
}

.pet-age {
  font-size: 13px;
  color: var(--ink-muted);
  background: var(--surface-soft);
  padding: 4px 10px;
  border-radius: 999px;
}

.pet-meta {
  margin: 0;
  color: var(--ink-body);
  font-size: 13px;
}

.pet-meta-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--ink-muted);
  font-size: 12px;
  flex-wrap: wrap;
}

.pet-card-actions {
  display: flex;
  gap: 6px;
  border-top: 1px solid var(--line-soft);
  padding-top: 10px;
  margin-top: 6px;
}

/* ========== Other ========== */
.loading-area {
  padding: 40px 0;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 24px 0 16px;
}

@media (max-width: 960px) {
  .pets-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .pets-panel {
    padding: 22px;
  }
}

@media (max-width: 640px) {
  .pet-title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .pet-meta-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
