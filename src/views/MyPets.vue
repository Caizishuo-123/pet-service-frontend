<template>
  <div class="my-pets-page page-shell">
    <section class="page-hero pets-hero">
      <div class="hero-copy">
        <span class="page-kicker">Pet Center</span>
        <h1 class="page-title">宠物档案与送养管理</h1>
        <p class="page-desc">管理自己的宠物资料，也可以单独发布送养信息，审核通过后展示到领养大厅。</p>
      </div>
      <div class="hero-tags">
        <span class="soft-chip">我的宠物 {{ archiveCount }} 只</span>
        <span class="soft-chip">送养记录 {{ adoptionCount }} 条</span>
        <span class="soft-chip">已删除 {{ deletedCount }} 条</span>
      </div>
    </section>

    <section class="surface-panel pets-panel">
      <div class="section-heading pets-heading">
        <div>
          <h2>{{ activeTab === 'archive' ? '我的宠物' : '送养管理' }}</h2>
          <p>{{ activeTab === 'archive' ? '这里展示自养宠物和领养成功后的宠物，可用于服务预约和日常资料维护。' : '这里展示待审核、可领养、已锁定、送养完成和已删除的送养记录。' }}</p>
        </div>
        <div class="heading-actions">
          <div class="view-switch">
            <button
              v-for="item in tabOptions"
              :key="item.value"
              type="button"
              class="view-chip"
              :class="{ active: activeTab === item.value }"
              @click="switchTab(item.value)"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}</strong>
            </button>
          </div>
          <el-button type="primary" round @click="openForm(null, 'normal')">
            <el-icon><Plus /></el-icon>
            添加宠物
          </el-button>
          <el-button round @click="openForm(null, 'adoption')">
            <el-icon><Plus /></el-icon>
            添加送养宠物
          </el-button>
        </div>
      </div>

      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          clearable
          placeholder="搜索宠物名称、品种或描述"
          class="filter-keyword"
          @clear="page = 1"
          @input="page = 1"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filters.type" clearable placeholder="类型" @change="page = 1">
          <el-option label="小猫" :value="1" />
          <el-option label="小狗" :value="2" />
        </el-select>
        <el-select v-model="filters.status" clearable placeholder="状态" @change="page = 1">
          <el-option v-for="item in currentStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <div v-if="loading" class="loading-area">
        <el-skeleton :rows="5" animated />
      </div>

      <template v-else>
        <div class="tips-strip">
          <span v-if="activeTab === 'archive'" class="tip-pill">“我的宠物”包含自己添加的宠物，以及领养完成后生成到你名下的宠物档案。</span>
          <span v-else class="tip-pill">送养宠物提交后先进入待审核，管理员审核通过后才会出现在领养大厅。</span>
          <span class="tip-pill">删除只会改为已删除状态，不会真正移除数据库记录。</span>
        </div>

        <div v-if="pagedPets.length" class="pet-grid card-grid-3">
          <article class="pet-card" v-for="pet in pagedPets" :key="pet.id">
            <div class="pet-media">
              <img
                :src="getCosUrl(pet.image)"
                :alt="pet.name"
                @error="(e) => e.target.src = 'https://via.placeholder.com/300x200?text=pet'"
              />
              <span class="pet-badge pet-type">{{ pet.type === 1 ? '小猫' : '小狗' }}</span>
              <span class="pet-badge pet-status" :data-status="pet.status">{{ statusLabel(pet.status) }}</span>
              <span v-if="pet.adoptionFee > 0 && isAdoptionRecord(pet)" class="pet-badge pet-fee">￥{{ Number(pet.adoptionFee).toFixed(2) }}</span>
              <span v-else-if="isAdoptionRecord(pet)" class="pet-badge pet-fee free">免费领养</span>
            </div>

            <div class="pet-body">
              <div class="pet-title-row">
                <h3 class="pet-name">{{ pet.name }}</h3>
                <span class="pet-age">{{ pet.age != null ? `${pet.age} 月龄` : '年龄未知' }}</span>
              </div>

              <p class="pet-meta">{{ pet.breed || '品种待补充' }} · {{ pet.gender === 1 ? '公' : '母' }}</p>

              <div class="pet-summary">
                <span>健康：{{ healthSummary(pet.healthStatus) || '状态待更新' }}</span>
                <span>来源：{{ sourceLabel(pet.source) }}</span>
              </div>

              <p v-if="pet.description" class="pet-description">{{ pet.description }}</p>

              <div class="pet-status-line">
                <span class="status-pill" :data-status="pet.status">{{ statusLabel(pet.status) }}</span>
                <span v-if="isAdoptionRecord(pet)" class="fee-text">领养费：{{ formatAdoptionFee(pet.adoptionFee) }}</span>
              </div>

              <div class="pet-card-actions">
                <el-tooltip :disabled="canEditPet(pet)" :content="editDisabledReason(pet)" placement="top">
                  <span class="action-wrap">
                    <el-button type="primary" text size="small" :disabled="!canEditPet(pet)" @click="openForm(pet, 'normal')">
                      编辑
                    </el-button>
                  </span>
                </el-tooltip>
                <el-button
                  v-if="canSubmitAdoption(pet)"
                  type="warning"
                  text
                  size="small"
                  @click="openAdoptionDialog(pet)"
                >
                  提交送养
                </el-button>
                <el-button
                  v-if="canCancelAdoption(pet)"
                  type="warning"
                  text
                  size="small"
                  @click="handleCancelAdoption(pet)"
                >
                  取消送养
                </el-button>
                <el-tooltip :disabled="canDeletePet(pet)" :content="deleteDisabledReason(pet)" placement="top">
                  <span class="action-wrap">
                    <el-button type="danger" text size="small" :disabled="!canDeletePet(pet)" @click="handleDelete(pet)">
                      删除
                    </el-button>
                  </span>
                </el-tooltip>
              </div>
            </div>
          </article>
        </div>

        <el-empty
          v-else
          :description="emptyText"
          :image-size="120"
        >
          <el-button v-if="activeTab === 'archive'" type="primary" @click="openForm(null, 'normal')">添加宠物</el-button>
          <el-button v-else type="primary" @click="openForm(null, 'adoption')">添加送养宠物</el-button>
        </el-empty>
      </template>
    </section>

    <div class="pagination-wrap" v-if="filteredPets.length > pageSize">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="filteredPets.length"
        layout="prev, pager, next"
        background
      />
    </div>

    <el-dialog
      v-model="showForm"
      :title="formTitle"
      width="860px"
      :close-on-click-modal="false"
      class="pet-form-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="88px" size="large">
        <div class="pet-form-layout">
          <div class="form-media-panel">
            <el-form-item label="图片" prop="image" class="image-form-item">
              <el-upload
                class="pet-image-uploader"
                action="/api/cos/upload?type=pet"
                :headers="uploadHeaders"
                :show-file-list="false"
                :disabled="imageUploading"
                :on-success="handleImageSuccess"
                :on-error="handleImageError"
                :before-upload="beforeImageUpload"
              >
                <div class="upload-box" v-loading="imageUploading">
                  <img v-if="form.image" :src="getCosUrl(form.image)" class="pet-image" />
                  <div v-else class="pet-upload-placeholder">
                    <el-icon class="pet-upload-icon"><Plus /></el-icon>
                    <span>上传宠物图片</span>
                  </div>
                  <div class="upload-mask">点击更换图片</div>
                </div>
              </el-upload>
              <div class="upload-tip">支持 JPG/PNG/WEBP，图片不超过 5MB。</div>
            </el-form-item>

            <div class="form-note">
              <strong>{{ isAdoptionAddMode ? '送养发布说明' : '宠物档案说明' }}</strong>
              <span>{{ isAdoptionAddMode ? '提交后会进入后台审核，通过后展示在领养大厅。' : '普通宠物只作为个人档案使用，不会展示到领养大厅。' }}</span>
            </div>
          </div>

          <div class="form-fields-panel">
            <div class="form-section-title">基础信息</div>
            <div class="form-two-col">
              <el-form-item label="名字" prop="name">
                <el-input v-model="form.name" placeholder="请输入宠物名字" maxlength="20" />
              </el-form-item>
              <el-form-item label="类型" prop="type">
                <el-radio-group v-model="form.type" @change="handleFormTypeChange">
                  <el-radio :value="1">小猫</el-radio>
                  <el-radio :value="2">小狗</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="品种" prop="breed">
                <el-select v-model="form.breed" placeholder="请选择品种" clearable filterable style="width: 100%">
                  <el-option v-for="breed in breedOptions" :key="breed" :label="breed" :value="breed" />
                </el-select>
              </el-form-item>
              <el-form-item label="月龄" prop="age">
                <el-input-number v-model="form.age" :min="0" :max="360" style="width: 100%" />
              </el-form-item>
              <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="form.gender">
                  <el-radio :value="1">公</el-radio>
                  <el-radio :value="2">母</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>

            <el-form-item label="健康状态" required>
              <el-checkbox-group v-model="selectedHealthStatus" class="health-group">
                <el-checkbox v-for="item in healthOptions" :key="item.value" :label="item.value">{{ item.label }}</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="描述" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="描述宠物的性格、习惯或注意事项"
                maxlength="120"
                show-word-limit
              />
            </el-form-item>

            <template v-if="isAdoptionAddMode">
              <div class="form-section-title">送养信息</div>
              <div class="form-two-col">
                <el-form-item label="是否免费" prop="isFree">
                  <el-switch v-model="form.isFree" active-text="免费" inactive-text="有偿" @change="handleFreeChange" />
                </el-form-item>
                <el-form-item label="领养费用" prop="adoptionFee">
                  <el-input-number v-model="form.adoptionFee" :disabled="form.isFree" :min="0" :precision="2" :step="10" style="width: 100%" />
                </el-form-item>
                <el-form-item label="领取方式" prop="pickupType">
                  <el-select v-model="form.pickupType" placeholder="请选择领取方式" style="width: 100%">
                    <el-option label="上门自取" value="上门自取" />
                    <el-option label="送宠上门" value="送宠上门" />
                    <el-option label="双方协商" value="双方协商" />
                  </el-select>
                </el-form-item>
                <el-form-item label="联系电话" prop="contactPhone">
                  <el-input v-model="form.contactPhone" placeholder="请输入联系电话" maxlength="20" />
                </el-form-item>
              </div>
              <el-form-item label="送养原因" prop="adoptionReason">
                <el-input v-model="form.adoptionReason" placeholder="简单说明为什么送养" maxlength="60" />
              </el-form-item>
              <el-form-item label="送养要求" prop="adoptionRequirement">
                <el-input
                  v-model="form.adoptionRequirement"
                  type="textarea"
                  :rows="2"
                  placeholder="例如：有养宠经验、接受回访、家庭稳定等"
                  maxlength="80"
                  show-word-limit
                />
              </el-form-item>
            </template>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ submitButtonText }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAdoptionDialog" title="提交送养" width="720px" :close-on-click-modal="false">
      <div class="adoption-dialog">
        <div class="adoption-target">
          <img v-if="adoptionTarget?.image" :src="getCosUrl(adoptionTarget.image)" :alt="adoptionTarget.name" />
          <div>
            <strong>{{ adoptionTarget?.name || '-' }}</strong>
            <span>{{ adoptionTarget ? `${adoptionTarget.breed || '品种待补充'} · ${adoptionTarget.gender === 1 ? '公' : '母'}` : '' }}</span>
          </div>
        </div>
        <el-form ref="adoptionFormRef" :model="adoptionForm" :rules="adoptionRules" label-width="88px" size="large">
          <div class="form-two-col">
            <el-form-item label="是否免费" prop="isFree">
              <el-switch v-model="adoptionForm.isFree" active-text="免费" inactive-text="有偿" @change="handleAdoptionFreeChange" />
            </el-form-item>
            <el-form-item label="领养费用" prop="adoptionFee">
              <el-input-number v-model="adoptionForm.adoptionFee" :disabled="adoptionForm.isFree" :min="0" :precision="2" :step="10" style="width: 100%" />
            </el-form-item>
            <el-form-item label="领取方式" prop="pickupType">
              <el-select v-model="adoptionForm.pickupType" placeholder="请选择领取方式" style="width: 100%">
                <el-option label="上门自取" value="上门自取" />
                <el-option label="送宠上门" value="送宠上门" />
                <el-option label="双方协商" value="双方协商" />
              </el-select>
            </el-form-item>
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="adoptionForm.contactPhone" placeholder="请输入联系电话" maxlength="20" />
            </el-form-item>
          </div>
          <el-form-item label="送养原因" prop="adoptionReason">
            <el-input v-model="adoptionForm.adoptionReason" placeholder="简单说明为什么送养" maxlength="60" />
          </el-form-item>
          <el-form-item label="送养要求" prop="adoptionRequirement">
            <el-input
              v-model="adoptionForm.adoptionRequirement"
              type="textarea"
              :rows="2"
              placeholder="例如：有养宠经验、接受回访、家庭稳定等"
              maxlength="80"
              show-word-limit
            />
          </el-form-item>
        </el-form>
        <p class="dialog-tip">提交后宠物会进入待审核状态，管理员审核通过后才会出现在领养大厅。</p>
      </div>
      <template #footer>
        <el-button @click="showAdoptionDialog = false">取消</el-button>
        <el-button type="primary" :loading="adoptionSubmitting" @click="handleSubmitAdoption">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  addPet,
  cancelPetAdoption,
  deletePet,
  getMyPets,
  submitPetForAdoption,
  updatePet
} from '@/api/pet'
import { getCosUrl } from '@/utils/request'
import { getHealthStatusMap, getHealthStatusSummary, getHealthStatusTags } from '@/utils/healthStatus'
import { getPetBreedOptions } from '@/utils/petOptions'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

const STATUS_OWNED = 1
const STATUS_ADOPTABLE = 2
const STATUS_LOCKED = 3
const STATUS_PENDING_REVIEW = 4
const STATUS_DELETED = 5
const STATUS_ADOPTION_FINISHED = 6
const FETCH_BATCH_SIZE = 100

const allPets = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 6
const activeTab = ref('archive')

const showForm = ref(false)
const formMode = ref('normal')
const isEdit = ref(false)
const submitting = ref(false)
const imageUploading = ref(false)
const formRef = ref(null)
const editId = ref(null)
const selectedHealthStatus = ref([])

const showAdoptionDialog = ref(false)
const adoptionSubmitting = ref(false)
const adoptionTarget = ref(null)
const adoptionFormRef = ref(null)

const filters = reactive({
  keyword: '',
  type: '',
  status: ''
})

const form = reactive({
  name: '',
  type: 1,
  breed: '',
  age: null,
  gender: 1,
  healthStatus: 0,
  image: '',
  description: '',
  isFree: true,
  adoptionFee: 0,
  pickupType: '双方协商',
  contactPhone: '',
  adoptionReason: '',
  adoptionRequirement: ''
})

const adoptionForm = reactive({
  isFree: true,
  adoptionFee: 0,
  pickupType: '双方协商',
  contactPhone: '',
  adoptionReason: '',
  adoptionRequirement: ''
})

const healthOptions = getHealthStatusMap()

const isAdoptionAddMode = computed(() => !isEdit.value && formMode.value === 'adoption')

const breedOptions = computed(() => getPetBreedOptions(form.type))

const archiveCount = computed(() => allPets.value.filter((pet) => pet.status === STATUS_OWNED).length)
const adoptionCount = computed(() => allPets.value.filter((pet) => isAdoptionRecord(pet)).length)
const deletedCount = computed(() => allPets.value.filter((pet) => pet.status === STATUS_DELETED).length)

const tabOptions = computed(() => [
  { value: 'archive', label: '我的宠物', count: archiveCount.value },
  { value: 'adoption', label: '送养管理', count: adoptionCount.value }
])

const currentStatusOptions = computed(() => {
  if (activeTab.value === 'archive') {
    return [
      { value: STATUS_OWNED, label: '我的宠物' },
      { value: STATUS_DELETED, label: '已删除' }
    ]
  }
  return [
    { value: STATUS_PENDING_REVIEW, label: '待审核' },
    { value: STATUS_ADOPTABLE, label: '可领养' },
    { value: STATUS_LOCKED, label: '已锁定/待支付' },
    { value: STATUS_ADOPTION_FINISHED, label: '送养完成' },
    { value: STATUS_DELETED, label: '已删除' }
  ]
})

const filteredPets = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()
  return allPets.value.filter((pet) => {
    if (!belongsToCurrentTab(pet)) return false
    if (!hasFilterValue(filters.status) && pet.status === STATUS_DELETED) return false
    if (hasFilterValue(filters.status) && pet.status !== Number(filters.status)) return false
    if (hasFilterValue(filters.type) && pet.type !== Number(filters.type)) return false
    if (!keyword) return true
    return [pet.name, pet.breed, pet.description]
      .filter(Boolean)
      .some((text) => String(text).toLowerCase().includes(keyword))
  })
})

const pagedPets = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredPets.value.slice(start, start + pageSize)
})

const formTitle = computed(() => {
  if (isEdit.value) return '编辑宠物档案'
  return isAdoptionAddMode.value ? '添加送养宠物' : '添加宠物'
})

const submitButtonText = computed(() => {
  if (isEdit.value) return '保存修改'
  return isAdoptionAddMode.value ? '提交送养审核' : '确认添加'
})

const emptyText = computed(() => {
  if (filters.keyword || hasFilterValue(filters.type) || hasFilterValue(filters.status)) {
    return '没有符合筛选条件的宠物。'
  }
  return activeTab.value === 'archive' ? '还没有宠物档案，先添加一只吧。' : '还没有送养记录。'
})

const formRules = {
  name: [{ required: true, message: '请输入宠物名字', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  image: [{ required: true, message: '请上传宠物图片', trigger: 'change' }],
  adoptionReason: [{ validator: validateAdoptionRequired('请填写送养原因'), trigger: 'blur' }],
  contactPhone: [{ validator: validateAdoptionRequired('请填写联系电话'), trigger: 'blur' }],
  pickupType: [{ validator: validateAdoptionRequired('请选择领取方式'), trigger: 'change' }],
  adoptionFee: [{ validator: validateAdoptionFee, trigger: 'change' }]
}

const adoptionRules = {
  adoptionReason: [{ required: true, message: '请填写送养原因', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '请填写联系电话', trigger: 'blur' }],
  pickupType: [{ required: true, message: '请选择领取方式', trigger: 'change' }],
  adoptionFee: [{ validator: validateDialogAdoptionFee, trigger: 'change' }]
}

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

watch(filteredPets, (list) => {
  const maxPage = Math.max(1, Math.ceil(list.length / pageSize))
  if (page.value > maxPage) {
    page.value = maxPage
  }
})

const fetchPets = async () => {
  loading.value = true
  try {
    let currentPage = 1
    let fetched = []
    let total = 0

    while (true) {
      const res = await getMyPets(currentPage, FETCH_BATCH_SIZE)
      if (res.code !== 200) {
        throw new Error(res.message || res.msg || '获取宠物列表失败')
      }

      const data = res.data || {}
      const records = data.records || []
      total = Number(data.total || 0)
      fetched = fetched.concat(records)

      if (!records.length || fetched.length >= total) {
        break
      }
      currentPage += 1
    }

    allPets.value = fetched
  } catch (e) {
    console.error('获取宠物列表失败', e)
    ElMessage.error(e.message || '获取宠物列表失败')
  } finally {
    loading.value = false
  }
}

function validateAdoptionRequired(message) {
  return (_rule, value, callback) => {
    if (!isAdoptionAddMode.value || String(value || '').trim()) {
      callback()
      return
    }
    callback(new Error(message))
  }
}

function validateAdoptionFee(_rule, value, callback) {
  if (!isAdoptionAddMode.value || form.isFree || Number(value || 0) >= 0) {
    callback()
    return
  }
  callback(new Error('领养费用不能小于 0'))
}

function validateDialogAdoptionFee(_rule, value, callback) {
  if (adoptionForm.isFree || Number(value || 0) >= 0) {
    callback()
    return
  }
  callback(new Error('领养费用不能小于 0'))
}

function belongsToCurrentTab(pet) {
  if (activeTab.value === 'archive') {
    return pet.status === STATUS_OWNED || pet.status === STATUS_DELETED
  }
  return isAdoptionRecord(pet) || pet.status === STATUS_DELETED
}

function hasFilterValue(value) {
  return value !== '' && value !== null && value !== undefined
}

function isAdoptionRecord(pet) {
  return [STATUS_PENDING_REVIEW, STATUS_ADOPTABLE, STATUS_LOCKED, STATUS_ADOPTION_FINISHED].includes(pet.status)
}

const switchTab = (tab) => {
  activeTab.value = tab
  filters.status = ''
  page.value = 1
}

const handleImageSuccess = (response) => {
  imageUploading.value = false
  if (response?.code === 200) {
    form.image = response.data
    formRef.value?.clearValidate('image')
    ElMessage.success('上传成功')
  } else {
    ElMessage.error('上传失败：' + (response?.message || response?.msg || '未知错误'))
  }
}

const handleImageError = () => {
  imageUploading.value = false
  ElMessage.error('上传失败，请稍后重试')
}

const beforeImageUpload = (rawFile) => {
  const isValidFormat = ['image/jpeg', 'image/png', 'image/webp'].includes(rawFile.type)
  const isLt5M = rawFile.size / 1024 / 1024 < 5

  if (!isValidFormat) {
    ElMessage.error('上传图片只能是 JPG/PNG/WEBP 格式')
  }
  if (!isLt5M) {
    ElMessage.error('上传图片大小不能超过 5MB')
  }
  imageUploading.value = isValidFormat && isLt5M
  return imageUploading.value
}

const statusLabel = (status) => {
  const map = {
    [STATUS_OWNED]: '我的宠物',
    [STATUS_ADOPTABLE]: '可领养',
    [STATUS_LOCKED]: '已锁定',
    [STATUS_PENDING_REVIEW]: '待审核',
    [STATUS_DELETED]: '已删除',
    [STATUS_ADOPTION_FINISHED]: '送养完成'
  }
  return map[status] || '未知'
}

const sourceLabel = (source) => {
  const map = {
    1: '个人档案',
    2: '平台发布'
  }
  return map[source] || '未知'
}

const healthSummary = (status) => getHealthStatusSummary(status)

const formatAdoptionFee = (value) => {
  const fee = Number(value || 0)
  return fee <= 0 ? '免费' : `￥${fee.toFixed(2)}`
}

const canEditPet = (pet) => [STATUS_OWNED, STATUS_PENDING_REVIEW].includes(pet.status)

const editDisabledReason = (pet) => {
  if (pet.status === STATUS_ADOPTABLE) return '宠物已展示在领养大厅，请先取消送养后再编辑'
  if (pet.status === STATUS_DELETED) return '已删除记录仅保留查看，不能继续编辑'
  if (pet.status === STATUS_LOCKED) return '已有领养申请通过，正在等待对方支付，不能编辑'
  if (pet.status === STATUS_ADOPTION_FINISHED) return '送养已完成，记录保留查看，不能编辑'
  return '当前状态不能编辑'
}

const canSubmitAdoption = (pet) => pet.status === STATUS_OWNED

const canCancelAdoption = (pet) => [STATUS_PENDING_REVIEW, STATUS_ADOPTABLE].includes(pet.status)

const canDeletePet = (pet) => [STATUS_OWNED, STATUS_PENDING_REVIEW, STATUS_ADOPTABLE].includes(pet.status)

const deleteDisabledReason = (pet) => {
  if (pet.status === STATUS_DELETED) return '这条记录已经是已删除状态'
  if (pet.status === STATUS_LOCKED) return '宠物已锁定待支付，不能删除'
  if (pet.status === STATUS_ADOPTION_FINISHED) return '送养已完成，记录需要保留，不能删除'
  return '当前状态不能删除'
}

const toHealthArray = (healthStatus) => getHealthStatusTags(healthStatus).map((item) => item.value)

const toHealthBitmask = (values) => values.reduce((sum, item) => sum | item, 0)

const resetForm = () => {
  Object.assign(form, {
    name: '',
    type: 1,
    breed: '',
    age: null,
    gender: 1,
    healthStatus: 0,
    image: '',
    description: '',
    isFree: true,
    adoptionFee: 0,
    pickupType: '双方协商',
    contactPhone: '',
    adoptionReason: '',
    adoptionRequirement: ''
  })
  selectedHealthStatus.value = []
  editId.value = null
  isEdit.value = false
  imageUploading.value = false
  formRef.value?.clearValidate()
}

const openForm = (pet, mode = 'normal') => {
  resetForm()
  formMode.value = mode
  if (pet) {
    isEdit.value = true
    editId.value = pet.id
    Object.assign(form, {
      name: pet.name,
      type: pet.type,
      breed: pet.breed || '',
      age: pet.age,
      gender: pet.gender,
      healthStatus: pet.healthStatus || 0,
      image: pet.image || '',
      description: pet.description || ''
    })
    selectedHealthStatus.value = toHealthArray(pet.healthStatus)
  }
  showForm.value = true
}

const handleFormTypeChange = () => {
  form.breed = ''
}

const handleFreeChange = (value) => {
  if (value) form.adoptionFee = 0
}

const handleAdoptionFreeChange = (value) => {
  if (value) adoptionForm.adoptionFee = 0
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (!selectedHealthStatus.value.length) {
    ElMessage.warning('请至少选择一项健康状态')
    return
  }

  submitting.value = true
  try {
    const data = {
      name: form.name,
      type: form.type,
      breed: form.breed,
      age: form.age == null ? null : Number(form.age),
      gender: form.gender,
      healthStatus: toHealthBitmask(selectedHealthStatus.value),
      image: form.image,
      description: isAdoptionAddMode.value ? buildAdoptionDescription(form.description, form) : form.description
    }
    if (isAdoptionAddMode.value) {
      data.adoptionFee = resolveFee(form)
    }
    if (isEdit.value) {
      data.id = editId.value
    }

    const res = isEdit.value ? await updatePet(data) : await addPet(data)
    if (res.code !== 200) {
      ElMessage.error(res.message || res.msg || '操作失败')
      return
    }

    if (isAdoptionAddMode.value) {
      const petId = res.data?.id
      if (!petId) {
        throw new Error('宠物已添加，但后端没有返回宠物ID，无法提交送养审核')
      }
      const adoptionRes = await submitPetForAdoption(petId, data.adoptionFee)
      if (adoptionRes.code !== 200) {
        throw new Error(adoptionRes.message || adoptionRes.msg || '送养审核提交失败')
      }
      ElMessage.success('送养宠物已提交审核')
      activeTab.value = 'adoption'
    } else {
      ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
    }

    showForm.value = false
    page.value = 1
    await fetchPets()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.response?.data?.msg || e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const openAdoptionDialog = (pet) => {
  adoptionTarget.value = pet
  Object.assign(adoptionForm, {
    isFree: Number(pet.adoptionFee || 0) <= 0,
    adoptionFee: Number(pet.adoptionFee || 0),
    pickupType: '双方协商',
    contactPhone: '',
    adoptionReason: '',
    adoptionRequirement: ''
  })
  adoptionFormRef.value?.clearValidate()
  showAdoptionDialog.value = true
}

const handleSubmitAdoption = async () => {
  const valid = await adoptionFormRef.value?.validate().catch(() => false)
  if (!valid || !adoptionTarget.value?.id) return

  adoptionSubmitting.value = true
  try {
    const description = buildAdoptionDescription(adoptionTarget.value.description, adoptionForm)
    const updateRes = await updatePet({
      id: adoptionTarget.value.id,
      description,
      adoptionFee: resolveFee(adoptionForm)
    })
    if (updateRes.code !== 200) {
      throw new Error(updateRes.message || updateRes.msg || '送养信息保存失败')
    }

    const res = await submitPetForAdoption(adoptionTarget.value.id, resolveFee(adoptionForm))
    if (res.code === 200) {
      ElMessage.success('送养申请已提交，请等待审核')
      showAdoptionDialog.value = false
      activeTab.value = 'adoption'
      page.value = 1
      await fetchPets()
    } else {
      ElMessage.error(res.message || res.msg || '提交失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.response?.data?.msg || e.message || '提交失败')
  } finally {
    adoptionSubmitting.value = false
  }
}

const handleCancelAdoption = async (pet) => {
  const actionLabel = pet.status === STATUS_ADOPTABLE ? '下架送养并拒绝未处理的领养申请' : '取消送养申请'
  try {
    await ElMessageBox.confirm(`确定要${actionLabel}吗？宠物会回到“我的宠物”列表。`, '送养管理', { type: 'warning' })
  } catch {
    return
  }

  try {
    const res = await cancelPetAdoption(pet.id)
    if (res.code === 200) {
      ElMessage.success('已取消送养')
      await fetchPets()
    } else {
      ElMessage.error(res.message || res.msg || '取消失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.response?.data?.msg || '取消失败')
  }
}

const handleDelete = async (pet) => {
  const message = isAdoptionRecord(pet)
    ? `确定要删除「${pet.name}」的送养记录吗？删除后会改为“已删除”，不会出现在领养大厅；如果已有未处理申请，会一并拒绝。`
    : `确定要删除「${pet.name}」吗？删除后会改为“已删除”，不会从数据库真正移除。`
  try {
    await ElMessageBox.confirm(message, '删除宠物', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  try {
    const res = await deletePet(pet.id)
    if (res.code === 200) {
      ElMessage.success('已移入已删除')
      await fetchPets()
    } else {
      ElMessage.error(res.message || res.msg || '删除失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.response?.data?.msg || '删除失败')
  }
}

function resolveFee(data) {
  return data.isFree ? 0 : Number(data.adoptionFee || 0)
}

function buildAdoptionDescription(baseDescription, data) {
  const lines = []
  const base = String(baseDescription || '').trim()
  if (base) lines.push(`宠物说明：${base}`)
  lines.push(`送养原因：${String(data.adoptionReason || '').trim()}`)
  lines.push(`联系电话：${String(data.contactPhone || '').trim()}`)
  lines.push(`领取方式：${data.pickupType || '双方协商'}`)
  lines.push(`是否免费：${resolveFee(data) <= 0 ? '免费' : '有偿'}`)
  const requirement = String(data.adoptionRequirement || '').trim()
  if (requirement) lines.push(`送养要求：${requirement}`)
  return lines.join('\n').slice(0, 255)
}

onMounted(fetchPets)
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
  margin-bottom: 20px;
}

.pets-heading h2 {
  margin: 8px 0 10px;
  font-size: 26px;
}

.pets-heading p {
  margin: 0;
  color: var(--ink-body);
}

.heading-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.view-switch {
  display: inline-flex;
  gap: 10px;
  padding: 6px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(95, 136, 198, 0.12), rgba(241, 221, 194, 0.22));
  border: 1px solid rgba(37, 54, 74, 0.08);
}

.view-chip {
  border: none;
  background: transparent;
  border-radius: 999px;
  padding: 10px 16px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink-body);
  cursor: pointer;
  font-weight: 700;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.view-chip strong {
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(37, 54, 74, 0.08);
  font-size: 12px;
}

.view-chip.active {
  background: #fff;
  color: var(--brand-strong);
  box-shadow: 0 10px 24px rgba(37, 54, 74, 0.08);
}

.view-chip:hover {
  transform: translateY(-1px);
}

.filter-bar {
  display: grid;
  grid-template-columns: 1fr 160px 180px;
  gap: 12px;
  margin-bottom: 16px;
}

.tips-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.tip-pill {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid var(--line-soft);
  color: var(--ink-muted);
  font-size: 12px;
}

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
  height: 208px;
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
  transform: scale(1.04);
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

.pet-fee {
  left: 12px;
  top: 52px;
  background: rgba(196, 71, 34, 0.9);
  color: #fff;
  border-color: rgba(196, 71, 34, 0.3);
}

.pet-fee.free {
  background: rgba(55, 124, 86, 0.9);
}

.pet-status[data-status="1"],
.status-pill[data-status="1"] {
  background: rgba(68, 169, 120, 0.12);
  color: #2f7a59;
  border-color: rgba(68, 169, 120, 0.2);
}

.pet-status[data-status="2"],
.status-pill[data-status="2"] {
  background: rgba(236, 169, 64, 0.16);
  color: #9b5a18;
  border-color: rgba(236, 169, 64, 0.24);
}

.pet-status[data-status="3"],
.status-pill[data-status="3"],
.pet-status[data-status="6"],
.status-pill[data-status="6"] {
  background: rgba(124, 136, 154, 0.18);
  color: #5b6675;
  border-color: rgba(124, 136, 154, 0.24);
}

.pet-status[data-status="4"],
.status-pill[data-status="4"] {
  background: rgba(95, 136, 198, 0.16);
  color: #355784;
  border-color: rgba(95, 136, 198, 0.24);
}

.pet-status[data-status="5"],
.status-pill[data-status="5"] {
  background: rgba(176, 73, 73, 0.15);
  color: #8b3030;
  border-color: rgba(176, 73, 73, 0.22);
}

.pet-body {
  padding: 16px 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  white-space: nowrap;
}

.pet-meta,
.pet-description {
  margin: 0;
  color: var(--ink-body);
  font-size: 13px;
  line-height: 1.7;
}

.pet-description {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-line;
}

.pet-summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--ink-muted);
  font-size: 12px;
}

.pet-status-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 12px;
  font-weight: 700;
}

.fee-text {
  color: #b6512f;
  font-size: 13px;
  font-weight: 700;
}

.pet-card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  border-top: 1px solid var(--line-soft);
  padding-top: 10px;
  margin-top: 2px;
}

.action-wrap {
  display: inline-flex;
}

.loading-area {
  padding: 40px 0;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 24px 0 16px;
}

.pet-form-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}

.form-media-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-form-item {
  display: block;
}

.image-form-item :deep(.el-form-item__label) {
  display: block;
  width: auto !important;
  text-align: left;
  margin-bottom: 8px;
}

.image-form-item :deep(.el-form-item__content) {
  margin-left: 0 !important;
  display: block;
}

.pet-image-uploader :deep(.el-upload) {
  width: 100%;
}

.upload-box {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  border: 1px dashed var(--line-soft);
  background: var(--surface-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.upload-box:hover {
  border-color: var(--brand-strong);
  background: #fff;
  box-shadow: 0 10px 22px rgba(37, 54, 74, 0.08);
}

.upload-box:hover .upload-mask {
  opacity: 1;
}

.pet-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pet-upload-placeholder {
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

.upload-mask {
  position: absolute;
  inset: auto 0 0;
  padding: 10px;
  text-align: center;
  color: #fff;
  background: rgba(37, 54, 74, 0.62);
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 13px;
}

.upload-tip,
.dialog-tip {
  margin-top: 8px;
  color: var(--ink-muted);
  font-size: 12px;
}

.form-note {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(95, 136, 198, 0.1), rgba(241, 221, 194, 0.18));
  border: 1px solid var(--line-soft);
  color: var(--ink-body);
}

.form-note strong {
  color: var(--ink-strong);
}

.form-note span {
  font-size: 13px;
  line-height: 1.6;
}

.form-fields-panel {
  min-width: 0;
}

.form-two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 14px;
}

.form-section-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 800;
  color: var(--ink-strong);
}

.form-section-title:not(:first-child) {
  margin-top: 6px;
}

.health-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
}

.adoption-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.adoption-target {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(95, 136, 198, 0.1), rgba(241, 221, 194, 0.18));
  border: 1px solid var(--line-soft);
  color: var(--ink-body);
}

.adoption-target img {
  width: 96px;
  height: 72px;
  object-fit: cover;
  border-radius: 12px;
}

.adoption-target strong {
  display: block;
  color: var(--ink-strong);
  font-size: 16px;
  margin-bottom: 4px;
}

@media (max-width: 960px) {
  .pets-hero,
  .pets-heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .heading-actions {
    width: 100%;
    justify-content: space-between;
  }

  .filter-bar,
  .pet-form-layout {
    grid-template-columns: 1fr;
  }

  .pets-panel {
    padding: 22px;
  }
}
</style>
