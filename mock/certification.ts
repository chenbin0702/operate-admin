import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { faker } from "@faker-js/faker/locale/zh_CN";

// 生成随机身份证号
const generateIdCard = () => {
  // 随机生成一个18位的身份证号码
  const prefix = faker.location.zipCode("#####");
  const middle = faker.date
    .birthdate({ min: 1960, max: 2000, mode: "year" })
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")
    .slice(0, 8);
  const suffix = faker.string.numeric(3);
  const checkCode = "0123456789X"[Math.floor(Math.random() * 11)];
  return `${prefix}${middle}${suffix}${checkCode}`;
};

// 生成模拟数据
const generateMockData = (count = 20) => {
  const statusOptions = ["pending", "approved", "rejected"];
  const list = [];

  for (let i = 0; i < count; i++) {
    const status =
      statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const createTime = faker.date.recent({ days: 30 }).toISOString();

    list.push({
      id: i + 1,
      name: faker.person.fullName(),
      idCard: generateIdCard(),
      status,
      createTime,
      frontImage: "https://picsum.photos/400/300?random=" + (i * 3 + 1),
      backImage: "https://picsum.photos/400/300?random=" + (i * 3 + 2),
      faceImage: "https://picsum.photos/400/300?random=" + (i * 3 + 3),
      rejectReason: status === "rejected" ? faker.lorem.sentence() : undefined
    });
  }

  return list;
};

// 生成一次，保持数据一致性
const mockData = generateMockData();

export default defineFakeRoute([
  // 实名认证列表
  {
    url: "/certification/realname/list",
    method: "post",
    response: ({ body }) => {
      let list = [...mockData];

      // 筛选条件
      if (body?.name) {
        list = list.filter(item => item.name.includes(body.name));
      }

      if (body?.idCard) {
        list = list.filter(item => item.idCard.includes(body.idCard));
      }

      if (body?.status) {
        list = list.filter(item => item.status === body.status);
      }

      // 分页
      const pageSize = body?.pageSize || 10;
      const currentPage = body?.currentPage || 1;
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedList = list.slice(startIndex, startIndex + pageSize);

      return {
        success: true,
        data: {
          list: paginatedList,
          total: list.length,
          pageSize,
          currentPage
        }
      };
    }
  },

  // 实名认证详情
  {
    url: "/certification/realname/detail/:id",
    method: "get",
    response: ({ query }) => {
      const id = parseInt(query.id as string);
      const item = mockData.find(item => item.id === id);

      if (item) {
        return {
          success: true,
          data: item
        };
      } else {
        return {
          success: false,
          message: "未找到对应的实名认证记录"
        };
      }
    }
  },

  // 审核实名认证
  {
    url: "/certification/realname/audit",
    method: "post",
    response: ({ body }) => {
      const { id, status, rejectReason } = body;
      const index = mockData.findIndex(item => item.id === id);

      if (index !== -1) {
        mockData[index].status = status;
        if (status === "rejected" && rejectReason) {
          mockData[index].rejectReason = rejectReason;
        }

        return {
          success: true,
          message: status === "approved" ? "审核通过成功" : "审核拒绝成功"
        };
      } else {
        return {
          success: false,
          message: "未找到对应的实名认证记录"
        };
      }
    }
  }
]);
