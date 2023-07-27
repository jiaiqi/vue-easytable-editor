import { Message } from "element-ui";
import http from "./http";
/**
 * 请求v2数据
 * @param {String} serviceName - 服务名称
 * @param {String} use_type - 方法名称
 * @param {String} operate - 操作类型 select/operate(add、update、delete)
 * @param {*} app - 应用
 */
const getServiceV2 = async (serviceName, use_type = "list", app = "health") => {
  if (serviceName) {
    const req = {
      serviceName: "srvsys_service_columnex_v2_select",
      colNames: ["*"],
      condition: [
        { colName: "service_name", value: serviceName, ruleType: "eq" },
        { colName: "use_type", value: use_type, ruleType: "eq" },
      ],
      order: [{ colName: "seq", orderType: "asc" }],
    };
    let url = `${app}/select/srvsys_service_columnex_v2_select`;
    return await http.post(url, req);
  }
};

const onSelect = async (serviceName, app, condition, page = {}) => {
  if (serviceName) {
    const req = {
      serviceName: serviceName,
      colNames: ["*"],
      condition: condition || [],
      page: {
        rownumber: page?.rownumber || 100,
        pageNo: page?.pageNo || 1,
      },
    };
    const url = `${app}/select/${serviceName}`;
    return await http.post(url, req);
  }
};
export const onDelete = async (datas, service, app) => {
  const req = [
    {
      serviceName: "srvwuliu_waybill_addr_delete",
      condition: [{ colName: "id", ruleType: "in", value: datas }],
    },
  ];
  const url = `/${app}/operate/${service}`;
  if (datas) {
    return await http.post(url, req);
  } else {
    Message({
      showClose: true,
      message: "请选择要删除的数据！",
      type: "error",
    });
  }
};
export const onBatchOperate = async (reqData, service = "", app = "") => {
  // let { add, del, update } = data;
  // let reqData = []
  // if (Array.isArray(add?.data) && add.data.length > 0) {
  //   add.forEach((item) => {
  //     let obj = {
  //       data: [item],
  //       serviceName: serviceName.replace(operate, "add"),
  //     };
  //     reqArr.push(obj);
  //   });
  // }
  if (service && app) {
    if (Array.isArray(reqData) && reqData.length > 0) {
      // const url = `/${app}/operate/${service}`;
      const url = `/${app}/operate/multi`;
      return await http.post(url, reqData);
    }
  }
};

const onBatchAdd = async (data = {}, serviceName = "", app = "daq") => {
  let operate = serviceName.slice(serviceName.lastIndexOf("_") + 1);
  let { add, del, update } = data;
  let reqArr = [];
  if (Array.isArray(add) && add.length > 0) {
    add.forEach((item) => {
      let obj = {
        data: [item],
        serviceName: serviceName.replace(operate, "add"),
      };
      reqArr.push(obj);
    });
  }
  if (Array.isArray(update) && update.length > 0) {
    update.forEach((item) => {
      let obj = {
        data: [item],
        condition: [
          {
            colName: "id",
            ruleType: "eq",
            value: item.id,
          },
        ],
        serviceName: serviceName.replace(operate, "update"),
      };
      reqArr.push(obj);
    });
  }
  if (Array.isArray(del) && del.length > 0) {
    del.forEach((id) => {
      let obj = {
        condition: [
          {
            colName: "id",
            ruleType: "eq",
            value: id,
          },
        ],
        serviceName: serviceName.replace(operate, "delete"),
      };
      reqArr.push(obj);
    });
  }
  if (update.length > 0 && del.length == 0 && add.length === 0) {
    serviceName = serviceName.replace(operate, "update");
  }
  if (add.length > 0 && del.length == 0 && update.length === 0) {
    serviceName = serviceName.replace(operate, "add");
  }
  if (del.length > 0 && add.length == 0 && update.length === 0) {
    serviceName = serviceName.replace(operate, "delete");
  }
  console.log(reqArr);
  if (reqArr.length > 0) {
    let url = `${app}/operate/${serviceName}`;
    return await http.post(url, reqArr);
  } else {
    alert("没有可以提交的数据", "没有可以提交的数据", {
      confirmButtonText: "确定",
      callback: (action) => {
        console.log(action);
      },
    });
  }
};

// 获取fk字段的下拉值
const getFkOptions = async (col) => {
  let { option_list_v2 } = col;
  let app = option_list_v2?.srv_app || sessionStorage.getItem("current_app");
  let req = {
    serviceName: option_list_v2.serviceName,
    colNames: ["*"],
    condition: [],
    page: {
      pageNo: 1,
      rownumber: 20,
    },
  };
  if (option_list_v2.serviceName) {
    let url = `${app}/select/${option_list_v2.serviceName}`;
    let res = await http.post(url, req);
    if (res.state === "SUCCESS") {
      return res.data;
    }
  }
};

export { getServiceV2, onSelect, onBatchAdd, getFkOptions };
