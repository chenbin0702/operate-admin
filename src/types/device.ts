// 新建设备相关类型定义文件
export interface Device {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  serialNumber: string;
  status: "active" | "inactive";
  basePrice: number; // 基础价格
  rentDays: number;
  specification: string;
  specOptions: SpecOption[]; // 规格选项
  parameters: DeviceParameter[];
  description?: string;
  images: string[]; // 支持多图片
  mainImage: string; // 主图
  createTime: string;
  brand?: string; // 品牌
  model?: string; // 型号
  warranty?: number; // 保修期
  manufacturer?: string; // 制造商
  specGroups: SpecGroup[];
  specCombinations: SpecCombination[];
  paramGroups: ParamGroup[];
}

// 规格明细
export interface SpecDetail {
  key: string;
  value: string;
}

// 设备参数
export interface DeviceParameter {
  name: string;
  value: string;
  unit: string;
  group?: string; // 参数分组
}

export interface DeviceCategory {
  value: string;
  label: string;
  children?: DeviceCategory[];
}

export interface SearchParams {
  name?: string;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  pageNum: number;
  pageSize: number;
}

// 设备规格选项
export interface SpecOption {
  id: string;
  name: string;
  price: number;
  stock: number;
  specValues: SpecValue[];
  isDefault?: boolean; // 是否默认规格
}

// 规格值
export interface SpecValue {
  name: string;
  price: number;
  stock: number;
}

// 规格组
export interface SpecGroup {
  name: string;
  values: SpecValue[];
  inputVisible?: boolean;
  inputValue?: string;
}

// 规格组合
export interface SpecCombination {
  id: string;
  specs: Record<string, string>; // 规格名称: 规格值
  price: number;
  stock: number;
}

// 参数组
export interface ParamGroup {
  name: string;
  params: DeviceParameter[];
}

// 库存状态类型
export type InventoryStatus = 'in_stock' | 'out_of_stock' | 'low_stock';

// 库存记录类型
export interface InventoryRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  quantity: number;
  status: InventoryStatus;
  location: string;
  note: string;
  updateTime: string;
}

// 设备选项类型
export interface DeviceOption {
  id: string;
  name: string;
}
