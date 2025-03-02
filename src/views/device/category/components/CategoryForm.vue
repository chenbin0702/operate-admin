<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑分类' : '新增分类'"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="category-form"
    >
      <el-form-item label="分类名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入分类名称" />
      </el-form-item>

      <el-form-item label="上级分类" prop="parentId">
        <el-tree-select
          v-model="form.parentId"
          :data="categoryOptions"
          :props="{
            value: 'id',
            label: 'name',
            children: 'children'
          }"
          placeholder="请选择上级分类"
          clearable
          :disabled="!!parentCategory"
        />
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number
          v-model="form.sort"
          :min="0"
          :max="999"
          placeholder="请输入排序号"
        />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入分类描述"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确 定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  parentCategory: {
    type: Object,
    default: null
  },
  categoryData: {
    type: Object,
    default: () => ({})
  },
  categoryOptions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(["update:visible", "submit", "close"]);

const dialogVisible = ref(false);
const loading = ref(false);
const formRef = ref(null);

const form = ref({
  name: "",
  parentId: undefined,
  sort: 0,
  description: ""
});

const rules = {
  name: [
    { required: true, message: "请输入分类名称", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
  ],
  sort: [{ required: true, message: "请输入排序号", trigger: "blur" }]
};

watch(
  () => props.visible,
  val => {
    dialogVisible.value = val;
  }
);

watch(
  () => dialogVisible.value,
  val => {
    emit("update:visible", val);
    if (!val) {
      emit("close");
    }
  }
);

watch(
  () => props.categoryData,
  val => {
    if (val && Object.keys(val).length) {
      form.value = {
        name: val.name || "",
        parentId: val.parentId,
        sort: val.sort || 0,
        description: val.description || ""
      };
    }
  },
  { immediate: true }
);

watch(
  () => props.parentCategory,
  val => {
    if (val) {
      form.value.parentId = val.id;
    }
  },
  { immediate: true }
);

const handleClose = () => {
  dialogVisible.value = false;
  formRef.value?.resetFields();
  form.value = {
    name: "",
    parentId: undefined,
    sort: 0,
    description: ""
  };
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;
    emit("submit", { ...form.value });
    handleClose();
  } catch (error) {
    // 表单验证失败
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.category-form {
  padding: 20px 0;
}

.dialog-footer {
  text-align: right;
}
</style>
