import Vue from 'vue'
import { createPinia, PiniaVuePlugin } from 'pinia'

import App from './App.vue'
import router from './router'

import './assets/main.css'
import 'uno.css'

Vue.use(PiniaVuePlugin)

// 引入样式
import "vue-easytable/libs/theme-default/index.css";
// 引入组件库
import VueEasytable from "vue-easytable";
Vue.use(VueEasytable);
// 引入中文文语言包
import { VeLocale } from "vue-easytable";
import zhCN from "vue-easytable/libs/locale/lang/zh-CN.js";
VeLocale.use(zhCN);

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);

new Vue({
  router,
  pinia: createPinia(),
  render: (h) => h(App)
}).$mount('#app')
