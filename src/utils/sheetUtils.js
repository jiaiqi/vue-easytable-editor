import { getFkOptions } from "@/service/api";

// 组装srvCols数据
const buildSrvCols = async (cols, fkCond) => {
  if (Array.isArray(cols) && cols.length > 0) {
    // cols = cols.filter(item => item.in_add == 1 || item.in_update == 1)
    // cols = cols.filter((item) => item.in_list === 1);
    cols = cols.filter((item) =>
      fkCond?.colName
        ? item.in_list === 1 && item.columns !== fkCond?.colName
        : item.in_add === 1
    );
    for (let index = 0; index < cols.length; index++) {
      const col = cols[index];
      switch (col.bx_col_type) {
        case "fk":
          col.editType = "dropdownFk";
          // col.optionsList = await getFkOptions(col);
          break;
        case "enum":
          col.editType = "dropdownEnum";
          col.optionsList = col.option_list_v2;
          break;
        default:
          break;
      }
    }
  }
  return cols;
};
// 构建luckysheet的dataVerification
const buildDataVerification = (data, cols) => {
  let datas = data.filter((item) => item?.v?.isTitle !== true);
  let res = {};
  if (Array.isArray(datas) && datas.length > 0) {
    datas.forEach((item) => {
      let key = `${item.r}_${item.c}`;
      let obj = {
        // "type": "dropdown",
        type2: null,
        // "value1": "Develop,Fix,Done",
        value2: "",
        checked: false,
        remote: false,
        prohibitInput: false,
        hintShow: false,
        hintText: "",
      };
      if (item.v.editType === "dropdownFk") {
        obj.type = "dropdown";
        if (Array.isArray(item.v.optionsList) && item.v.optionListV2) {
          let { refed_col, key_disp_col } = item.v.optionListV2;
          let options = item.v.optionsList.map((item) => {
            return {
              value: item[refed_col],
              text: item[key_disp_col],
            };
          });
          obj.prohibitInput = true;
          obj.value1 = options.map((item) => item.text).toString();
          obj.valueMap = options.map((item) => item.value).toString();
        }
      } else if (item.v.editType === "dropdownEnum") {
        obj.prohibitInput = true;
        obj.type = "dropdown";
        obj.value1 = item.v.optionsList.map((item) => item.value).toString();
      }
      res[key] = obj;
    });
  }
  return res;
};
// json格式的列表数据转换为luckysheet的数据格式
const json2sheet = async (data, cols) => {
  let showCols = cols.map((item) => item.columns);
  const defaultData = {
    name: "Cell", //工作表名称
    color: "", //工作表颜色
    index: 0, //工作表索引
    status: 1, //激活状态
    order: 0, //工作表的下标
    hide: 0, //是否隐藏
    row: 10, //行数
    column: 10, //列数
    defaultRowHeight: 19, //自定义行高
    defaultColWidth: 73, //自定义列宽
    pager: {
      pageIndex: 1, //当前的页码
      pageSize: 10, //每页显示多少行数据
      total: data.length, //数据总行数
    },
    celldata: [], //初始化使用的单元格数据
    config: {
      merge: {}, //合并单元格
      rowlen: {}, //表格行高
      columnlen: {}, //表格列宽
      rowhidden: {}, //隐藏行
      colhidden: {}, //隐藏列
      borderInfo: {}, //边框
      authority: {}, //工作表保护
    },
    scrollLeft: 0, //左右滚动条位置
    // "scrollTop": 315, //上下滚动条位置
    luckysheet_select_save: [], //选中的区域
    calcChain: [], //公式链
    isPivotTable: false, //是否数据透视表
    pivotTable: {}, //数据透视表设置
    filter_select: {}, //筛选范围
    filter: null, //筛选配置
    luckysheet_alternateformat_save: [], //交替颜色
    luckysheet_alternateformat_save_modelCustom: [], //自定义交替颜色
    luckysheet_conditionformat_save: {}, //条件格式
    frozen: {}, //冻结行列配置
    chart: [], //图表配置
    zoomRatio: 1, // 缩放比例
    image: [], //图片
    showGridLines: 1, //是否显示网格线
    dataVerification: {}, //数据验证配置
  };

  if (Array.isArray(cols) && cols.length > 0) {
    let arr = [];
    defaultData.row = data.length || 2;
    defaultData.column = 0;
    for (let index = 0; index < cols.length; index++) {
      const col = cols[index];
      let obj = {
        r: 0,
        c: index,
        v: {
          ct: { fa: "@", t: "s" },
          m: col["label"],
          v: col["label"],
          label: col.label,
          columns: col.columns,
          bg: "#999",
          fc: "#fff",
          isTitle: true, //是否是标题
          // fs:12
        },
      };
      arr.push(obj);
    }
    // cols.forEach(async (col, index) => {
    //   debugger

    // })
    if (Array.isArray(data) && data.length > 0) {
      data.forEach((item, rIndex) => {
        let keys = showCols;
        // let keys = Object.keys(item).filter(key => showCols.includes(key))
        // let keys = Object.keys(item).filter(key => cols.includes(item => item.columns === key))
        keys.forEach((key, cIndex) => {
          let colItem = cols.find((col) => col.columns === key);
          if (colItem) {
            let obj = {
              r: rIndex + 1,
              c: cIndex,
              v: {
                ct: { fa: "@", t: "s" },
                label: colItem.label,
                columns: colItem.columns,
                old_val: item[key],
                m: item[key],
                v: item[key],
                id: item.id,
                editType: colItem.editType,
                optionsList: colItem.optionsList,
                optionListV2: colItem.option_list_v2,
              },
            };
            if (colItem.editType === "dropdownFk") {
              if (
                obj.value &&
                Array.isArray(obj.optionsList) &&
                obj.optionsList.length > 0
              ) {
                let val = obj.optionsList.find(
                  (item) => item.value === obj.value
                );
                if (val.value) {
                  obj.v = val.value;
                }
              }
            }
            if (colItem.col_type === "Date") {
              obj.v.ct.fa = "yyyy-MM-dd";
              obj.v.ct.t = "d";
            }
            if (colItem.col_type === "DateTime") {
              obj.v.ct.fa = "yyyy-MM-dd hh:mm";
              obj.v.ct.t = "d";
            }
            if (colItem.col_type === "Time") {
              obj.v.ct.fa = "hh:mm:ss";
              obj.v.ct.t = "d";
            }

            arr.push(obj);
            if (rIndex === 0) {
              defaultData.column = cIndex;
            }
          }
        });
      });
    }
    defaultData.celldata = arr;
  }

  defaultData.dataVerification = buildDataVerification(
    defaultData.celldata,
    cols
  );
  return defaultData;
};

// lucksheet的数据格式转换为json格式的列表数据
const sheet2json = (data, oldData) => {
  if (Array.isArray(data) && data.length > 0) {
    let titleRow = data[0];
    let cols = titleRow.map((item) => {
      let obj = {
        columns: item.columns,
        label: item.label,
      };
      return obj;
    });
    data = data.slice(1);
    data.forEach((row, index) => {
      if (oldData && oldData.length > 0 && oldData[index]) {
        row.id = oldData[index].id;
        row.isNew = false;
      } else {
        row.isNew = true;
      }
    });
    let arr = [];
    let res = {
      update: [],
      add: [],
      del: [],
    };

    // let cols = data.find(row => {
    //   if (Array.isArray(row) && row.length > 0) {
    //     return true
    //   }
    // }).map(item => {
    //   let obj = {
    //     columns: item.columns,
    //     label: item.label,
    //   }
    //   return obj
    // })

    data.forEach((rowData) => {
      let obj = {};

      if (rowData.id) {
        obj.id = rowData.id;
      }

      if (Array.isArray(rowData) && rowData.length > 0) {
        rowData.forEach((row, rIndex) => {
          let col = cols[rIndex];
          if (!obj.id && col?.columns && row?.m) {
            // 新增的行数据中的单元格
            obj[col.columns] = row.m;
          } else if (row?.old_val !== row?.m && col?.columns) {
            // 修改的单元格
            obj[col.columns] = row.m || null;
          } else if (col && col.columns && row && row.m) {
            // 没有改动的单元格
            // obj[ col.columns ] = row.m
          }
        });
      }
      if (obj && typeof obj === "object") {
        // let isDel = Object.keys(obj).filter(key => key!=='id').every(key => obj[ key ] === null)
        // let isDel = obj.isDel
        if (!obj?.id && Object.keys(obj).length > 0) {
          // 新增的行数据
          res.add.push(obj);
        } else if (obj.id && Object.keys(obj).length > 1) {
          // 修改的行数据
          if (
            Object.keys(obj)
              .filter((key) => key !== "id")
              .every((key) => obj[key] === null)
          ) {
            // 删除整行
            res.del.push(obj.id);
          } else {
            res.update.push(obj);
          }
        }
        arr.push(obj);
      }
    });
    return res;
  }
};

export { json2sheet, sheet2json, buildSrvCols, buildDataVerification };
