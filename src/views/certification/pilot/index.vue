<template>
  <div class="pilot-verification">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">飞手认证查询</span>
        </div>
      </template>
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        :inline="true"
        class="search-form"
      >
        <el-form-item label="姓名">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入姓名"
            clearable
          />
        </el-form-item>
        <el-form-item label="证书编号">
          <el-input
            v-model="searchForm.certificateNo"
            placeholder="请输入证书编号"
            clearable
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
        title="飞手认证列表"
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
      title="飞手认证详情"
      width="800px"
      destroy-on-close
      class="detail-dialog"
    >
      <el-descriptions :column="2" border class="detail-descriptions">
        <el-descriptions-item label="姓名" label-class-name="detail-label">
          {{ currentDetail?.name }}
        </el-descriptions-item>
        <el-descriptions-item label="证书编号" label-class-name="detail-label">
          {{ currentDetail?.certificateNo }}
        </el-descriptions-item>
        <el-descriptions-item label="证书类型" label-class-name="detail-label">
          {{ currentDetail?.certificateType }}
        </el-descriptions-item>
        <el-descriptions-item label="有效期至" label-class-name="detail-label">
          {{ currentDetail?.expireTime }}
        </el-descriptions-item>
        <el-descriptions-item label="状态" label-class-name="detail-label">
          <el-tag
            v-if="currentDetail"
            :type="
              statusMap[currentDetail.status].type as
                | 'success'
                | 'warning'
                | 'danger'
            "
            effect="light"
            class="status-tag"
          >
            {{ statusMap[currentDetail?.status].label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交时间" label-class-name="detail-label">
          {{ currentDetail?.submitTime }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentDetail?.status === 'rejected'"
          label="拒绝原因"
          :span="2"
          label-class-name="detail-label"
        >
          {{ currentDetail?.rejectReason }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 添加图片预览区域 -->
      <div class="image-preview-section">
        <h4 class="preview-title">证书材料</h4>
        <div class="image-grid">
          <div class="image-item">
            <p>证书图片</p>
            <el-image
              :src="currentDetail?.certificateImage"
              :preview-src-list="[currentDetail?.certificateImage]"
              fit="cover"
              class="preview-image"
              preview-teleported
            >
              <template #error>
                <div class="image-error">
                  <el-icon><picture-filled /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
          </div>
          <div class="image-item">
            <p>身份证正面</p>
            <el-image
              :src="currentDetail?.idCardFrontImage"
              :preview-src-list="[currentDetail?.idCardFrontImage]"
              fit="cover"
              class="preview-image"
              preview-teleported
            >
              <template #error>
                <div class="image-error">
                  <el-icon><picture-filled /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
          </div>
          <div class="image-item">
            <p>身份证反面</p>
            <el-image
              :src="currentDetail?.idCardBackImage"
              :preview-src-list="[currentDetail?.idCardBackImage]"
              fit="cover"
              class="preview-image"
              preview-teleported
            >
              <template #error>
                <div class="image-error">
                  <el-icon><picture-filled /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
          </div>
          <div class="image-item">
            <p>资质证明</p>
            <el-image
              :src="currentDetail?.qualificationImage"
              :preview-src-list="[currentDetail?.qualificationImage]"
              fit="cover"
              class="preview-image"
              preview-teleported
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
      title="飞手认证审核"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage, ElMessageBox, ElTag } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import {
  getPilotVerificationList,
  auditPilotVerification,
  type PilotVerificationItem,
  type PilotVerificationParams,
  type AuditPilotParams
} from "@/api/certification";

// 表格数据
const tableData = ref<PilotVerificationItem[]>([]);
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
const searchForm = reactive<PilotVerificationParams>({
  name: "",
  certificateNo: "",
  status: ""
});

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
    type: "index" as const,
    width: 70,
    align: "center"
  },
  {
    label: "姓名",
    prop: "name",
    align: "center"
  },
  {
    label: "证书编号",
    prop: "certificateNo",
    align: "center"
  },
  {
    label: "证书类型",
    prop: "certificateType",
    align: "center"
  },
  {
    label: "状态",
    prop: "status",
    slot: "status",
    align: "center"
  },
  {
    label: "提交时间",
    prop: "submitTime",
    align: "center",
    formatter: row => {
      return new Date(row.submitTime).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  },
  {
    label: "有效期至",
    prop: "expireTime",
    align: "center"
  },
  {
    label: "操作",
    fixed: "right",
    width: 180,
    slot: "operation",
    align: "center"
  }
] as const;

// 详情对话框
const detailDialogVisible = ref(false);
const currentDetail = ref<PilotVerificationItem | null>(null);

// 审核对话框
const auditDialogVisible = ref(false);
const auditForm = reactive<AuditPilotParams>({
  id: 0,
  status: "approved" as const,
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

// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await getPilotVerificationList({
      ...searchForm,
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize
    });

    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error("获取飞手认证列表失败:", error);
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
const handleViewDetail = (row: PilotVerificationItem) => {
  currentDetail.value = row;
  detailDialogVisible.value = true;
};

// 审核
const handleAudit = (row: PilotVerificationItem) => {
  auditForm.id = row.id;
  auditForm.status = "approved";
  auditForm.rejectReason = "";
  auditDialogVisible.value = true;
};

// 提交审核
const submitAudit = async () => {
  const formEl = document.querySelector(".audit-form") as any;
  if (!formEl) return;

  await formEl.validate(async (valid: boolean) => {
    if (!valid) return;

    try {
      ElMessageBox.confirm(
        `确认${auditForm.status === "approved" ? "通过" : "拒绝"}该飞手认证申请？`,
        "确认提示",
        {
          confirmButtonText: "确认",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
        .then(async () => {
          loading.value = true;
          const { success, message } = await auditPilotVerification(auditForm);
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

// 分页相关
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  pagination.currentPage = 1;
  fetchData();
};

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
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

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.pilot-verification {
  padding: 10px;
}

.search-card {
  margin-bottom: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
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

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-buttons {
  margin-left: auto;
}

.table-card {
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.operation-button {
  padding: 4px 8px;
  font-size: 14px;
}

.detail-dialog :deep(.el-dialog__header) {
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-color-primary-light-9);
}

.detail-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.detail-descriptions :deep(.el-descriptions__label) {
  width: 100px;
  font-weight: bold;
  background-color: var(--el-color-primary-light-9);
}

.audit-dialog :deep(.el-dialog__header) {
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-color-primary-light-9);
}

.audit-form {
  margin-top: 10px;
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

@media screen and (max-width: 768px) {
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

.image-preview-section {
  margin-top: 24px;
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.preview-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.image-item {
  text-align: center;
}

.image-item p {
  margin-bottom: 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.preview-image {
  width: 100%;
  height: 200px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s;
}

.preview-image:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.image-error .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.detail-label {
  background-color: var(--el-color-primary-light-9);
  font-weight: bold;
  min-width: 100px;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .image-grid {
    grid-template-columns: 1fr;
  }

  .preview-image {
    height: 160px;
  }
}
</style>
