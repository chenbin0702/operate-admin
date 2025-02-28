<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { loginRules } from "./utils/rule";
import TypeIt from "@/components/ReTypeit";
import { debounce } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useEventListener } from "@vueuse/core";
import type { FormInstance } from "element-plus";
import { $t, transformI18n } from "@/plugins/i18n";
import { operates, thirdParty } from "./utils/enums";
import { useLayout } from "@/layout/hooks/useLayout";
import LoginPhone from "./components/LoginPhone.vue";
import LoginRegist from "./components/LoginRegist.vue";
import LoginUpdate from "./components/LoginUpdate.vue";
import LoginQrCode from "./components/LoginQrCode.vue";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter, getTopMenu } from "@/router/utils";
import { bg, avatar, illustration } from "./utils/static";
import { ReImageVerify } from "@/components/ReImageVerify";
import { ref, toRaw, reactive, watch, computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useTranslationLang } from "@/layout/hooks/useTranslationLang";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import globalization from "@/assets/svg/globalization.svg?component";
import Lock from "@iconify-icons/ri/lock-fill";
import Check from "@iconify-icons/ep/check";
import User from "@iconify-icons/ri/user-3-fill";
import Info from "@iconify-icons/ri/information-line";

defineOptions({
  name: "Login"
});

const imgCode = ref("");
const loginDay = ref(7);
const router = useRouter();
const loading = ref(false);
const checked = ref(false);
const disabled = ref(false);
const ruleFormRef = ref<FormInstance>();
const currentPage = computed(() => {
  return useUserStoreHook().currentPage;
});

const { t } = useI18n();
const { initStorage } = useLayout();
initStorage();
const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title, getDropdownItemStyle, getDropdownItemClass } = useNav();
const { locale, translationCh, translationEn } = useTranslationLang();

const ruleForm = reactive({
  username: "admin",
  password: "admin123",
  verifyCode: ""
});

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;
      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.username,
          password: ruleForm.password
        })
        .then(res => {
          if (res.success) {
            // 获取后端路由
            return initRouter().then(() => {
              disabled.value = true;
              router
                .push(getTopMenu(true).path)
                .then(() => {
                  message(t("login.pureLoginSuccess"), { type: "success" });
                })
                .finally(() => (disabled.value = false));
            });
          } else {
            message(t("login.pureLoginFail"), { type: "error" });
          }
        })
        .finally(() => (loading.value = false));
    }
  });
};

const immediateDebounce: any = debounce(
  formRef => onLogin(formRef),
  1000,
  true
);

useEventListener(document, "keydown", ({ code }) => {
  if (
    ["Enter", "NumpadEnter"].includes(code) &&
    !disabled.value &&
    !loading.value
  )
    immediateDebounce(ruleFormRef.value);
});

watch(imgCode, value => {
  useUserStoreHook().SET_VERIFYCODE(value);
});
watch(checked, bool => {
  useUserStoreHook().SET_ISREMEMBERED(bool);
});
watch(loginDay, value => {
  useUserStoreHook().SET_LOGINDAY(value);
});

// 添加系统描述文案
const systemDesc = {
  title: "低空经济运营管理平台",
  subtitle: "LOW-ALTITUDE ECONOMY MANAGEMENT",
  features: [
    "无人机管理与调度",
    "低空空域资源管理",
    "运营数据分析",
    "智能调度系统"
  ]
};
</script>

<template>
  <div class="select-none">
    <!-- 更新背景样式 -->
    <div class="login-bg-overlay" />
    <img :src="bg" class="wave" />

    <!-- 保持原有的主题切换和语言切换 -->
    <div class="flex-c absolute right-5 top-3">
      <!-- 主题 -->
      <el-switch
        v-model="dataTheme"
        inline-prompt
        :active-icon="dayIcon"
        :inactive-icon="darkIcon"
        @change="dataThemeChange"
      />
      <!-- 国际化 -->
      <el-dropdown trigger="click">
        <globalization
          class="hover:text-primary hover:!bg-[transparent] w-[20px] h-[20px] ml-1.5 cursor-pointer outline-none duration-300"
        />
        <template #dropdown>
          <el-dropdown-menu class="translation">
            <el-dropdown-item
              :style="getDropdownItemStyle(locale, 'zh')"
              :class="['dark:!text-white', getDropdownItemClass(locale, 'zh')]"
              @click="translationCh"
            >
              <IconifyIconOffline
                v-show="locale === 'zh'"
                class="check-zh"
                :icon="Check"
              />
              简体中文
            </el-dropdown-item>
            <el-dropdown-item
              :style="getDropdownItemStyle(locale, 'en')"
              :class="['dark:!text-white', getDropdownItemClass(locale, 'en')]"
              @click="translationEn"
            >
              <span v-show="locale === 'en'" class="check-en">
                <IconifyIconOffline :icon="Check" />
              </span>
              English
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="login-container">
      <!-- 左侧介绍区域 -->
      <div class="login-intro">
        <h1 class="intro-title">{{ systemDesc.title }}</h1>
        <p class="intro-subtitle">{{ systemDesc.subtitle }}</p>
        <div class="feature-list">
          <div
            v-for="(feature, index) in systemDesc.features"
            :key="index"
            class="feature-item"
          >
            <el-icon><Check /></el-icon>
            <span>{{ feature }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧登录区域 -->
      <div class="login-box glass-effect">
        <div class="login-form">
          <!-- 更新Logo样式 -->
          <div class="logo-container">
            <avatar class="avatar" />
            <Motion>
              <h2 class="platform-title">
                <TypeIt
                  :options="{ strings: [title], cursor: false, speed: 100 }"
                />
              </h2>
            </Motion>
          </div>

          <el-form
            v-if="currentPage === 0"
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="loginRules"
            size="large"
          >
            <Motion :delay="100">
              <el-form-item
                :rules="[
                  {
                    required: true,
                    message: transformI18n($t('login.pureUsernameReg')),
                    trigger: 'blur'
                  }
                ]"
                prop="username"
              >
                <el-input
                  v-model="ruleForm.username"
                  clearable
                  :placeholder="t('login.pureUsername')"
                  :prefix-icon="useRenderIcon(User)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="150">
              <el-form-item prop="password">
                <el-input
                  v-model="ruleForm.password"
                  clearable
                  show-password
                  :placeholder="t('login.purePassword')"
                  :prefix-icon="useRenderIcon(Lock)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="200">
              <el-form-item prop="verifyCode">
                <el-input
                  v-model="ruleForm.verifyCode"
                  clearable
                  :placeholder="t('login.pureVerifyCode')"
                  :prefix-icon="useRenderIcon('ri:shield-keyhole-line')"
                >
                  <template v-slot:append>
                    <ReImageVerify v-model:code="imgCode" />
                  </template>
                </el-input>
              </el-form-item>
            </Motion>

            <Motion :delay="250">
              <el-form-item>
                <div class="w-full h-[20px] flex justify-between items-center">
                  <el-checkbox v-model="checked">
                    <span class="flex">
                      <select
                        v-model="loginDay"
                        :style="{
                          width: loginDay < 10 ? '10px' : '16px',
                          outline: 'none',
                          background: 'none',
                          appearance: 'none'
                        }"
                      >
                        <option value="1">1</option>
                        <option value="7">7</option>
                        <option value="30">30</option>
                      </select>
                      {{ t("login.pureRemember") }}
                      <IconifyIconOffline
                        v-tippy="{
                          content: t('login.pureRememberInfo'),
                          placement: 'top'
                        }"
                        :icon="Info"
                        class="ml-1"
                      />
                    </span>
                  </el-checkbox>
                  <el-button
                    link
                    type="primary"
                    @click="useUserStoreHook().SET_CURRENTPAGE(4)"
                  >
                    {{ t("login.pureForget") }}
                  </el-button>
                </div>
                <el-button
                  class="w-full mt-4"
                  size="default"
                  type="primary"
                  :loading="loading"
                  :disabled="disabled"
                  @click="onLogin(ruleFormRef)"
                >
                  {{ t("login.pureLogin") }}
                </el-button>
              </el-form-item>
            </Motion>

            <Motion :delay="300">
              <el-form-item>
                <div class="w-full h-[20px] flex justify-between items-center">
                  <el-button
                    v-for="(item, index) in operates"
                    :key="index"
                    class="w-full mt-4"
                    size="default"
                    @click="useUserStoreHook().SET_CURRENTPAGE(index + 1)"
                  >
                    {{ t(item.title) }}
                  </el-button>
                </div>
              </el-form-item>
            </Motion>
          </el-form>

          <Motion v-if="currentPage === 0" :delay="350">
            <el-form-item>
              <el-divider>
                <p class="text-gray-500 text-xs">
                  {{ t("login.pureThirdLogin") }}
                </p>
              </el-divider>
              <div class="w-full flex justify-evenly">
                <span
                  v-for="(item, index) in thirdParty"
                  :key="index"
                  :title="t(item.title)"
                >
                  <IconifyIconOnline
                    :icon="`ri:${item.icon}-fill`"
                    width="20"
                    class="cursor-pointer text-gray-500 hover:text-blue-400"
                  />
                </span>
              </div>
            </el-form-item>
          </Motion>
          <!-- 手机号登录 -->
          <LoginPhone v-if="currentPage === 1" />
          <!-- 二维码登录 -->
          <LoginQrCode v-if="currentPage === 2" />
          <!-- 注册 -->
          <LoginRegist v-if="currentPage === 3" />
          <!-- 忘记密码 -->
          <LoginUpdate v-if="currentPage === 4" />
        </div>
      </div>
    </div>

    <!-- 更新页脚样式 -->
    <div class="footer-container">
      <p>Copyright © 2024 低空经济运营管理平台</p>
      <p>全国统一服务热线：400-XXX-XXXX</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import url("@/style/login.css");

// 更新背景样式
.login-bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  // 使用更柔和的渐变背景
  background: linear-gradient(120deg, #f0f7ff 0%, #e1f0ff 50%, #d4e7ff 100%);
  z-index: -1;

  &::before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234a90e2' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.4;
  }
}

.wave {
  opacity: 0.3;
  mix-blend-mode: overlay;
}

// 优化容器样式
.login-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3% 8%;
  min-height: 100vh;
  position: relative;
  gap: 4rem;

  &::before {
    content: "";
    position: absolute;
    top: 10%;
    right: 15%;
    width: 300px;
    height: 300px;
    background: radial-gradient(
      circle,
      rgba(135, 206, 250, 0.1) 0%,
      transparent 70%
    );
    border-radius: 50%;
    filter: blur(40px);
  }
}

// 优化左侧介绍区域
.login-intro {
  flex: 1;
  max-width: 600px;
  position: relative;
  z-index: 1;

  .intro-title {
    font-size: 3rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    background: linear-gradient(45deg, #2c5282, #4299e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: 1px;
    line-height: 1.2;
  }

  .intro-subtitle {
    font-size: 1.4rem;
    color: #4a5568;
    margin-bottom: 3rem;
    letter-spacing: 2px;
    font-weight: 500;
  }

  .feature-list {
    display: grid;
    gap: 1.2rem;

    .feature-item {
      display: flex;
      align-items: center;
      padding: 1rem 1.5rem;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;

      &:hover {
        transform: translateX(10px);
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.05);
      }

      .el-icon {
        margin-right: 15px;
        color: #4299e1;
        font-size: 1.4em;
        background: rgba(66, 153, 225, 0.1);
        padding: 8px;
        border-radius: 8px;
      }

      span {
        color: #2d3748;
        font-weight: 500;
        font-size: 1.1rem;
      }
    }
  }
}

// 优化登录框样式
.login-box {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  padding: 3rem;
  width: 440px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.7);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(20px);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transform: translateX(-100%);
    animation: shine 3s infinite;
  }
}

.logo-container {
  text-align: center;
  margin-bottom: 3rem;

  .avatar {
    width: 80px;
    height: 80px;
    transform: scale(1.1);
    transition: all 0.3s ease;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));

    &:hover {
      transform: scale(1.15) rotate(5deg);
    }
  }

  .platform-title {
    font-size: 1.8rem;
    background: linear-gradient(45deg, #2c5282, #4299e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-top: 1.5rem;
    font-weight: 700;
  }
}

// 优化表单控件样式
:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.8) !important;
  border: 1px solid rgba(66, 153, 225, 0.2) !important;
  border-radius: 12px !important;
  padding: 0.5rem 1rem !important;
  transition: all 0.3s ease;
  height: 48px;

  &:hover,
  &:focus-within {
    background: #ffffff !important;
    border-color: rgba(66, 153, 225, 0.5) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(66, 153, 225, 0.1);
  }

  .el-input__inner {
    font-size: 1rem !important;
    color: #2d3748 !important;
  }
}

:deep(.el-button--primary) {
  background: linear-gradient(45deg, #4299e1, #2c5282);
  border: none;
  height: 48px;
  font-weight: 600;
  letter-spacing: 1px;
  border-radius: 12px;
  transition: all 0.3s ease;
  font-size: 1.1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(66, 153, 225, 0.2);
    background: linear-gradient(45deg, #3182ce, #2c5282);
  }
}

// 优化页脚样式
.footer-container {
  position: absolute;
  bottom: 2rem;
  width: 100%;
  text-align: center;
  color: #4a5568;

  p {
    margin: 0.5rem 0;
    font-size: 1rem;
    font-weight: 500;
    opacity: 0.8;
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 1;
    }
  }
}

// 响应式优化
@media (max-width: 1280px) {
  .login-container {
    padding: 2rem 5%;
    gap: 3rem;
  }

  .login-intro .intro-title {
    font-size: 2.5rem;
  }
}

@media (max-width: 1024px) {
  .login-container {
    flex-direction: column;
    justify-content: center;
    padding: 3rem 2rem;
    gap: 2rem;
  }

  .login-intro {
    padding: 0;
    margin-bottom: 2rem;
    text-align: center;
    max-width: 100%;

    .feature-list {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;

      .feature-item {
        justify-content: center;

        &:hover {
          transform: translateY(-5px);
        }
      }
    }
  }

  .login-box {
    width: 100%;
    max-width: 440px;
    padding: 2rem;
  }
}

@media (max-width: 480px) {
  .login-intro .intro-title {
    font-size: 2rem;
  }

  .login-intro .intro-subtitle {
    font-size: 1.2rem;
  }

  .login-box {
    padding: 1.5rem;
  }
}

// 动画效果
@keyframes shine {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) rotate(45deg);
  }
}
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}

.translation {
  ::v-deep(.el-dropdown-menu__item) {
    padding: 5px 40px;
  }

  .check-zh {
    position: absolute;
    left: 20px;
  }

  .check-en {
    position: absolute;
    left: 20px;
  }
}
</style>
