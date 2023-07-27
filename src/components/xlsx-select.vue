<template>
    <el-select v-model="value" :multiple="multiple" placeholder="请选择">
        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
        </el-option>
    </el-select>
</template>

<script>
export default {
    props: {
        multiple: Boolean,
        value: [String],
        options: Array
    },
}
</script>

<style lang="scss" scoped></style>