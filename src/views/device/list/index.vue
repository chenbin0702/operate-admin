<template>
  <div class="device-container">
    <div class="device-header">
      <div class="header-title">
        <h2>设备管理</h2>
        <el-tag type="info" effect="plain" class="device-count">
          设备总数: {{ total }}
        </el-tag>
      </div>
      <el-button type="primary" :icon="Plus" @click="openModal(null)">
        新增设备
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form
        ref="searchFormRef"
        :inline="true"
        :model="searchParams"
        class="search-form"
      >
        <el-form-item label="设备名称">
          <el-input
            v-model="searchParams.name"
            placeholder="请输入设备名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="所属分类">
          <el-cascader
            v-model="searchParams.categoryId"
            :options="categories"
            :props="{
              checkStrictly: true,
              value: 'value',
              label: 'label',
              emitPath: false
            }"
            clearable
            placeholder="请选择分类"
          />
        </el-form-item>
        <el-form-item label="价格区间">
          <el-input-number
            v-model="searchParams.minPrice"
            :precision="2"
            :step="100"
            placeholder="最低价"
            class="price-input"
          />
          <span class="price-separator">-</span>
          <el-input-number
            v-model="searchParams.maxPrice"
            :precision="2"
            :step="100"
            placeholder="最高价"
            class="price-input"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchParams.status"
            placeholder="请选择状态"
            clearable
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="Search"
            :loading="loading"
            @click="handleSearch"
          >
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-operations">
            <el-button
              type="primary"
              plain
              :icon="Download"
              @click="handleExport"
            >
              导出数据
            </el-button>
            <el-button
              type="danger"
              plain
              :icon="Delete"
              :disabled="!selectedRows.length"
              @click="handleBatchDelete"
            >
              批量删除
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="deviceList"
        :header-cell-style="tableHeaderStyle"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column width="120" label="设备图片" align="center">
          <template #default="{ row }">
            <el-image
              :src="row.mainImage"
              :preview-src-list="row.images"
              fit="cover"
              class="device-image"
            />
          </template>
        </el-table-column>
        <el-table-column
          prop="name"
          label="设备名称"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="device-name">
              <span>{{ row.name }}</span>
              <el-tag size="small" type="info" effect="plain">
                {{ row.model }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="所属分类" width="120" />
        <el-table-column prop="serialNumber" label="序列号" width="150" />
        <el-table-column label="价格信息" width="200">
          <template #default="{ row }">
            <div class="price-info">
              <div class="base-price">
                ¥{{ row.basePrice.toFixed(2) }}
                <span class="rent-days">/ {{ row.rentDays }}天</span>
              </div>
              <div v-if="row.specOptions.length" class="spec-price">
                {{ getSpecPriceRange(row.specOptions) }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="库存" width="100" align="center">
          <template #default="{ row }">
            {{ getTotalStock(row.specOptions) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status === "active" ? "正常" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="View"
              @click="handleView(row)"
            >
              查看
            </el-button>
            <el-button
              link
              type="primary"
              :icon="Edit"
              @click="handleUpdate(row)"
            >
              编辑
            </el-button>
            <el-popconfirm
              title="确定要删除该设备吗？"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button link type="danger" :icon="Delete">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="searchParams.pageNum"
          v-model:page-size="searchParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑设备' : '新增设备'"
      width="1200px"
      destroy-on-close
      class="device-dialog"
      @closed="handleDialogClosed"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="device-form"
      >
        <div class="form-container">
          <!-- 左侧主要内容区 -->
          <div class="main-content">
            <el-tabs v-model="activeTab" class="custom-tabs">
              <!-- 基本信息 -->
              <el-tab-pane label="基本信息" name="basic">
                <div class="form-section">
                  <div class="section-header">
                    <span class="section-title">设备信息</span>
                  </div>
                  <div class="form-content">
                    <el-row :gutter="24">
                      <el-col :span="12">
                        <el-form-item label="设备名称" prop="name">
                          <el-input
                            v-model="form.name"
                            placeholder="请输入设备名称"
                            clearable
                          />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="设备型号" prop="model">
                          <el-input
                            v-model="form.model"
                            placeholder="请输入设备型号"
                            clearable
                          />
                        </el-form-item>
                      </el-col>
                    </el-row>

                    <el-row :gutter="24">
                      <el-col :span="12">
                        <el-form-item label="所属分类" prop="categoryId">
                          <el-cascader
                            v-model="form.categoryId"
                            :options="categories"
                            :props="{
                              checkStrictly: true,
                              value: 'value',
                              label: 'label',
                              emitPath: false
                            }"
                            placeholder="请选择所属分类"
                            clearable
                            class="w-full"
                          />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="品牌" prop="brand">
                          <el-select
                            v-model="form.brand"
                            placeholder="请选择品牌"
                            clearable
                            class="w-full"
                          >
                            <el-option
                              v-for="item in brandOptions"
                              :key="item.value"
                              :label="item.label"
                              :value="item.value"
                            />
                          </el-select>
                        </el-form-item>
                      </el-col>
                    </el-row>

                    <el-row :gutter="24">
                      <el-col :span="12">
                        <el-form-item label="序列号" prop="serialNumber">
                          <el-input
                            v-model="form.serialNumber"
                            placeholder="请输入序列号"
                            clearable
                          />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="制造商" prop="manufacturer">
                          <el-input
                            v-model="form.manufacturer"
                            placeholder="请输入制造商"
                            clearable
                          />
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </div>
                </div>

                <div class="section-header">
                  <span class="section-title">租赁信息</span>
                </div>
                <div class="form-content">
                  <el-row :gutter="24">
                    <el-col :span="8">
                      <el-form-item label="基础价格" prop="basePrice">
                        <el-input-number
                          v-model="form.basePrice"
                          :precision="2"
                          :step="100"
                          :min="0"
                          controls-position="right"
                          class="w-full"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="租赁天数" prop="rentDays">
                        <el-input-number
                          v-model="form.rentDays"
                          :min="1"
                          :step="1"
                          controls-position="right"
                          class="w-full"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="保修期" prop="warranty">
                        <el-input-number
                          v-model="form.warranty"
                          :min="0"
                          :step="1"
                          controls-position="right"
                          class="w-full"
                        >
                          <template #suffix>个月</template>
                        </el-input-number>
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-form-item label="设备状态" prop="status">
                    <el-radio-group v-model="form.status">
                      <el-radio-button label="active">正常</el-radio-button>
                      <el-radio-button label="inactive">停用</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </div>
              </el-tab-pane>

              <!-- 规格管理 -->
              <el-tab-pane label="规格管理" name="spec">
                <div class="form-section">
                  <div class="section-header">
                    <span class="section-title">规格设置</span>
                    <el-button
                      type="primary"
                      plain
                      :icon="Plus"
                      @click="addSpecGroup"
                    >
                      添加规格组
                    </el-button>
                  </div>

                  <div class="spec-groups">
                    <div
                      v-for="(group, groupIndex) in form.specGroups"
                      :key="groupIndex"
                      class="spec-group-card"
                    >
                      <div class="group-header">
                        <el-input
                          v-model="group.name"
                          placeholder="请输入规格组名称，如：颜色、尺寸"
                          class="group-name-input"
                        />
                        <el-button
                          type="danger"
                          link
                          :icon="Delete"
                          @click="removeSpecGroup(groupIndex)"
                        >
                          删除
                        </el-button>
                      </div>

                      <div class="group-content">
                        <div class="value-list">
                          <el-tag
                            v-for="(value, valueIndex) in group.values"
                            :key="value"
                            closable
                            class="value-tag"
                            @close="removeSpecValue(group, valueIndex)"
                          >
                            {{ value }}
                          </el-tag>
                          <el-input
                            v-if="group.inputVisible"
                            ref="valueInputRef"
                            v-model="group.inputValue"
                            class="value-input"
                            size="small"
                            @keyup.enter="confirmSpecValue(group)"
                            @blur="confirmSpecValue(group)"
                          />
                          <el-button
                            v-else
                            class="add-value-button"
                            size="small"
                            @click="showSpecInput(group)"
                          >
                            添加规格值
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="form.specCombinations.length"
                    class="spec-combinations"
                  >
                    <div class="section-header">
                      <span class="section-title">规格明细</span>
                    </div>

                    <el-table :data="form.specCombinations" border>
                      <el-table-column
                        v-for="group in form.specGroups"
                        :key="group.name"
                        :prop="`specs.${group.name}`"
                        :label="group.name"
                      />
                      <el-table-column label="价格" width="180">
                        <template #default="{ row }">
                          <el-input-number
                            v-model="row.price"
                            :min="0"
                            :precision="2"
                            :step="100"
                            controls-position="right"
                          />
                        </template>
                      </el-table-column>
                      <el-table-column label="库存" width="150">
                        <template #default="{ row }">
                          <el-input-number
                            v-model="row.stock"
                            :min="0"
                            controls-position="right"
                          />
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 设备参数 -->
              <el-tab-pane label="设备参数" name="params">
                <div class="form-section">
                  <div class="section-header">
                    <span class="section-title">参数组</span>
                    <el-button
                      type="primary"
                      plain
                      :icon="Plus"
                      @click="addParamGroup"
                    >
                      添加参数组
                    </el-button>
                  </div>

                  <div class="param-groups">
                    <div
                      v-for="(group, groupIndex) in form.paramGroups"
                      :key="groupIndex"
                      class="param-group-card"
                    >
                      <div class="group-header">
                        <el-input
                          v-model="group.name"
                          placeholder="请输入参数组名称"
                          class="group-name-input"
                        />
                        <el-button
                          type="danger"
                          link
                          :icon="Delete"
                          @click="removeParamGroup(groupIndex)"
                        >
                          删除
                        </el-button>
                      </div>

                      <div class="param-list">
                        <div
                          v-for="(param, paramIndex) in group.params"
                          :key="paramIndex"
                          class="param-item"
                        >
                          <el-row :gutter="12">
                            <el-col :span="8">
                              <el-input
                                v-model="param.name"
                                placeholder="参数名称"
                              />
                            </el-col>
                            <el-col :span="8">
                              <el-input
                                v-model="param.value"
                                placeholder="参数值"
                              />
                            </el-col>
                            <el-col :span="6">
                              <el-input
                                v-model="param.unit"
                                placeholder="单位"
                              />
                            </el-col>
                            <el-col
                              :span="2"
                              class="flex items-center justify-center"
                            >
                              <el-button
                                type="danger"
                                link
                                :icon="Delete"
                                @click="removeParam(group, paramIndex)"
                              />
                            </el-col>
                          </el-row>
                        </div>
                        <el-button
                          type="primary"
                          link
                          :icon="Plus"
                          @click="addParam(group)"
                        >
                          添加参数
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 设备描述 -->
              <el-tab-pane label="设备描述" name="description">
                <div class="form-section">
                  <div class="section-header">
                    <span class="section-title">详细描述</span>
                  </div>
                  <div class="editor-container">
                    <Toolbar
                      :editor="editorRef"
                      :defaultConfig="toolbarConfig"
                      mode="default"
                      style="border-bottom: 1px solid #ccc"
                    />
                    <Editor
                      v-model="form.description"
                      :defaultConfig="editorConfig"
                      :mode="editorMode"
                      :style="{ height: '500px' }"
                      @onCreated="handleEditorCreated"
                    />
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>

          <!-- 右侧边栏 -->
          <div class="side-content">
            <!-- 图片上传 -->
            <div class="side-section upload-section">
              <h3 class="side-title">设备图片</h3>
              <div class="upload-container">
                <!-- 主图上传 -->
                <div class="main-image-uploader">
                  <div class="uploader-title">主图</div>
                  <el-upload
                    class="uploader"
                    :show-file-list="false"
                    :on-success="handleMainImageSuccess"
                    :before-upload="beforeUpload"
                    action="/api/upload"
                  >
                    <div
                      class="upload-area"
                      :class="{ 'has-image': form.mainImage }"
                    >
                      <template v-if="form.mainImage">
                        <img :src="form.mainImage" class="preview-image" />
                        <div class="image-actions">
                          <el-button
                            type="primary"
                            circle
                            :icon="View"
                            @click.stop="previewImage(form.mainImage)"
                          />
                          <el-button
                            type="danger"
                            circle
                            :icon="Delete"
                            @click.stop="removeMainImage"
                          />
                        </div>
                      </template>
                      <div v-else class="upload-placeholder">
                        <el-icon class="upload-icon"><Plus /></el-icon>
                        <span>点击上传主图</span>
                      </div>
                    </div>
                  </el-upload>
                </div>

                <!-- 附图上传 -->
                <div class="extra-images-uploader">
                  <div class="uploader-title">
                    <span>附图</span>
                    <span class="image-count">{{ form.images.length }}/5</span>
                  </div>
                  <el-upload
                    class="image-list"
                    list-type="picture-card"
                    :on-success="handleImageSuccess"
                    :before-upload="beforeUpload"
                    :on-remove="handleImageRemove"
                    :on-preview="handleImagePreview"
                    :limit="5"
                    multiple
                    action="/api/upload"
                  >
                    <el-icon><Plus /></el-icon>
                  </el-upload>
                </div>
              </div>
              <div class="upload-tip">
                <el-icon><InfoFilled /></el-icon>
                <span
                  >建议尺寸：800x800px，支持jpg、png格式，大小不超过2MB</span
                >
              </div>
            </div>
          </div>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button
            type="primary"
            :loading="submitLoading"
            @click="handleSubmit"
          >
            确 定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看设备详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="设备详情"
      width="900px"
      class="detail-dialog"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="设备名称">
          {{ currentDevice?.name }}
        </el-descriptions-item>
        <el-descriptions-item label="所属分类">
          {{ currentDevice?.categoryName }}
        </el-descriptions-item>
        <el-descriptions-item label="序列号">
          {{ currentDevice?.serialNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="设备价格">
          ¥{{ currentDevice?.basePrice?.toFixed(2) }}
        </el-descriptions-item>
        <el-descriptions-item label="租赁天数">
          {{ currentDevice?.rentDays }}天
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentDevice?.status)">
            {{ currentDevice?.status === "active" ? "正常" : "停用" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="产品规格" :span="2">
          {{ currentDevice?.specification }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">规格明细</el-divider>
      <el-table :data="currentDevice?.specGroups" border>
        <el-table-column prop="name" label="规格名称" />
        <el-table-column prop="values" label="规格值" />
      </el-table>

      <el-divider content-position="left">设备参数</el-divider>
      <el-table :data="currentDevice?.params" border>
        <el-table-column prop="name" label="参数名称" />
        <el-table-column prop="value" label="参数值" />
        <el-table-column prop="unit" label="单位" width="100" />
      </el-table>

      <el-divider content-position="left">设备描述</el-divider>
      <div class="description-content">{{ currentDevice?.description }}</div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  reactive,
  onMounted,
  nextTick,
  watch,
  onBeforeUnmount,
  shallowRef
} from "vue";
import { ElMessage, ElMessageBox, FormInstance } from "element-plus";
import {
  Delete,
  Edit,
  Plus,
  Search,
  Refresh,
  View,
  Download,
  InfoFilled
} from "@element-plus/icons-vue";
import type {
  Device,
  DeviceCategory,
  DeviceParameter,
  SpecGroup,
  SpecCombination,
  SpecOption,
  ParamGroup
} from "@/types/device";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import type {
  IDomEditor,
  IEditorConfig,
  IToolbarConfig
} from "@wangeditor/editor";
import "@wangeditor/editor/dist/css/style.css";

// 定义组件名称
defineOptions({
  name: "DeviceList"
});

// 状态定义
const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const detailVisible = ref(false);
const activeTab = ref<string>("basic");
const total = ref(0);
const deviceList = ref<Device[]>([]);
const categories = ref<DeviceCategory[]>([]);
const formRef = ref<FormInstance>();
const currentDevice = ref<Device>();
const selectedRows = ref<Device[]>([]);

// 编辑器实例
const editorRef = shallowRef<IDomEditor>();

// 编辑器配置
const editorConfig: Partial<IEditorConfig> = {
  placeholder: "请输入设备详细描述",
  autoFocus: false,
  MENU_CONF: {
    uploadImage: {
      server: "/api/upload",
      fieldName: "file",
      maxFileSize: 2 * 1024 * 1024,
      maxNumberOfFiles: 10,
      allowedFileTypes: ["image/jpeg", "image/png"],
      meta: {
        token: "xxx" // 可以添加上传时的认证信息
      },
      customInsert(res: any, insertFn: Function) {
        insertFn(res.url);
      }
    }
  }
};

// 工具栏配置
const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: [
    "headerSelect",
    "blockquote",
    "|",
    "bold",
    "underline",
    "italic",
    {
      key: "group-more-style",
      title: "更多",
      menuKeys: ["through", "code", "sup", "sub", "clearStyle"]
    },
    "|",
    "color",
    "bgColor",
    "|",
    "fontSize",
    "fontFamily",
    "lineHeight",
    "|",
    "bulletedList",
    "numberedList",
    "todo",
    {
      key: "group-justify",
      title: "对齐",
      menuKeys: [
        "justifyLeft",
        "justifyCenter",
        "justifyRight",
        "justifyJustify"
      ]
    },
    "|",
    "insertLink",
    {
      key: "group-image",
      title: "图片",
      menuKeys: ["insertImage", "uploadImage"]
    },
    "insertTable",
    "|",
    "codeBlock",
    "divider",
    "|",
    "undo",
    "redo"
  ]
};

const editorMode = "default";

// 品牌选项
const brandOptions = [
  { label: "品牌1", value: "brand1" },
  { label: "品牌2", value: "brand2" }
  // ... 其他品牌选项
];

// 搜索表单
const searchParams = reactive({
  name: "",
  categoryId: "",
  status: "",
  minPrice: undefined as number | undefined,
  maxPrice: undefined as number | undefined,
  pageNum: 1,
  pageSize: 10
});

// 表单数据
interface DeviceForm {
  id: string;
  name: string;
  categoryId: string;
  serialNumber: string;
  status: "active" | "inactive";
  basePrice: number;
  rentDays: number;
  specification: string;
  parameters: DeviceParameter[];
  description: string;
  mainImage: string;
  images: string[];
  brand?: string;
  model?: string;
  warranty?: number;
  manufacturer?: string;
  specGroups: SpecGroup[];
  specCombinations: SpecCombination[];
  paramGroups: ParamGroup[];
}

const form = reactive<DeviceForm>({
  id: "",
  name: "",
  categoryId: "",
  serialNumber: "",
  status: "active",
  basePrice: 0,
  rentDays: 1,
  specification: "",
  parameters: [],
  description: "",
  mainImage: "",
  images: [],
  brand: "",
  model: "",
  warranty: 12,
  manufacturer: "",
  specGroups: [],
  specCombinations: [],
  paramGroups: []
});

// 表单校验规则
const rules = {
  name: [{ required: true, message: "请输入设备名称", trigger: "blur" }],
  categoryId: [
    { required: true, message: "请选择所属分类", trigger: "change" }
  ],
  serialNumber: [{ required: true, message: "请输入序列号", trigger: "blur" }],
  basePrice: [{ required: true, message: "请输入基础价格", trigger: "blur" }],
  rentDays: [{ required: true, message: "请输入租赁天数", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

// 状态选项
const statusOptions = [
  { label: "正常", value: "active" },
  { label: "停用", value: "inactive" }
];

// 表格样式
const tableHeaderStyle = {
  background: "var(--el-fill-color-light)",
  color: "var(--el-text-color-primary)",
  height: "50px"
};

// 获取分类列表
const fetchCategories = async () => {
  try {
    // TODO: 调用API获取分类列表
    categories.value = [
      { value: "1", label: "分类1" },
      { value: "2", label: "分类2" }
    ];
  } catch (error) {
    ElMessage.error("获取分类列表失败");
  }
};

// 获取设备列表
const fetchDeviceList = async () => {
  loading.value = true;
  try {
    // TODO: 调用API获取设备列表
    // const { data, total: totalCount } = await getDeviceList(searchParams);
    // deviceList.value = data;
    // total.value = totalCount;
    loading.value = false;
  } catch (error) {
    loading.value = false;
    ElMessage.error("获取设备列表失败");
  }
};

// 打开弹窗
const openModal = (record: Device | null) => {
  if (record) {
    Object.assign(form, record);
  } else {
    Object.assign(form, {
      id: "",
      name: "",
      categoryId: "",
      serialNumber: "",
      status: "active",
      basePrice: 0,
      rentDays: 1,
      specification: "",
      parameters: [],
      description: "",
      mainImage: "",
      images: [],
      specGroups: [],
      specCombinations: [],
      paramGroups: []
    });
  }
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  Object.assign(searchParams, {
    name: "",
    categoryId: "",
    status: "",
    minPrice: undefined,
    maxPrice: undefined,
    pageNum: 1,
    pageSize: 10
  });
  handleSearch();
};

// 搜索
const handleSearch = () => {
  searchParams.pageNum = 1;
  fetchDeviceList();
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      submitLoading.value = true;
      try {
        // TODO: 调用API保存数据
        ElMessage.success(form.id ? "更新成功" : "创建成功");
        dialogVisible.value = false;
        fetchDeviceList();
      } catch (error) {
        ElMessage.error(form.id ? "更新失败" : "创建失败");
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 更新设备
const handleUpdate = (row: Device) => {
  openModal(row);
};

// 删除设备
const handleDelete = async (row: Device) => {
  try {
    await ElMessageBox.confirm("确定要删除该设备吗？", "提示", {
      type: "warning"
    });
    // TODO: 调用API删除数据
    ElMessage.success("删除成功");
    fetchDeviceList();
  } catch {
    // 取消删除
  }
};

// 分页相关方法
const handleSizeChange = (val: number) => {
  searchParams.pageSize = val;
  fetchDeviceList();
};

const handleCurrentChange = (val: number) => {
  searchParams.pageNum = val;
  fetchDeviceList();
};

// 获取状态类型
const getStatusType = (status: string) => {
  return status === "active" ? "success" : "danger";
};

// 查看设备详情
const handleView = (row: Device) => {
  currentDevice.value = row;
  detailVisible.value = true;
};

// 规格相关方法
const generateSpecCombinations = () => {
  const groups = form.specGroups.filter(
    group => group.name && group.values.length > 0
  );
  if (!groups.length) {
    form.specCombinations = [];
    return;
  }

  // 生成笛卡尔积
  const cartesian = (arrays: string[][]): string[][] => {
    return arrays.reduce<string[][]>(
      (results, current) =>
        results.flatMap(result => current.map(item => [...result, item])),
      [[]]
    );
  };

  const values = groups.map(group => group.values);
  const combinations = cartesian(values);

  // 生成规格组合
  form.specCombinations = combinations.map(combo => {
    const specs = groups.reduce<Record<string, string>>((acc, group, index) => {
      acc[group.name] = combo[index];
      return acc;
    }, {});

    // 查找已存在的组合，保留其价格和库存
    const existing = form.specCombinations.find(
      item => JSON.stringify(item.specs) === JSON.stringify(specs)
    );

    return {
      id: existing?.id || Date.now().toString(),
      specs,
      price: existing?.price || form.basePrice,
      stock: existing?.stock || 0
    };
  });
};

// 添加规格组
const addSpecGroup = () => {
  form.specGroups.push({
    name: "",
    values: [],
    inputVisible: false,
    inputValue: ""
  });
};

// 删除规格组
const removeSpecGroup = (index: number) => {
  form.specGroups.splice(index, 1);
  generateSpecCombinations();
};

// 显示规格值输入框
const showSpecInput = (group: SpecGroup) => {
  group.inputVisible = true;
  nextTick(() => {
    const input =
      document.querySelector<HTMLInputElement>(".value-input input");
    input?.focus();
  });
};

// 确认添加规格值
const confirmSpecValue = (group: SpecGroup) => {
  const value = group.inputValue?.trim();
  if (value && !group.values.includes(value)) {
    group.values.push(value);
    generateSpecCombinations();
  }
  group.inputVisible = false;
  group.inputValue = "";
};

// 删除规格值
const removeSpecValue = (group: SpecGroup, index: number) => {
  group.values.splice(index, 1);
  generateSpecCombinations();
};

// 监听规格组名称变化
watch(
  () => form.specGroups.map(g => g.name),
  () => {
    generateSpecCombinations();
  },
  { deep: true }
);

// 监听基础价格变化
watch(
  () => form.basePrice,
  newPrice => {
    // 更新没有自定义价格的规格组合
    form.specCombinations = form.specCombinations.map(combo => ({
      ...combo,
      price: combo.price === form.basePrice ? newPrice : combo.price
    }));
  }
);

// 图片上传相关方法
const handleMainImageSuccess = (response: any) => {
  form.mainImage = response.url;
  ElMessage.success("上传成功");
};

const handleImageSuccess = (response: any) => {
  form.images.push(response.url);
};

const handleImageRemove = (file: any) => {
  const index = form.images.indexOf(file.url);
  if (index > -1) {
    form.images.splice(index, 1);
  }
};

const handleImagePreview = (file: any) => {
  window.open(file.url);
};

const removeMainImage = () => {
  form.mainImage = "";
};

const previewImage = (url: string) => {
  window.open(url);
};

// 添加处理表格选择变化的方法
const handleSelectionChange = (selection: Device[]) => {
  selectedRows.value = selection;
};

// 添加导出数据方法
const handleExport = () => {
  // TODO: 实现导出逻辑
  ElMessage.success("导出成功");
};

// 添加批量删除方法
const handleBatchDelete = async () => {
  if (!selectedRows.value.length) {
    ElMessage.warning("请选择要删除的设备");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个设备吗？`,
      "提示",
      {
        type: "warning"
      }
    );
    // TODO: 调用API批量删除
    ElMessage.success("删除成功");
    selectedRows.value = [];
    fetchDeviceList();
  } catch {
    // 取消删除
  }
};

// 获取规格价格范围的方法
const getSpecPriceRange = (specOptions: SpecOption[]) => {
  if (!specOptions?.length) return "";
  const prices = specOptions.map(option => option.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  return minPrice === maxPrice
    ? `¥${minPrice.toFixed(2)}`
    : `¥${minPrice.toFixed(2)} - ¥${maxPrice.toFixed(2)}`;
};

// 获取总库存的方法
const getTotalStock = (specGroups: SpecGroup[]) => {
  if (!specGroups?.length) return 0;
  return specGroups.reduce((total, group) => {
    return (
      total +
      group.values.reduce(
        (valueTotal, value) => valueTotal + (value.stock || 0),
        0
      )
    );
  }, 0);
};

// 添加设备参数相关方法
const addParamGroup = () => {
  form.paramGroups.push({
    name: "",
    params: []
  });
};

const removeParamGroup = (index: number) => {
  form.paramGroups.splice(index, 1);
};

const addParam = (group: ParamGroup) => {
  group.params.push({
    name: "",
    value: "",
    unit: ""
  });
};

const removeParam = (group: ParamGroup, index: number) => {
  group.params.splice(index, 1);
};

// 添加对话框关闭处理方法
const handleDialogClosed = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.specGroups = [];
  form.paramGroups = [];
};

// 文件上传前的验证
const beforeUpload = (file: File) => {
  const isImage = ["image/jpeg", "image/png"].includes(file.type);
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error("只能上传JPG或PNG格式的图片!");
    return false;
  }
  if (!isLt2M) {
    ElMessage.error("图片大小不能超过2MB!");
    return false;
  }
  return true;
};

// 组件销毁时
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

// 创建编辑器时的回调
const handleEditorCreated = (editor: IDomEditor) => {
  editorRef.value = editor;
};

// 编辑器样式
const editorStyle = {
  ".w-e-text-container": {
    minHeight: "500px !important",
    backgroundColor: "#fff"
  }
};

// 初始化
onMounted(() => {
  fetchCategories();
  fetchDeviceList();
});
</script>

<style lang="scss" scoped>
.device-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);

  .device-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;

      h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .device-count {
        font-size: 14px;
      }
    }
  }

  .search-card {
    margin-bottom: 20px;
    border-radius: 8px;

    .search-form {
      padding: 10px 0;

      :deep(.el-form-item) {
        margin-bottom: 0;
        margin-right: 20px;

        .el-input,
        .el-select,
        .el-cascader {
          width: 220px;
        }

        &.price-range {
          .price-input {
            width: 120px;
          }

          .price-separator {
            margin: 0 8px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }

  .table-card {
    border-radius: 8px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .device-image {
      width: 60px;
      height: 60px;
      border-radius: 4px;
      cursor: pointer;
    }

    .device-name {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .el-tag {
        width: fit-content;
      }
    }

    .price-info {
      .base-price {
        font-size: 16px;
        color: var(--el-color-danger);
        font-weight: 500;

        .rent-days {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          font-weight: normal;
        }
      }

      .spec-price {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding: 10px 0;
  }
}

.device-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }

  .device-form {
    .form-container {
      display: flex;
      min-height: 600px;

      // 左侧主要内容
      .main-content {
        flex: 1;
        padding: 20px;
        border-right: 1px solid var(--el-border-color-light);

        .custom-tabs {
          :deep(.el-tabs__header) {
            margin-bottom: 20px;
          }
        }

        .form-section {
          background: var(--el-bg-color);
          border-radius: 8px;

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--el-border-color-lighter);

            .section-title {
              font-size: 16px;
              font-weight: 500;
              color: var(--el-text-color-primary);
            }
          }

          .form-content {
            padding: 0 0 20px;
          }

          // 规格卡片样式
          .spec-groups {
            .spec-group-card {
              background: var(--el-fill-color-blank);
              border: 1px solid var(--el-border-color-lighter);
              border-radius: 8px;
              margin-bottom: 16px;
              transition: all 0.3s;

              &:hover {
                box-shadow: var(--el-box-shadow-light);
              }

              .group-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                border-bottom: 1px solid var(--el-border-color-lighter);

                .group-name-input {
                  width: 200px;
                }
              }

              .group-content {
                padding: 16px;

                .value-list {
                  .value-tag {
                    margin-right: 8px;
                  }

                  .value-input {
                    width: 120px;
                  }
                }
              }
            }
          }

          // 参数列表样式
          .param-groups {
            .param-group-card {
              margin-bottom: 16px;
              padding: 16px;
              background: var(--el-fill-color-blank);
              border-radius: 8px;
              transition: all 0.3s;

              &:hover {
                box-shadow: var(--el-box-shadow-light);
              }

              .group-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
              }

              .param-list {
                .param-item {
                  margin-bottom: 12px;
                }
              }
            }
          }

          // 编辑器容器样式
          .editor-container {
            border: 1px solid var(--el-border-color);
            border-radius: 8px;
            overflow: hidden;
          }
        }
      }

      // 右侧边栏
      .side-content {
        width: 300px;
        padding: 20px;
        background: var(--el-fill-color-blank);

        .side-section {
          margin-bottom: 24px;

          .side-title {
            font-size: 16px;
            font-weight: 500;
            color: var(--el-text-color-primary);
            margin-bottom: 16px;
          }

          // 上传区域样式
          .upload-container {
            .main-image-uploader {
              margin-bottom: 24px;

              .uploader-title {
                font-size: 14px;
                color: var(--el-text-color-regular);
                margin-bottom: 12px;
              }

              .upload-area {
                position: relative;
                width: 200px;
                height: 200px;
                border: 2px dashed var(--el-border-color);
                border-radius: 8px;
                overflow: hidden;
                transition: all 0.3s;
                cursor: pointer;

                .preview-image {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                  background: #f5f7fa;
                }

                .image-actions {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  display: none;
                  gap: 16px;
                  background: rgba(0, 0, 0, 0.7);
                  padding: 20px;
                  border-radius: 12px;
                  z-index: 2;
                }

                &.has-image {
                  border-style: solid;
                  border-color: var(--el-border-color-darker);

                  &:hover {
                    .image-actions {
                      display: flex;
                    }

                    &::after {
                      content: "";
                      position: absolute;
                      inset: 0;
                      background: rgba(0, 0, 0, 0.3);
                      z-index: 1;
                    }
                  }
                }

                .upload-placeholder {
                  height: 100%;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  background: var(--el-fill-color-lighter);

                  .upload-icon {
                    font-size: 40px;
                    color: var(--el-text-color-secondary);
                    margin-bottom: 12px;
                  }

                  span {
                    font-size: 14px;
                    color: var(--el-text-color-secondary);
                  }
                }

                &:hover {
                  border-color: var(--el-color-primary);
                  .upload-placeholder {
                    color: var(--el-color-primary);
                    .upload-icon {
                      color: var(--el-color-primary);
                    }
                    span {
                      color: var(--el-color-primary);
                    }
                  }
                }
              }
            }

            .extra-images-uploader {
              .uploader-title {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;

                span {
                  font-size: 14px;
                  color: var(--el-text-color-regular);

                  &.image-count {
                    color: var(--el-text-color-secondary);
                  }
                }
              }

              :deep(.el-upload--picture-card) {
                width: 100px;
                height: 100px;
                margin: 0 8px 8px 0;
              }
            }
          }

          .upload-tip {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 12px;
            padding: 8px 12px;
            background: var(--el-color-primary-light-9);
            border-radius: 4px;

            .el-icon {
              font-size: 14px;
              color: var(--el-color-primary);
            }

            span {
              font-size: 12px;
              color: var(--el-text-color-regular);
            }
          }

          // 价格预览样式
          .price-preview {
            background: var(--el-fill-color-lighter);
            border-radius: 8px;
            padding: 16px;

            .price-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;

              &.base-price {
                .value {
                  font-size: 20px;
                  color: var(--el-color-danger);
                }
              }

              .label {
                color: var(--el-text-color-regular);
              }

              .value {
                color: var(--el-color-danger);
                font-weight: 500;
              }
            }

            .divider {
              height: 1px;
              background: var(--el-border-color-lighter);
              margin: 8px 0;
            }
          }
        }
      }
    }
  }

  .dialog-footer {
    padding: 20px;
    text-align: right;
    border-top: 1px solid var(--el-border-color-light);
  }
}

.editor-container {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;

  :deep(.w-e-toolbar) {
    border-bottom: 1px solid var(--el-border-color-light);
    background-color: var(--el-bg-color);
    padding: 8px;

    .w-e-bar-item {
      .w-e-bar-item-menu-item {
        padding: 6px 10px;
        &:hover {
          background-color: var(--el-color-primary-light-9);
        }
      }
    }

    .w-e-bar-divider {
      height: 20px;
      margin: 0 8px;
    }
  }

  :deep(.w-e-text-container) {
    background-color: var(--el-bg-color-blank);
    padding: 12px 20px;

    .w-e-text {
      min-height: 500px;
    }
  }

  :deep(.w-e-panel-content-color) {
    .w-e-color-hex-input {
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
    }
  }
}
</style>
