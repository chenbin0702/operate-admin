<template>
  <div>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">设备库存管理</span>
          <el-button
            v-auth="'device:inventory:add'"
            type="primary"
            :icon="Plus"
            @click="handleAdd"
          >
            新增库存
          </el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <el-form
        ref="queryRef"
        :model="queryParams"
        :inline="true"
        class="search-form"
      >
        <el-form-item label="设备名称" prop="deviceName">
          <el-input
            v-model="queryParams.deviceName"
            placeholder="请输入设备名称"
            clearable
            @keyup.enter="handleQuery"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="库存状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择库存状态"
            clearable
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
              <el-tag :type="getStatusType(item.value)" class="status-tag">
                {{ item.label }}
              </el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="resetQuery"> 重置 </el-button>
        </el-form-item>
      </el-form>

      <!-- 表格区域 -->
      <Table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        :columns="columns"
        :pagination="pagination"
        border
        stripe
        class="inventory-table"
        @pagination-change="handlePageChange"
      >
        <!-- 数量列 -->
        <template #quantity="{ row }">
          <span :class="getQuantityClass(row.quantity)">{{
            row.quantity
          }}</span>
        </template>

        <!-- 状态列 -->
        <template #status="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>

        <!-- 操作列 -->
        <template #operation="{ row }">
          <el-button
            v-auth="'device:inventory:edit'"
            type="primary"
            link
            :icon="Edit"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-popconfirm
            title="确认删除该条记录吗？"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button
                v-auth="'device:inventory:delete'"
                type="danger"
                link
                :icon="Delete"
              >
                删除
              </el-button>
            </template>
          </el-popconfirm>
        </template>
      </Table>

      <!-- 新增/编辑对话框 -->
      <el-dialog
        v-model="dialog.visible"
        :title="dialog.title"
        width="500px"
        :close-on-click-modal="false"
        destroy-on-close
      >
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="dialog-form"
        >
          <el-form-item label="设备名称" prop="deviceId">
            <el-select
              v-model="form.deviceId"
              placeholder="请选择设备"
              filterable
            >
              <el-option
                v-for="device in deviceOptions"
                :key="device.id"
                :label="device.name"
                :value="device.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="库存数量" prop="quantity">
            <el-input-number
              v-model="form.quantity"
              :min="0"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="库存状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态">
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="存放位置" prop="location">
            <el-input v-model="form.location" placeholder="请输入存放位置" />
          </el-form-item>
          <el-form-item label="备注" prop="note">
            <el-input
              v-model="form.note"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialog.visible = false"> 取消 </el-button>
          <el-button
            type="primary"
            :loading="submitLoading"
            @click="handleSubmit"
          >
            确定
          </el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Search, Refresh, Edit, Delete } from "@element-plus/icons-vue";
import Table from "@pureadmin/table";
import type { InventoryRecord, DeviceOption } from "@/types/device";

// 模拟设备选项数据
const mockDeviceOptions: DeviceOption[] = [
  { id: "1", name: "打印机" },
  { id: "2", name: "扫描仪" },
  { id: "3", name: "投影仪" },
  { id: "4", name: "复印机" }
];

// 模拟库存数据
const mockInventoryData: InventoryRecord[] = [
  {
    id: "1",
    deviceId: "1",
    deviceName: "打印机",
    quantity: 5,
    status: "in_stock",
    location: "仓库A",
    note: "正常库存",
    updateTime: "2024-03-20 10:00:00"
  },
  {
    id: "2",
    deviceId: "2",
    deviceName: "扫描仪",
    quantity: 0,
    status: "out_of_stock",
    location: "仓库B",
    note: "需要补货",
    updateTime: "2024-03-20 11:00:00"
  },
  {
    id: "3",
    deviceId: "3",
    deviceName: "投影仪",
    quantity: 8,
    status: "low_stock",
    location: "仓库C",
    note: "库存偏低",
    updateTime: "2024-03-20 12:00:00"
  }
];

// 状态选项
const statusOptions = [
  { value: "in_stock", label: "在库" },
  { value: "out_of_stock", label: "缺货" },
  { value: "low_stock", label: "低库存" }
];

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  return statusOptions.find(item => item.value === status)?.label || "";
};

// 查询参数
const queryParams = reactive({
  deviceName: "",
  status: "",
  pageNum: 1,
  pageSize: 10
});

// 表格数据
const loading = ref(false);
const tableData = ref<InventoryRecord[]>([]);
const deviceOptions = ref<DeviceOption[]>([]);

// 分页配置
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1
});

// 表格列配置
const columns = [
  {
    label: "设备名称",
    prop: "deviceName"
  },
  {
    label: "库存数量",
    prop: "quantity",
    slot: "quantity"
  },
  {
    label: "库存状态",
    prop: "status",
    slot: "status"
  },
  {
    label: "存放位置",
    prop: "location"
  },
  {
    label: "更新时间",
    prop: "updateTime"
  },
  {
    label: "操作",
    fixed: "right",
    width: 160,
    slot: "operation"
  }
];

// 表单相关
const dialog = reactive({
  visible: false,
  title: ""
});

const formRef = ref<FormInstance>();
const submitLoading = ref(false);
const form = reactive({
  id: "",
  deviceId: "",
  quantity: 0,
  status: "in_stock",
  location: "",
  note: ""
});

const rules: FormRules = {
  deviceId: [
    {
      required: true,
      message: "请选择设备",
      trigger: "change"
    }
  ],
  quantity: [
    {
      required: true,
      message: "请输入库存数量",
      trigger: "blur"
    },
    {
      type: "number",
      min: 0,
      message: "库存数量不能小于0",
      trigger: "blur"
    }
  ],
  status: [
    {
      required: true,
      message: "请选择库存状态",
      trigger: "change"
    }
  ]
};

// 获取状态标签类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    in_stock: "success",
    out_of_stock: "danger",
    low_stock: "warning"
  };
  return typeMap[status] || "info";
};

// 获取数量显示样式
const getQuantityClass = (quantity: number) => {
  if (quantity === 0) return "quantity-empty";
  if (quantity < 10) return "quantity-low";
  return "quantity-normal";
};

// 模拟数据查询
const getList = async () => {
  loading.value = true;
  try {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 过滤数据
    let filteredData = [...mockInventoryData];
    if (queryParams.deviceName) {
      filteredData = filteredData.filter(item =>
        item.deviceName.includes(queryParams.deviceName)
      );
    }
    if (queryParams.status) {
      filteredData = filteredData.filter(
        item => item.status === queryParams.status
      );
    }

    // 分页处理
    const start = (queryParams.pageNum - 1) * queryParams.pageSize;
    const end = start + queryParams.pageSize;
    tableData.value = filteredData.slice(start, end);
    pagination.total = filteredData.length;
  } catch (error) {
    ElMessage.error("获取数据失败");
  } finally {
    loading.value = false;
  }
};

// 获取设备选项
const getDeviceOptions = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    deviceOptions.value = mockDeviceOptions;
  } catch (error) {
    ElMessage.error("获取设备选项失败");
  }
};

// 搜索
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

// 重置
const resetQuery = () => {
  queryParams.deviceName = "";
  queryParams.status = "";
  handleQuery();
};

// 分页变化
const handlePageChange = ({ pageSize, currentPage }) => {
  queryParams.pageNum = currentPage;
  queryParams.pageSize = pageSize;
  getList();
};

// 新增
const handleAdd = () => {
  dialog.title = "新增库存";
  dialog.visible = true;
  form.id = "";
  form.deviceId = "";
  form.quantity = 0;
  form.status = "in_stock";
  form.location = "";
  form.note = "";
};

// 编辑
const handleEdit = (row: InventoryRecord) => {
  dialog.title = "编辑库存";
  dialog.visible = true;
  Object.assign(form, {
    id: row.id,
    deviceId: row.deviceId,
    quantity: row.quantity,
    status: row.status,
    location: row.location,
    note: row.note
  });
};

// 删除
const handleDelete = (row: InventoryRecord) => {
  ElMessageBox.confirm("确认删除该条记录吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = mockInventoryData.findIndex(item => item.id === row.id);
      if (index > -1) {
        mockInventoryData.splice(index, 1);
        ElMessage.success("删除成功");
        getList();
      }
    } catch (error) {
      ElMessage.error("删除失败");
    }
  });
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async valid => {
    if (valid) {
      submitLoading.value = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const deviceInfo = mockDeviceOptions.find(d => d.id === form.deviceId);
        if (form.id) {
          // 编辑
          const index = mockInventoryData.findIndex(
            item => item.id === form.id
          );
          if (index > -1) {
            mockInventoryData[index] = {
              ...mockInventoryData[index],
              ...form,
              deviceName: deviceInfo?.name || "",
              updateTime: new Date().toLocaleString()
            };
          }
        } else {
          // 新增
          mockInventoryData.push({
            id: String(mockInventoryData.length + 1),
            deviceName: deviceInfo?.name || "",
            updateTime: new Date().toLocaleString(),
            ...form
          });
        }
        ElMessage.success("保存成功");
        dialog.visible = false;
        getList();
      } catch (error) {
        ElMessage.error("保存失败");
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

onMounted(() => {
  getDeviceOptions();
  getList();
});
</script>

<style lang="scss" scoped>
.main-container {
  padding: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: bold;
      color: var(--el-text-color-primary);
    }
  }

  .search-form {
    margin-bottom: 16px;
    padding: 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
  }

  .inventory-table {
    margin-top: 16px;
  }

  .status-tag {
    width: 100%;
    text-align: center;
  }

  .quantity-empty {
    color: var(--el-color-danger);
    font-weight: bold;
  }

  .quantity-low {
    color: var(--el-color-warning);
    font-weight: bold;
  }

  .quantity-normal {
    color: var(--el-color-success);
  }

  .dialog-form {
    padding: 20px;
  }

  :deep(.el-card__header) {
    padding: 14px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
  }
}
</style>
