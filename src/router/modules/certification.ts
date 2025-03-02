const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/certification",
    name: "Certification",
    component: Layout,
    redirect: "/certification/realname",
    meta: {
      title: "认证管理",
      icon: "ri:verified-badge-line",
      rank: 11
    },
    children: [
      {
        path: "/certification/realname",
        name: "CertificationRealname",
        component: () => import("@/views/certification/realname/index.vue"),
        meta: {
          title: "实名认证审核"
        }
      },
      {
        path: "/certification/pilot",
        name: "CertificationPilot",
        component: () => import("@/views/certification/pilot/index.vue"),
        meta: {
          title: "飞手资质审核"
        }
      },
      {
        path: "/certification/certificate",
        name: "CertificationCertificate",
        component: () => import("@/views/certification/certificate/index.vue"),
        meta: {
          title: "证书管理"
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
