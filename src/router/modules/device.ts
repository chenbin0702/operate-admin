const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/device",
    name: "Device",
    component: Layout,
    redirect: "/device/category",
    meta: {
      title: "设备管理",
      icon: "ri:computer-line",
      rank: 12
    },
    children: [
      {
        path: "/device/category",
        name: "DeviceCategory",
        component: () => import("@/views/device/category/index.vue"),
        meta: {
          title: "设备分类"
        }
      },
      {
        path: "/device/list",
        name: "DeviceList",
        component: () => import("@/views/device/list/index.vue"),
        meta: {
          title: "设备列表"
        }
      },
      {
        path: "/device/inventory",
        name: "DeviceInventory",
        component: () => import("@/views/device/inventory/index.vue"),
        meta: {
          title: "库存管理"
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
