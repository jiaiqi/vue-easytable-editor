import { ElMessage } from "element-ui"; // 引入elementUI的Message组件
import axios from "axios";
// import qs from "qs";
// import NProgress from "nprogress";
// import 'nprogress/nprogress.css'
let ticket = "xabxdzkj-f937b9b7-50c3-4251-a690-14436ca3f652";
if (sessionStorage.getItem("bx_auth_ticket")) {
  ticket = sessionStorage.getItem("bx_auth_ticket");
}

axios.defaults.baseURL = "https://wx.100xsys.cn/";
if (top?.pathConfig?.gateway) {
  axios.defaults.baseURL = top?.pathConfig?.gateway;
}

//post请求头
axios.defaults.headers.post["Content-Type"] = "application/json;charset=UTF-8";
//允许跨域携带cookie信息
axios.defaults.withCredentials = true;
//设置超时
axios.defaults.timeout = 15000;

axios.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    config.headers.bx_auth_ticket = ticket;
    // NProgress.inc();
    return config;
  },
  (error) => {
    // NProgress.done();
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    // NProgress.done();
    if (response.status == 200) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(response);
    }
  },
  (error) => {
    // NProgress.done();
    ElMessage({
      showClose: true,
      message: JSON.stringify(error),
      type: "error",
    });
  }
);

export default {
  /**
   * @param {String} url
   * @param {Object} data
   * @returns Promise
   */
  post(url, data) {
    return new Promise((resolve, reject) => {
      axios({
        method: "post",
        url,
        data: data,
      })
        .then((res) => {
          resolve(res.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  get(url, data) {
    return new Promise((resolve, reject) => {
      axios({
        method: "get",
        url,
        params: data,
      })
        .then((res) => {
          resolve(res.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};
