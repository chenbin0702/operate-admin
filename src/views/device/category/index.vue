<template>
  <div class="category-management">
    <!-- 页面头部 -->
    <div class="header">
      <div class="title-section">
        <h2 class="main-title">设备分类管理</h2>
        <div class="statistics">
          <el-tag type="success" effect="dark" class="stat-item">
            <el-icon><Document /></el-icon>
            <span>总分类数: {{ totalCategories }}</span>
          </el-tag>
          <el-tag
            v-if="topLevelCount"
            type="warning"
            effect="dark"
            class="stat-item"
          >
            <el-icon><FolderOpened /></el-icon>
            <span>顶级分类: {{ topLevelCount }}</span>
          </el-tag>
        </div>
      </div>
      <div class="action-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索分类..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleAddTopLevel">
          <el-icon><Plus /></el-icon>新增顶级分类
        </el-button>
        <el-button @click="handleExpandAll">
          <el-icon><Operation /></el-icon
          >{{ isExpandAll ? "收起" : "展开" }}全部
        </el-button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="main-content">
      <el-card class="category-tree-card" :body-style="{ padding: '0' }">
        <template #header>
          <div class="card-header">
            <div class="left">
              <el-icon><Grid /></el-icon>
              <span>分类树形结构</span>
            </div>
            <div class="right">
              <el-button text type="primary" @click="refreshData">
                <el-icon><Refresh /></el-icon>刷新数据
              </el-button>
            </div>
          </div>
        </template>

        <div class="tree-container">
          <el-empty v-if="!categories.length" description="暂无分类数据" />
          <category-tree
            v-else
            :categories="filteredCategories"
            :expand-all="isExpandAll"
            @edit="handleEdit"
            @add-child="handleAddChild"
            @delete="handleDelete"
          />
        </div>
      </el-card>
    </div>

    <!-- 分类表单对话框 -->
    <category-form
      v-model:visible="formVisible"
      :is-edit="isEdit"
      :parent-category="currentParent"
      :category-data="currentCategory"
      :category-options="categories"
      @submit="handleFormSubmit"
      @close="handleFormClose"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  Plus,
  Search,
  Document,
  Grid,
  Operation,
  FolderOpened,
  Refresh
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import CategoryTree from "./components/CategoryTree.vue";
import CategoryForm from "./components/CategoryForm.vue";
import { equipmentService } from "@/services/equipmentService";

// 状态管理
const categories = ref([]);
const formVisible = ref(false);
const isEdit = ref(false);
const currentCategory = ref({});
const currentParent = ref(null);
const searchKeyword = ref("");
const isExpandAll = ref(false);

// 计算属性
const totalCategories = computed(() => {
  let count = 0;
  const countCategories = items => {
    items.forEach(item => {
      count++;
      if (item.children?.length) {
        countCategories(item.children);
      }
    });
  };
  countCategories(categories.value);
  return count;
});

const topLevelCount = computed(() => categories.value.length);

const filteredCategories = computed(() => {
  if (!searchKeyword.value) return categories.value;

  const searchInCategories = items => {
    return items.filter(item => {
      const matchName = item.name
        .toLowerCase()
        .includes(searchKeyword.value.toLowerCase());
      const children = item.children?.length
        ? searchInCategories(item.children)
        : [];

      if (children.length) {
        item.children = children;
        return true;
      }
      return matchName;
    });
  };

  return searchInCategories([...categories.value]);
});

// 方法
const loadCategories = async () => {
  try {
    const data = await equipmentService.getCategories();
    categories.value = data;
  } catch (error) {
    ElMessage.error("获取分类列表失败");
  }
};

const refreshData = async () => {
  ElMessage.info("正在刷新数据...");
  await loadCategories();
  ElMessage.success("数据已更新");
};

const handleExpandAll = () => {
  isExpandAll.value = !isExpandAll.value;
};

const handleAddTopLevel = () => {
  isEdit.value = false;
  currentParent.value = null;
  currentCategory.value = {};
  formVisible.value = true;
};

const handleAddChild = parentCategory => {
  isEdit.value = false;
  currentParent.value = parentCategory;
  currentCategory.value = {};
  formVisible.value = true;
};

const handleEdit = category => {
  isEdit.value = true;
  currentCategory.value = { ...category };
  currentParent.value = null;
  formVisible.value = true;
};

const handleDelete = async category => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类 "${category.name}" 吗？`,
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await equipmentService.deleteCategory(category.id);
    ElMessage.success("删除成功");
    loadCategories();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const handleFormSubmit = async formData => {
  try {
    if (isEdit.value) {
      await equipmentService.updateCategory(currentCategory.value.id, formData);
      ElMessage.success("更新成功");
    } else {
      await equipmentService.createCategory(formData);
      ElMessage.success("创建成功");
    }
    loadCategories();
  } catch (error) {
    ElMessage.error(isEdit.value ? "更新失败" : "创建失败");
  }
};

const handleFormClose = () => {
  currentCategory.value = {};
  currentParent.value = null;
};

onMounted(() => {
  loadCategories();
});
</script>

<style scoped lang="scss">
.category-management {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .title-section {
      display: flex;
      align-items: center;
      gap: 20px;

      .main-title {
        font-size: 24px;
        color: #303133;
        margin: 0;
      }

      .statistics {
        display: flex;
        gap: 12px;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;

          .el-icon {
            margin-right: 4px;
          }
        }
      }
    }

    .action-section {
      display: flex;
      gap: 12px;
      align-items: center;

      .search-input {
        width: 240px;
      }
    }
  }

  .main-content {
    .category-tree-card {
      border-radius: 8px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e4e7ed;

        .left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 500;
        }
      }

      .tree-container {
        padding: 20px;
        min-height: 400px;
      }
    }
  }
}
</style>
