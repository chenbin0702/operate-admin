import { http } from "@/utils/http";
import request from "@/utils/request";

export type RealnameVerificationItem = {
  id: number;
  name: string;
  idCard: string;
  status: "pending" | "approved" | "rejected";
  createTime: string;
  frontImage: string;
  backImage: string;
  faceImage: string;
  rejectReason?: string;
};

export type RealnameVerificationResult = {
  success: boolean;
  data: {
    list: RealnameVerificationItem[];
    total: number;
    pageSize: number;
    currentPage: number;
  };
};

export type RealnameVerificationDetailResult = {
  success: boolean;
  data: RealnameVerificationItem;
};

export type RealnameVerificationParams = {
  name?: string;
  idCard?: string;
  status?: string;
  currentPage?: number;
  pageSize?: number;
};

export type AuditParams = {
  id: number;
  status: "approved" | "rejected";
  rejectReason?: string;
};

// 飞手认证相关的类型定义
export interface PilotVerificationItem {
  id: number;
  name: string;
  certificateNo: string;
  certificateType: string;
  submitTime: string;
  expireTime: string;
  status: "pending" | "approved" | "rejected";
  rejectReason?: string;
  certificateImage: string;
  idCardFrontImage: string;
  idCardBackImage: string;
  qualificationImage: string;
}

export interface PilotVerificationParams {
  name?: string;
  certificateNo?: string;
  status?: string;
  currentPage?: number;
  pageSize?: number;
}

export interface PilotVerificationResponse {
  list: PilotVerificationItem[];
  total: number;
}

export interface AuditPilotParams {
  id: number;
  status: "approved" | "rejected";
  rejectReason?: string;
}

/** 获取实名认证列表 */
export const getRealnameVerificationList = (
  data?: RealnameVerificationParams
) => {
  return http.request<RealnameVerificationResult>(
    "post",
    "/certification/realname/list",
    { data }
  );
};

/** 获取实名认证详情 */
export const getRealnameVerificationDetail = (id: number) => {
  return http.request<RealnameVerificationDetailResult>(
    "get",
    `/certification/realname/detail/${id}`
  );
};

/** 审核实名认证 */
export const auditRealnameVerification = (data: AuditParams) => {
  return http.request<{ success: boolean }>(
    "post",
    "/certification/realname/audit",
    { data }
  );
};

// 获取飞手认证列表
export function getPilotVerificationList(params: PilotVerificationParams) {
  // 模拟静态数据
  const mockData: PilotVerificationResponse = {
    list: [
      {
        id: 1,
        name: "张三",
        certificateNo: "RPAS-2023-001",
        certificateType: "无人机驾驶员合格证",
        submitTime: "2023-12-01 10:00:00",
        expireTime: "2025-12-01",
        status: "pending",
        certificateImage: "https://picsum.photos/400/300",
        idCardFrontImage: "https://picsum.photos/400/300",
        idCardBackImage: "https://picsum.photos/400/300",
        qualificationImage: "https://picsum.photos/400/300"
      },
      {
        id: 2,
        name: "李四",
        certificateNo: "RPAS-2023-002",
        certificateType: "无人机驾驶员等级证",
        submitTime: "2023-12-02 11:30:00",
        expireTime: "2025-12-02",
        status: "approved",
        certificateImage: "https://picsum.photos/400/300",
        idCardFrontImage: "https://picsum.photos/400/300",
        idCardBackImage: "https://picsum.photos/400/300",
        qualificationImage: "https://picsum.photos/400/300"
      },
      {
        id: 3,
        name: "王五",
        certificateNo: "RPAS-2023-003",
        certificateType: "无人机驾驶员执照",
        submitTime: "2023-12-03 14:20:00",
        expireTime: "2025-12-03",
        status: "rejected",
        rejectReason: "证书信息不完整，请补充相关资质证明",
        certificateImage: "https://picsum.photos/400/300",
        idCardFrontImage: "https://picsum.photos/400/300",
        idCardBackImage: "https://picsum.photos/400/300",
        qualificationImage: "https://picsum.photos/400/300"
      },
      {
        id: 4,
        name: "赵六",
        certificateNo: "RPAS-2023-004",
        certificateType: "无人机驾驶员合格证",
        submitTime: "2023-12-04 09:15:00",
        expireTime: "2025-12-04",
        status: "pending",
        certificateImage: "https://picsum.photos/400/300",
        idCardFrontImage: "https://picsum.photos/400/300",
        idCardBackImage: "https://picsum.photos/400/300",
        qualificationImage: "https://picsum.photos/400/300"
      },
      {
        id: 5,
        name: "钱七",
        certificateNo: "RPAS-2023-005",
        certificateType: "无人机驾驶员等级证",
        submitTime: "2023-12-05 16:40:00",
        expireTime: "2025-12-05",
        status: "approved",
        certificateImage: "https://picsum.photos/400/300",
        idCardFrontImage: "https://picsum.photos/400/300",
        idCardBackImage: "https://picsum.photos/400/300",
        qualificationImage: "https://picsum.photos/400/300"
      }
    ],
    total: 5
  };

  // 模拟搜索过滤
  let filteredList = [...mockData.list];

  if (params.name) {
    filteredList = filteredList.filter(item =>
      item.name.includes(params.name!)
    );
  }

  if (params.certificateNo) {
    filteredList = filteredList.filter(item =>
      item.certificateNo.includes(params.certificateNo!)
    );
  }

  if (params.status) {
    filteredList = filteredList.filter(item =>
      item.status === params.status
    );
  }

  // 模拟分页
  const start = ((params.currentPage || 1) - 1) * (params.pageSize || 10);
  const end = start + (params.pageSize || 10);
  const pagedList = filteredList.slice(start, end);

  return Promise.resolve({
    success: true,
    data: {
      list: pagedList,
      total: filteredList.length
    }
  });
}

// 审核飞手认证
export function auditPilotVerification(data: AuditPilotParams) {
  // 模拟审核操作
  return Promise.resolve({
    success: true,
    message: data.status === "approved" ? "审核通过成功" : "审核拒绝成功"
  });
}
