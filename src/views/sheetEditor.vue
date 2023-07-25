<template>
    <div class="spreadsheet">
        <ve-table ref="tableRef" style="word-break: break-word" fixed-header :scroll-width="0" :max-height="800" border-y
            :columns="columns" :table-data="tableData" row-key-field-name="rowKey"
            :virtual-scroll-option="virtualScrollOption" :cell-autofill-option="cellAutofillOption"
            :edit-option="editOption" :contextmenu-body-option="contextmenuBodyOption"
            :contextmenu-header-option="contextmenuHeaderOption" :row-style-option="rowStyleOption"
            :column-width-resize-option="columnWidthResizeOption" />
        <div flex flex-items-center flex-justify-between m-l-a m-r-a p-10>
            <div flex w-80>
                <div m-r-5>插入</div>
                <el-input-number size="mini" v-model="insertRowNumber" />
                <div m-l-5 m-r-5>行</div>
                <el-button size="mini" type="primary" @click="insertRows" :disabled="insertRowNumber === 0">确认</el-button>
            </div>
            <div>
                <el-button size="mini" type="primary">保存</el-button>
            </div>
        </div>
    </div>
</template>

<script>
import { getServiceV2, onSelect, onBatchAdd } from '../service/api'
import { buildSrvCols } from '@/utils/sheetUtils'
import { COLUMN_KEYS } from '../utils/constant'
import { uniqueId } from 'lodash-es'
export default {
    mounted() {
        if (this.serviceName) {
            this.getV2Data().then(() => {
                this.getList()
            })
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
            // 单元格编辑配置
            editOption: {
                afterCellValueChange: ({ row, column, changeValue }) => {
                    console.log(row, column, changeValue);
                    console.log(this.tableData);
                },
                beforeStartCellEditing: ({ row, column, cellValue }) => {
                    console.log(row, column, cellValue);
                    if (column.__field_info.col_type !== 'String') {
                        return
                    }
                }
            },
            // header 右键菜单配置
            contextmenuHeaderOption: {
                contextmenus: [
                    {
                        type: "CUT",
                    },
                    {
                        type: "COPY",
                    },
                    {
                        type: "EMPTY_COLUMN",
                    },
                ],
            },
            // body 右键菜单配置
            contextmenuBodyOption: {
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
                        type: "REMOVE_ROW",
                    },
                    {
                        type: "EMPTY_ROW",
                    },
                    {
                        type: "EMPTY_CELL",
                    },
                ],
            },
            // 行样式配置
            rowStyleOption: {
                clickHighlight: false,
                hoverHighlight: false,
            },
            tableData: [],
            list: {},
            v2data: {},
            allFields: []
        };
    },
    computed: {
        tableHeader() {
            return this.v2data?.allFields
        },
        serviceName() {
            return this.$route.params?.service || this.$route.query?.service
        },
        srvApp() {
            return this.$route.params?.app || this.$route.query?.app
        },
        columns() {
            const startRowIndex = this.startRowIndex;
            let columns = [
                {
                    field: "index",
                    key: "index",
                    operationColumn: true,
                    title: "",
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
                    this.allFields.map(item => {
                        return {
                            title: item.label,
                            field: item.columns,
                            key: item.columns,
                            width: 100,
                            edit: item.col_type === 'String',
                            __field_info: { ...item }
                        };
                    })
                )
                return columns
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
        insertRows() {
            if (this.insertRowNumber > 0) {
                for (let index = 0; index < this.insertRowNumber; index++) {
                    const __id = uniqueId('table_item_')
                    const dataItem = {
                        rowKey: __id,
                        __id,
                        __flag: 'add'
                    }
                    this.allFields.forEach((field) => {
                        dataItem[field.columns] = "";
                    });
                    this.tableData.push(dataItem)
                    this.$nextTick(() => {
                        this.$refs["tableRef"].scrollToRowKey({ rowKey: this.tableData[this.tableData.length - 1]['__id'] });
                        this.this.insertRowNumber = 0
                    })
                    // setTimeout(() => {
                    //     this.$refs["tableRef"].scrollToRowKey({ rowKey: this.tableData[this.tableData.length-1]['__id'] });
                    // }, 2000);
                }
            }

        },
        async getList() {
            if (this.serviceName) {
                const params = {
                    app: this.srvApp || 'daq'
                }
                const res = await onSelect(this.serviceName, params)
                this.list.data = res.data;
                // this.tableData = res.data
                this.list.page = res.page

                let tableData = [];
                for (let i = 0; i < res.data.length; i++) {
                    const __id = uniqueId('table_item_')
                    let dataItem = {
                        rowKey: __id,
                        __id,
                        __flag: 'update'
                    };
                    this.allFields.forEach((field) => {
                        dataItem[field.columns] = res.data[i][field.columns]
                    });
                    tableData.push(dataItem);
                }
                this.tableData = tableData;
                this.$nextTick(() => {
                    this.$refs["tableRef"].scrollToRowKey({ rowKey: this.tableData[this.tableData.length - 1]['__id'] });
                })
            }
        },
        async getV2Data() {
            const res = await getServiceV2(this.serviceName, 'list', this.srvApp)
            if (res?.state === 'SUCCESS') {
                this.v2data = res.data
                this.v2data.allFields = await buildSrvCols(this.v2data.srv_cols)
                this.allFields = this.v2data.allFields
                this.initTableData()
                document.title = res.data.service_view_name
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
                const __id = uniqueId('table_item_')
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
