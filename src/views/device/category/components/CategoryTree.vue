<template>
  <el-tree
    ref="treeRef"
    :data="categories"
    :expand-on-click-node="false"
    node-key="id"
    class="category-tree"
  >
    <template #default="{ data }">
      <div class="custom-tree-node">
        <div class="node-content">
          <el-icon><Folder /></el-icon>
          <span class="label">{{ data.name }}</span>
          <el-tag
            v-if="data.children?.length"
            size="small"
            type="info"
            class="count"
          >
            {{ data.children.length }}
          </el-tag>
        </div>
        <div class="node-actions">
          <el-button-group>
            <el-button
              v-if="!data.parentId"
              type="primary"
              link
              @click="handleAdd(data)"
            >
              <el-icon><Plus /></el-icon>
            </el-button>
            <el-button type="primary" link @click="handleEdit(data)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button type="danger" link @click="handleDelete(data)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>
    </template>
  </el-tree>
</template>

<script setup>
import { ref, watch } from "vue";
import { Folder, Plus, Edit, Delete } from "@element-plus/icons-vue";

const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  },
  expandAll: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["edit", "add-child", "delete"]);
const treeRef = ref(null);

// 监听 expandAll 变化
watch(
  () => props.expandAll,
  val => {
    if (treeRef.value) {
      // 获取所有节点的 key
      const allNodes = getAllNodeKeys(props.categories);
      if (val) {
        // 展开所有节点
        allNodes.forEach(key => {
          treeRef.value.store.nodesMap[key].expanded = true;
        });
      } else {
        // 收起所有节点
        allNodes.forEach(key => {
          treeRef.value.store.nodesMap[key].expanded = false;
        });
      }
    }
  }
);

// 监听数据变化，保持展开状态
watch(
  () => props.categories,
  () => {
    if (props.expandAll && treeRef.value) {
      // 获取所有节点的 key
      const allNodes = getAllNodeKeys(props.categories);
      // 展开所有节点
      allNodes.forEach(key => {
        treeRef.value.store.nodesMap[key].expanded = true;
      });
    }
  },
  { deep: true }
);

// 获取所有节点的 key
const getAllNodeKeys = nodes => {
  let keys = [];
  const getKeys = items => {
    items.forEach(item => {
      keys.push(item.id);
      if (item.children?.length) {
        getKeys(item.children);
      }
    });
  };
  getKeys(nodes);
  return keys;
};

const handleAdd = data => {
  emit("add-child", data);
};

const handleEdit = data => {
  emit("edit", data);
};

const handleDelete = data => {
  emit("delete", data);
};
</script>

<style scoped lang="scss">
.category-tree {
  .custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 8px;
    font-size: 14px;
  }

  .node-content {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      margin-left: 4px;
    }

    .count {
      font-size: 12px;
    }
  }

  .node-actions {
    opacity: 0;
    transition: opacity 0.2s;
  }

  .el-tree-node:hover {
    .node-actions {
      opacity: 1;
    }
  }
}
</style>
