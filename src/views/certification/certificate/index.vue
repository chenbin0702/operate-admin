<template>
  <div class="certificate-management">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">证书管理</span>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="handleAdd"
          >
            新增证书
          </el-button>
        </div>
      </template>
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        :inline="true"
        class="search-form"
      >
        <el-form-item label="证书名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入证书名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="证书类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择证书类型"
            clearable
            style="width: 180px"
          >
            <el-option label="无人机驾驶员合格证" value="pilot" />
            <el-option label="无人机操作证" value="operator" />
            <el-option label="其他证书" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="有效" value="valid" />
            <el-option label="即将过期" value="expiring" />
            <el-option label="已过期" value="expired" />
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
        title="证书列表"
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
                @click="handleView(row)"
              >
                查看
              </el-button>
              <el-button
                type="primary"
                link
                :icon="useRenderIcon(EditPen)"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                link
                :icon="useRenderIcon(Delete)"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增证书' : '编辑证书'"
      width="700px"
      destroy-on-close
      class="certificate-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="certificate-form"
      >
        <div class="form-content">
          <div class="form-left">
            <el-form-item label="证书名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入证书名称" />
            </el-form-item>
            <el-form-item label="证书类型" prop="type">
              <el-select
                v-model="form.type"
                placeholder="请选择证书类型"
                style="width: 100%"
              >
                <el-option label="无人机驾驶员合格证" value="pilot" />
                <el-option label="无人机操作证" value="operator" />
                <el-option label="其他证书" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="颁发日期" prop="issueDate">
              <el-date-picker
                v-model="form.issueDate"
                type="date"
                placeholder="请选择颁发日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item label="有效期至" prop="expireDate">
              <el-date-picker
                v-model="form.expireDate"
                type="date"
                placeholder="请选择有效期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
                :disabled-date="disabledDate"
              />
            </el-form-item>
            <el-form-item label="颁发机构" prop="issueOrg">
              <el-input v-model="form.issueOrg" placeholder="请输入颁发机构" />
            </el-form-item>
          </div>
          <div class="form-right">
            <el-form-item label="证书图片" prop="image" class="upload-item">
              <div class="upload-wrapper">
                <el-upload
                  class="certificate-upload"
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleImageChange"
                  :before-upload="beforeImageUpload"
                >
                  <div v-if="!form.image" class="upload-content">
                    <el-icon class="upload-icon"><Plus /></el-icon>
                    <div class="upload-text">点击上传证书图片</div>
                    <div class="upload-tip">
                      支持 jpg、png 格式，大小不超过 2MB
                    </div>
                  </div>
                  <el-image
                    v-else
                    :src="form.image"
                    class="preview-image"
                    fit="contain"
                  >
                    <template #error>
                      <div class="image-error">
                        <el-icon><picture-filled /></el-icon>
                        <span>加载失败</span>
                      </div>
                    </template>
                  </el-image>
                </el-upload>
                <div v-if="form.image" class="upload-actions">
                  <el-button
                    type="primary"
                    link
                    :icon="useRenderIcon(View)"
                    @click="previewImage"
                  >
                    预览
                  </el-button>
                  <el-button
                    type="danger"
                    link
                    :icon="useRenderIcon(Delete)"
                    @click="removeImage"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </el-form-item>
          </div>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="图片预览"
      width="800px"
      append-to-body
    >
      <div class="preview-container">
        <el-image :src="form.image" fit="contain" />
      </div>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="证书详情"
      width="600px"
      destroy-on-close
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="证书名称">
          {{ currentDetail?.name }}
        </el-descriptions-item>
        <el-descriptions-item label="证书类型">
          {{ currentDetail?.type }}
        </el-descriptions-item>
        <el-descriptions-item label="颁发日期">
          {{ currentDetail?.issueDate }}
        </el-descriptions-item>
        <el-descriptions-item label="有效期至">
          {{ currentDetail?.expireDate }}
        </el-descriptions-item>
        <el-descriptions-item label="颁发机构">
          {{ currentDetail?.issueOrg }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[currentDetail?.status].type">
            {{ statusMap[currentDetail?.status].label }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div class="certificate-image">
        <h4>证书图片</h4>
        <el-image
          :src="currentDetail?.image"
          :preview-src-list="[currentDetail?.image]"
          fit="contain"
          class="detail-image"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import { Plus, View, PictureFilled } from "@element-plus/icons-vue";

interface CertificateItem {
  id: number;
  name: string;
  type: string;
  issueDate: string;
  expireDate: string;
  issueOrg: string;
  status: "valid" | "expiring" | "expired";
  image: string;
}

// 表格数据
const tableData = ref<CertificateItem[]>([]);
const loading = ref(false);
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
const searchForm = reactive({
  name: "",
  type: "",
  status: ""
});

// 状态映射
const statusMap = {
  valid: { label: "有效", type: "success" },
  expiring: { label: "即将过期", type: "warning" },
  expired: { label: "已过期", type: "danger" }
} as const;

// 表格列配置
const columns = [
  {
    label: "序号",
    type: "index" as const,
    width: 70,
    align: "center"
  },
  {
    label: "证书名称",
    prop: "name",
    align: "center"
  },
  {
    label: "证书类型",
    prop: "type",
    align: "center"
  },
  {
    label: "颁发日期",
    prop: "issueDate",
    align: "center"
  },
  {
    label: "有效期至",
    prop: "expireDate",
    align: "center"
  },
  {
    label: "颁发机构",
    prop: "issueOrg",
    align: "center"
  },
  {
    label: "状态",
    prop: "status",
    slot: "status",
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

// 表单相关
const dialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const form = reactive({
  id: 0,
  name: "",
  type: "",
  issueDate: "",
  expireDate: "",
  issueOrg: "",
  image: ""
});

const rules = {
  name: [{ required: true, message: "请输入证书名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择证书类型", trigger: "change" }],
  issueDate: [{ required: true, message: "请选择颁发日期", trigger: "change" }],
  expireDate: [{ required: true, message: "请选择有效期", trigger: "change" }],
  issueOrg: [{ required: true, message: "请输入颁发机构", trigger: "blur" }],
  image: [{ required: true, message: "请上传证书图片", trigger: "change" }]
};

// 详情相关
const detailVisible = ref(false);
const currentDetail = ref<CertificateItem | null>(null);

// 获取表格数据
const fetchData = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    tableData.value = [
      {
        id: 1,
        name: "无人机驾驶员合格证",
        type: "pilot",
        issueDate: "2023-01-01",
        expireDate: "2025-01-01",
        issueOrg: "中国民用航空局",
        status: "valid",
        image: "https://picsum.photos/400/300"
      },
      {
        id: 2,
        name: "无人机操作证",
        type: "operator",
        issueDate: "2023-02-01",
        expireDate: "2023-12-31",
        issueOrg: "中国民用航空局",
        status: "expiring",
        image: "https://picsum.photos/400/300"
      },
      {
        id: 3,
        name: "无人机维修证书",
        type: "other",
        issueDate: "2022-01-01",
        expireDate: "2023-01-01",
        issueOrg: "中国民用航空局",
        status: "expired",
        image: "https://picsum.photos/400/300"
      }
    ];
    pagination.total = 3;
    loading.value = false;
  }, 500);
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
  handleSearch();
};

// 新增
const handleAdd = () => {
  dialogType.value = "add";
  Object.keys(form).forEach(key => {
    form[key] = "";
  });
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: CertificateItem) => {
  dialogType.value = "edit";
  Object.assign(form, row);
  dialogVisible.value = true;
};

// 查看详情
const handleView = (row: CertificateItem) => {
  currentDetail.value = row;
  detailVisible.value = true;
};

// 删除
const handleDelete = (row: CertificateItem) => {
  ElMessageBox.confirm("确认删除该证书？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      ElMessage.success("删除成功");
      fetchData();
    })
    .catch(() => {});
};

// 图片上传
const handleImageChange = (file: File) => {
  const isImage = file.type.startsWith("image/");
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error("只能上传图片文件！");
    return false;
  }
  if (!isLt2M) {
    ElMessage.error("图片大小不能超过 2MB！");
    return false;
  }

  // 模拟上传
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    form.image = reader.result as string;
  };
};

// 提交表单
const handleSubmit = async () => {
  const formEl = document.querySelector(".certificate-form") as any;
  if (!formEl) return;

  await formEl.validate((valid: boolean) => {
    if (valid) {
      ElMessage.success(dialogType.value === "add" ? "新增成功" : "修改成功");
      dialogVisible.value = false;
      fetchData();
    }
  });
};

// 分页相关
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
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

// 图片预览
const previewVisible = ref(false);
const previewImage = () => {
  previewVisible.value = true;
};

// 删除图片
const removeImage = () => {
  form.image = "";
};

// 禁用日期
const disabledDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const disabled =
    date < today ||
    date > new Date(today.setFullYear(today.getFullYear() + 10));
  return disabled;
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.certificate-management {
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

.certificate-form {
  padding: 20px;
}

.certificate-upload {
  width: 200px;
  height: 200px;
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.certificate-upload:hover {
  border-color: var(--el-color-primary);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 8px;
}

.certificate-image {
  margin-top: 20px;
}

.certificate-image h4 {
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
}

.detail-image {
  width: 100%;
  height: 300px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
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

  .search-form :deep(.el-input),
  .search-form :deep(.el-select) {
    width: 100% !important;
  }

  .search-buttons {
    margin-left: 0;
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
}

.form-content {
  display: flex;
  gap: 20px;
}

.form-left {
  flex: 1;
}

.form-right {
  flex: 1;
}

.upload-item {
  margin-top: 20px;
}

.upload-wrapper {
  position: relative;
}

.upload-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-text {
  margin-top: 10px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.upload-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 10px;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.image-error i {
  margin-bottom: 10px;
}
</style>
