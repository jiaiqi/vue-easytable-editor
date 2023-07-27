<template>
  <div class="spreadsheet">
    <ve-table
      ref="tableRef"
      style="word-break: break-word"
      fixed-header
      :scroll-width="0"
      :max-height="800"
      border-y
      :columns="columns"
      :table-data="tableData"
      row-key-field-name="rowKey"
      :virtual-scroll-option="virtualScrollOption"
      :cell-autofill-option="cellAutofillOption"
      :edit-option="editOption"
      :clipboard-option="clipboardOption"
      :contextmenu-body-option="contextmenuBodyOption"
      :contextmenu-header-option="contextmenuHeaderOption"
      :row-style-option="rowStyleOption"
      :column-width-resize-option="columnWidthResizeOption"
    />
    <div class="flex flex-items-center flex-justify-between m-l-a m-r-a p-10">
      <div flex w-80>
        <div m-r-5>插入</div>
        <el-input-number size="mini" v-model="insertRowNumber" />
        <div m-l-5 m-r-5>行</div>
        <el-button
          size="mini"
          type="primary"
          @click="insertRows"
          :disabled="insertRowNumber === 0"
          >确认</el-button
        >
      </div>
      <div>
        <el-button
          size="mini"
          type="primary"
          @click="saveData"
          :disabled="buildReqParams.length === 0"
          >保存</el-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import {
  getServiceV2,
  onSelect,
  onBatchOperate,
  onDelete,
} from "../service/api";
import { buildSrvCols } from "../utils/sheetUtils";
import { COLUMN_KEYS } from "../utils/constant";
import { uniqueId } from "lodash-es";
import { Message } from "element-ui"; // 引入elementUI的Message组件

export default {
  mounted() {
    if (this.serviceName) {
      this.getV2Data().then(() => {
        this.getList();
      });
    }
  },
  data() {
    return {
      insertRowNumber: 0,
      startRowIndex: 0,
      // 是否开启列宽可变
      columnWidthResizeOption: {
        enable: true,
      },
      // 虚拟滚动配置
      virtualScrollOption: {
        enable: false,
        scrolling: this.scrolling,
      },
      // 单元格自动填充配置
      cellAutofillOption: {
        directionX: true,
        directionY: true,
      },
      // 剪贴板配置
      clipboardOption: {
        beforePaste: ({ data, selectionRangeIndexes, selectionRangeKeys }) => {
          console.log({
            data,
            selectionRangeIndexes,
            selectionRangeKeys,
          });
        },
      },
      // 单元格编辑配置
      editOption: {
        afterCellValueChange: ({ row, column, changeValue }) => {
          console.log(row, column, changeValue);
          if (row.__id) {
            row.__flag = "update";
          }
          // console.log(this.tableData);
        },
        beforeStartCellEditing: ({ row, column, cellValue }) => {
          console.log(row, column, cellValue);
          if (column.__field_info.col_type !== "String") {
            return;
          }
        },
      },
      // header 右键菜单配置
      contextmenuHeaderOption: {
        // contextmenus: [
        //     {
        //         type: "CUT",
        //     },
        //     {
        //         type: "COPY",
        //     },
        //     {
        //         type: "EMPTY_COLUMN",
        //     },
        // ],
      },
      // body 右键菜单配置
      contextmenuBodyOption: {
        afterMenuClick: ({
          type,
          selectionRangeKeys,
          selectionRangeIndexes,
        }) => {
          console.log("---contextmenu body afterMenuClick--");
          console.log("type::", type);
          console.log("selectionRangeKeys::", selectionRangeKeys);
          console.log("selectionRangeIndexes::", selectionRangeIndexes);
          if (type === "delete-row-data") {
            if (!this.deleteButton?.service_name) {
              this.$message({
                type: "error",
                message: "没有删除权限",
              });
              return false;
            }
            // 删除选中行数据
            let text = `此操作将永久删除该第${
              selectionRangeIndexes.startRowIndex + 1
            }至第${
              selectionRangeIndexes.endRowIndex + 1
            }行数据，是否继续操作？`;
            if (
              selectionRangeIndexes.endRowIndex -
                selectionRangeIndexes.startRowIndex ==
              0
            ) {
              text = `此操作将永久删除该第${
                selectionRangeIndexes.startRowIndex + 1
              }行数据，是否继续操作？`;
            }
            this.$confirm(text, "提示", {
              distinguishCancelAndClose: true,
              confirmButtonText: "确认",
              cancelButtonText: "点错了",
              type: "error",
              // center: true
            })
              .then(() => {
                // this.$message({
                //     type: 'success',
                //     message: '删除成功'
                // });
                this.deleteRow(selectionRangeIndexes);
              })
              .catch((action) => {
                this.$message({
                  type: "info",
                  message: "用户取消操作",
                });
              });
          }
        },
        contextmenus: [
          {
            type: "CUT",
          },
          {
            type: "COPY",
          },
          {
            type: "SEPARATOR",
          },
          {
            type: "INSERT_ROW_ABOVE",
          },
          {
            type: "INSERT_ROW_BELOW",
          },
          {
            type: "SEPARATOR",
          },
          {
            type: "delete-row-data",
            label: "删除选中行数据",
          },
          // {
          //     type: "REMOVE_ROW",
          // },
          // {
          //     type: "EMPTY_ROW",
          // },
          {
            type: "EMPTY_CELL",
          },
        ],
      },
      // 行样式配置
      rowStyleOption: {
        clickHighlight: false,
        hoverHighlight: true,
      },
      tableData: [],
      oldTableData: [],
      list: {},
      v2data: {},
      allFields: [],
    };
  },
  computed: {
    fkCondition() {
      const fkCol = this.$route?.params?.fkCol || this.$route?.query?.fkCol;
      const fkVal = this.$route?.params?.fkVal || this.$route?.query?.fkVal;
      if (fkCol && fkVal) {
        return {
          colName: fkCol,
          ruleType: "eq",
          value: fkVal,
        };
      }
    },
    addButton() {
      return this.v2data?.gridButton?.find((item) =>
        item.button_type.includes("add")
      );
    },
    deleteButton() {
      return this.v2data?.rowButton?.find((item) =>
        item.button_type.includes("delete")
      );
    },
    updateButton() {
      return this.v2data?.rowButton?.find((item) =>
        item.button_type?.includes("edit")
      );
    },
    buildReqParams() {
      const tableData = JSON.parse(JSON.stringify(this.tableData));
      const reqData = [];
      tableData.forEach((item, index) => {
        if (
          item.__flag === "update" &&
          item.id &&
          this.updateButton?.service_name
        ) {
          const oldItem = this.oldTableData.find((d) => d.__id === item.__id);
          const updateObj = {};
          if (oldItem) {
            Object.keys(oldItem).forEach((key) => {
              if (!["__id", "__flag", "rowKey", "id"].includes(key)) {
                if (oldItem[key] !== item[key]) {
                  updateObj[key] = item[key];
                }
              }
            });
            reqData.push({
              serviceName: this.updateButton.service_name,
              condition: [{ colName: "id", ruleType: "eq", value: item.id }],
              data: [updateObj],
            });
          }
        } else if (item.__flag === "add" && this.addButton?.service_name) {
          const addObj = {
            ...item,
          };
          if (this.fkCondition?.colName) {
            addObj[this.fkCondition.colName] = this.fkCondition.value;
          }
          delete addObj.__id;
          delete addObj.__flag;
          delete addObj.rowKey;
          if (
            Object.keys(addObj).length > 0 &&
            Object.keys(addObj).some(
              (key) =>
                addObj[key] !== undefined &&
                addObj[key] !== null &&
                addObj[key] !== ""
            )
          ) {
            reqData.push({
              serviceName: this.addButton.service_name,
              data: [addObj],
            });
          }
        }
      });
      return reqData;
    },

    tableHeader() {
      return this.v2data?.allFields;
    },
    serviceName() {
      return this.$route.params?.service || this.$route.query?.service;
    },
    srvApp() {
      return (
        this.$route.params?.app ||
        this.$route.query?.app ||
        sessionStorage.getItem("current_app")
      );
    },
    columns() {
      const self = this;
      const startRowIndex = this.startRowIndex;
      let columns = [
        {
          field: "index",
          key: "index",
          operationColumn: true,
          title: "#",
          width: 50,
          fixed: "left",
          renderBodyCell: function ({ rowIndex }) {
            return startRowIndex + rowIndex + 1;
          },
          // renderBodyCell: this.renderRowIndex,
        },
      ];
      if (Array.isArray(this.allFields) && this.allFields.length > 0) {
        columns = columns.concat(
          this.allFields.map((item) => {
            const columnObj = {
              title: item.label,
              field: item.columns,
              key: item.columns,
              width: 100,
              edit:
                ["String"].includes(item.col_type) ||
                item.col_type.includes("decimal"),
              // edit: ['Integer', 'String', 'Float', "Money"].includes(item.col_type) || item.col_type.includes('decimal'),
              __field_info: { ...item },
            };
            if (
              ["Integer", "Float", "Money"].includes(item.col_type) ||
              item.col_type.includes("decimal")
            ) {
              let precision = null;
              let step = 1;
              if (["Float", "Money"].includes(item.col_type)) {
                precision = 2;
                step = 0.01;
              }
              if (item.col_type.includes("decimal")) {
                const str = item.col_type;
                const regex = /decimal\((\d+),(\d+)\)/;
                const match = str.match(regex);
                precision = match[2] * 1;
                step = 1 / 10 ** match[2];
              }
              columnObj.width = 150;
              columnObj.renderBodyCell = ({ row, column, rowIndex }, h) => {
                return h("elInputNumber", {
                  attrs: {
                    value: row[column.field]||undefined,
                    size: "mini",
                    step,
                    precision,
                  },
                  nativeOn: {
                    click: (event) => {
                      event.stopPropagation();
                      event.preventDefault();
                    },
                  },
                  on: {
                    input: (event) => {
                      self.$set(row, column.field, event);
                    },
                  },
                });
              };
            } else if (item.col_type === "Date") {
              columnObj.width = 150;
              columnObj.renderBodyCell = ({ row, column, rowIndex }, h) => {
                return h("el-date-picker", {
                  attrs: {
                    value: row[column.field],
                    size: "mini",
                    type: "date",
                    style: "width:130px;",
                  },
                  nativeOn: {
                    click: (event) => {
                      event.stopPropagation();
                      event.preventDefault();
                    },
                  },
                  on: {
                    input: (event) => {
                      self.$set(row, column.field, event);
                    },
                  },
                });
              };
            } else if (item.col_type === "Enum") {
              columnObj.width = 120;
              columnObj.renderBodyCell = ({ row, column, rowIndex }, h) => {
                return h(
                  "el-select",
                  {
                    attrs: {
                      value: row[column.field],
                      size: "mini",
                    },
                    on: {
                      input: (event) => {
                        self.$set(row, column.field, event);
                      },
                    },
                  },
                  item.option_list_v2.map((op) => {
                    return h("el-option", {
                      attrs: {
                        key: op.value,
                        label: op.label,
                        value: op.value,
                      },
                    });
                  })
                );
              };
            }
            return columnObj;
          })
        );
        return columns;
      }
      columns = columns.concat(
        COLUMN_KEYS.map((keyValue) => {
          return {
            title: keyValue,
            field: keyValue,
            key: keyValue,
            width: 90,
            edit: true,
          };
        })
      );
      return columns;
    },
  },
  methods: {
    deleteRow(rowIndexs = {}) {
      const { startRowIndex, endRowIndex } = rowIndexs;
      const deleIds = [];
      this.tableData.forEach((item, index) => {
        if (item.id && index >= startRowIndex && index <= endRowIndex) {
          deleIds.push(item.id);
        }
      });
      if (deleIds.length > 0) {
        onDelete(
          deleIds.toString(),
          this.deleteButton?.service_name,
          this.srvApp
        ).then((res) => {
          if (res?.state === "SUCCESS") {
            Message({
              showClose: true,
              message: res.resultMessage,
              type: "success",
            });
            this.getList();
          } else if (res?.resultMessage) {
            Message({
              showClose: true,
              message: res.resultMessage,
              type: "error",
            });
          }
        });
      }
    },
    saveData() {
      const reqData = this.buildReqParams;
      if (
        Array.isArray(reqData) &&
        reqData.length > 0 &&
        this.updateButton?.service_name
      ) {
        onBatchOperate(
          reqData,
          this.updateButton.service_name,
          this.srvApp
        ).then((res) => {
          if (res?.state === "SUCCESS") {
            Message({
              showClose: true,
              message: res.resultMessage,
              type: "success",
            });
            this.getList();
          } else if (res?.resultMessage) {
            Message({
              showClose: true,
              message: res.resultMessage,
              type: "error",
            });
          }
        });
      }
    },
    insertRows() {
      if (this.insertRowNumber > 0) {
        for (let index = 0; index < this.insertRowNumber; index++) {
          const __id = uniqueId("table_item_");
          const dataItem = {
            rowKey: __id,
            __id,
            __flag: "add",
          };
          this.allFields.forEach((field) => {
            dataItem[field.columns] = "";
          });
          this.tableData.push(dataItem);
          this.$nextTick(() => {
            this.$refs["tableRef"].scrollToRowKey({
              rowKey: this.tableData[this.tableData.length - 1]["__id"],
            });
            this.insertRowNumber = 0;
          });
        }
      }
    },
    async getList() {
      if (this.serviceName) {
        const res = await onSelect(
          this.serviceName,
          this.srvApp,
          this.fkCondition ? [this.fkCondition] : null
        );
        this.list.data = res.data;
        // this.tableData = res.data
        this.list.page = res.page;

        let tableData = [];
        for (let i = res.data.length - 1; i >= 0; i--) {
          const __id = uniqueId("table_item_");
          let dataItem = {
            rowKey: __id,
            __id,
            __flag: null,
            ...res.data[i],
            // __flag: "update",
          };
          tableData.push(dataItem);
        }
        this.tableData = tableData;
        this.oldTableData = JSON.parse(JSON.stringify(tableData));
        this.$nextTick(() => {
          this.$refs["tableRef"].scrollToRowKey({
            rowKey: this.tableData[this.tableData.length - 1]["__id"],
          });
        });
      }
    },
    async getV2Data() {
      const res = await getServiceV2(this.serviceName, "list", this.srvApp);
      if (res?.state === "SUCCESS") {
        this.v2data = res.data;
        this.v2data.allFields = await buildSrvCols(this.v2data.srv_cols,this.fkCondition);
        this.allFields = this.v2data.allFields;
        // this.initTableData();
        document.title = res.data.service_view_name;
      }
    },
    scrolling({
      startRowIndex,
      visibleStartIndex,
      visibleEndIndex,
      visibleAboveCount,
      visibleBelowCount,
    }) {
      this.startRowIndex = startRowIndex;
    },
    // 初始化表格
    initTableData() {
      let tableData = [];
      for (let i = 0; i < 100; i++) {
        const __id = uniqueId("table_item_");
        let dataItem = {
          rowKey: __id,
          __id,
        };
        this.allFields.forEach((field) => {
          dataItem[field.columns] = "";
        });
        tableData.push(dataItem);
      }
      this.tableData = tableData;
    },
  },
};
</script>
<style lang="scss">
// .spreadsheet {
//     padding: 0 10px;
//     margin: 20px 0;
// }
</style>
