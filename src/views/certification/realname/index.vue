<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage, ElMessageBox, ElTag } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import More from "@iconify-icons/ep/more-filled";
import {
  getRealnameVerificationList,
  auditRealnameVerification,
  type RealnameVerificationItem,
  type RealnameVerificationParams
} from "@/api/certification";

// 表格数据
const tableData = ref<RealnameVerificationItem[]>([]);
const loading = ref(true);
const tableRef = ref();

// 分页配置
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true,
  small: true,
  layout: "total, sizes, prev, pager, next, jumper"
});

// 搜索表单
const searchForm = reactive<RealnameVerificationParams>({
  name: "",
  idCard: "",
  status: ""
});

// 添加表单验证规则
const searchFormRules = {
  idCard: [
    {
      pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
      message: "请输入正确的身份证号",
      trigger: "blur"
    }
  ]
};

// 状态映射
const statusMap = {
  pending: { label: "待审核", type: "warning" },
  approved: { label: "已通过", type: "success" },
  rejected: { label: "已拒绝", type: "danger" }
};

// 表格列配置
const columns = [
  {
    label: "序号",
    type: "index",
    width: 70,
    align: "center"
  },
  {
    label: "姓名",
    prop: "name",
    align: "center"
  },
  {
    label: "身份证号",
    prop: "idCard",
    align: "center"
  },
  {
    label: "状态",
    prop: "status",
    slot: "status",
    align: "center"
  },
  {
    label: "申请时间",
    prop: "createTime",
    align: "center",
    formatter: row => {
      return new Date(row.createTime).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  },
  {
    label: "操作",
    fixed: "right",
    width: 180,
    slot: "operation",
    align: "center"
  }
];

// 详情对话框
const detailDialogVisible = ref(false);
const currentDetail = ref<RealnameVerificationItem | null>(null);

// 审核对话框
const auditDialogVisible = ref(false);
const auditForm = reactive({
  id: 0,
  status: "approved",
  rejectReason: ""
});

// 审核表单验证规则
const auditFormRules = {
  rejectReason: [
    { required: true, message: "请输入拒绝原因", trigger: "blur" },
    {
      min: 5,
      max: 200,
      message: "拒绝原因长度应在 5 到 200 个字符之间",
      trigger: "blur"
    }
  ]
};

// 图片预览相关
const previewVisible = ref(false);
const previewImages = ref<string[]>([]);
const previewIndex = ref(0);

// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await getRealnameVerificationList({
      ...searchForm,
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize
    });

    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error("获取实名认证列表失败:", error);
    ElMessage.error("获取数据失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchData();
};

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = "";
  });
  pagination.currentPage = 1;
  fetchData();
};

// 查看详情
const handleViewDetail = (row: RealnameVerificationItem) => {
  currentDetail.value = row;
  detailDialogVisible.value = true;
};

// 审核
const handleAudit = (row: RealnameVerificationItem) => {
  auditForm.id = row.id;
  auditForm.status = "approved";
  auditForm.rejectReason = "";
  auditDialogVisible.value = true;
};

// 优化图片预览方法
const handlePreviewImage = (images: string[], index: number) => {
  previewImages.value = images;
  previewIndex.value = index;
  previewVisible.value = true;
};

// 优化提交审核方法
const submitAudit = async () => {
  const formEl = document.querySelector(".audit-form") as any;
  if (!formEl) return;

  await formEl.validate(async (valid: boolean) => {
    if (!valid) return;

    try {
      ElMessageBox.confirm(
        `确认${auditForm.status === "approved" ? "通过" : "拒绝"}该实名认证申请？`,
        "确认提示",
        {
          confirmButtonText: "确认",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
        .then(async () => {
          loading.value = true;
          const { success, message } =
            await auditRealnameVerification(auditForm);
          if (success) {
            ElMessage.success(message || "审核操作成功");
            auditDialogVisible.value = false;
            fetchData();
          } else {
            ElMessage.error(message || "审核操作失败");
          }
        })
        .catch(() => {
          // 取消操作
        });
    } catch (error) {
      console.error("审核操作失败:", error);
      ElMessage.error("审核操作失败，请稍后重试");
    } finally {
      loading.value = false;
    }
  });
};

// 页码变化
const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
  fetchData();
};

// 每页条数变化
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  pagination.currentPage = 1;
  fetchData();
};

// 刷新
const onRefresh = () => {
  fetchData();
};

// 全屏
const onFullscreen = () => {
  // 全屏处理逻辑
};

// 初始化
onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="realname-verification">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">实名认证查询</span>
        </div>
      </template>
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        :rules="searchFormRules"
        :inline="true"
        class="search-form"
      >
        <el-form-item label="姓名">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入姓名"
            clearable
            prefix-icon="el-icon-user"
          />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input
            v-model="searchForm.idCard"
            placeholder="请输入身份证号"
            clearable
            prefix-icon="el-icon-document"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            class="search-button"
            @click="handleSearch"
          >
            搜索
          </el-button>
          <el-button
            :icon="useRenderIcon(Refresh)"
            class="reset-button"
            @click="resetSearch"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <PureTableBar
        title="实名认证列表"
        :columns="columns"
        :tableRef="tableRef?.getTableRef?.()"
        @refresh="onRefresh"
        @fullscreen="onFullscreen"
      >
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            ref="tableRef"
            adaptive
            row-key="id"
            :size="size"
            :data="tableData"
            :columns="dynamicColumns"
            :loading="loading"
            :header-cell-style="{
              background: 'var(--el-color-primary-light-9)',
              color: 'var(--el-color-primary-dark-2)',
              fontWeight: 'bold'
            }"
            :cell-style="{
              padding: '8px 0'
            }"
            :pagination="pagination"
            stripe
            border
            @page-size-change="handleSizeChange"
            @page-current-change="handleCurrentChange"
          >
            <template #status="{ row }">
              <el-tag
                :type="statusMap[row.status].type"
                effect="light"
                class="status-tag"
              >
                {{ statusMap[row.status].label }}
              </el-tag>
            </template>
            <template #operation="{ row }">
              <el-button
                type="primary"
                link
                :icon="useRenderIcon(Search)"
                class="operation-button"
                @click="handleViewDetail(row)"
              >
                查看
              </el-button>
              <el-button
                v-if="row.status === 'pending'"
                type="primary"
                link
                :icon="useRenderIcon(EditPen)"
                class="operation-button"
                @click="handleAudit(row)"
              >
                审核
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="实名认证详情"
      width="800px"
      destroy-on-close
      class="detail-dialog"
    >
      <el-descriptions :column="2" border class="detail-descriptions">
        <el-descriptions-item
          label="姓名"
          label-class-name="detail-label"
          content-class-name="detail-content"
        >
          {{ currentDetail?.name }}
        </el-descriptions-item>
        <el-descriptions-item
          label="身份证号"
          label-class-name="detail-label"
          content-class-name="detail-content"
        >
          {{ currentDetail?.idCard }}
        </el-descriptions-item>
        <el-descriptions-item
          label="状态"
          label-class-name="detail-label"
          content-class-name="detail-content"
        >
          <el-tag
            v-if="currentDetail"
            :type="statusMap[currentDetail.status].type"
            effect="light"
            class="status-tag"
          >
            {{ statusMap[currentDetail?.status].label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item
          label="申请时间"
          label-class-name="detail-label"
          content-class-name="detail-content"
        >
          {{
            currentDetail
              ? new Date(currentDetail.createTime).toLocaleString()
              : ""
          }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentDetail?.status === 'rejected'"
          label="拒绝原因"
          :span="2"
          label-class-name="detail-label"
          content-class-name="detail-content"
        >
          {{ currentDetail?.rejectReason }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="image-container">
        <div
          v-for="(image, index) in [
            { title: '身份证正面', url: currentDetail?.frontImage },
            { title: '身份证反面', url: currentDetail?.backImage },
            { title: '人脸照片', url: currentDetail?.faceImage }
          ]"
          :key="index"
          class="image-item"
        >
          <h4>{{ image.title }}</h4>
          <div
            class="image-wrapper"
            @click="
              handlePreviewImage(
                [
                  currentDetail?.frontImage,
                  currentDetail?.backImage,
                  currentDetail?.faceImage
                ].filter(Boolean),
                index
              )
            "
          >
            <el-image
              v-if="image.url"
              :src="image.url"
              fit="cover"
              class="id-image"
              loading="lazy"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><picture-filled /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button
            v-if="currentDetail?.status === 'pending'"
            type="primary"
            @click="handleAudit(currentDetail)"
          >
            去审核
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="auditDialogVisible"
      title="实名认证审核"
      width="500px"
      destroy-on-close
      class="audit-dialog"
    >
      <el-form
        ref="auditFormRef"
        :model="auditForm"
        :rules="auditFormRules"
        label-width="80px"
        class="audit-form"
      >
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.status" class="audit-radio-group">
            <el-radio label="approved">
              <el-icon><circle-check /></el-icon>
              通过
            </el-radio>
            <el-radio label="rejected">
              <el-icon><circle-close /></el-icon>
              拒绝
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="auditForm.status === 'rejected'"
          label="拒绝原因"
          prop="rejectReason"
        >
          <el-input
            v-model="auditForm.rejectReason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因（5-200字）"
            show-word-limit
            maxlength="200"
            class="reject-reason"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="auditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAudit">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图片预览组件 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewImages"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />
  </div>
</template>

<style scoped>
.main-container {
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.search-card {
  margin-bottom: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.search-card :deep(.el-card__body) {
  padding: 15px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 10px;
  margin-right: 16px;
  margin-left: 0 !important; /* 强制移除左边距 */
}

.search-form :deep(.el-form-item__content) {
  margin-left: 0 !important; /* 强制移除表单项内容的左边距 */
  justify-content: flex-start;
}

.search-form :deep(.el-form-item__label) {
  padding-right: 8px;
}

.search-form :deep(.el-input) {
  width: 200px;
}

.search-buttons {
  margin-left: auto;
  margin-right: 0 !important;
}

.search-button {
  margin-right: 10px;
  transition: all 0.3s;
}

.reset-button {
  transition: all 0.3s;
}

.table-card {
  margin-bottom: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.table-card :deep(.el-card__body) {
  padding: 0;
}

/* 修复表格内部的margin-left问题 */
.table-card :deep(.pure-table) {
  width: 100%;
}

.table-card :deep(.el-table) {
  width: 100% !important;
  margin-left: 0 !important;
}

.table-card :deep(.el-pagination) {
  justify-content: center;
  margin-left: 0 !important;
  padding: 15px 0;
}

.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.operation-button {
  padding: 4px 8px;
  font-size: 14px;
  transition: all 0.3s;
}

.operation-button:hover {
  opacity: 0.8;
}

.image-container {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  gap: 20px;
}

.image-item {
  flex: 1;
  text-align: center;
  background-color: var(--el-bg-color);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.image-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px 0 rgba(0, 0, 0, 0.1);
}

.image-item h4 {
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.id-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  object-fit: cover;
  transition: all 0.3s;
}

.id-image:hover {
  transform: scale(1.02);
}

.detail-dialog :deep(.el-dialog__header) {
  padding: 20px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-color-primary-light-9);
}

.detail-dialog :deep(.el-dialog__title) {
  font-weight: bold;
  color: var(--el-color-primary);
}

.detail-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.detail-dialog :deep(.el-dialog__footer) {
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.detail-descriptions :deep(.el-descriptions__label) {
  width: 100px;
  font-weight: bold;
  background-color: var(--el-color-primary-light-9);
}

.detail-descriptions :deep(.el-descriptions__content) {
  padding: 12px 16px;
}

.audit-dialog :deep(.el-dialog__header) {
  padding: 20px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-color-primary-light-9);
}

.audit-dialog :deep(.el-dialog__title) {
  font-weight: bold;
  color: var(--el-color-primary);
}

.audit-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.audit-form {
  margin-top: 10px;
}

.audit-form :deep(.el-form-item__content) {
  margin-left: 0 !important;
}

.audit-radio-group {
  display: flex;
  gap: 20px;
}

.reject-reason {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .image-container {
    flex-direction: column;
  }

  .image-item {
    width: 100%;
  }

  .search-form :deep(.el-form-item) {
    margin-right: 0;
    width: 100%;
  }

  .search-form :deep(.el-input) {
    width: 100%;
  }

  .search-buttons {
    margin-left: 0;
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
}

.image-wrapper {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.image-wrapper:hover::after {
  content: "点击查看大图";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
}

.audit-radio-group .el-radio {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.audit-radio-group .el-icon {
  margin-right: 4px;
}
</style>
