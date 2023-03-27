<template>
    <div>
        <el-button type="primary" @click="predCentroids">预测质心</el-button>
    </div>
  </template>
  
  <script>
  import { reactive } from 'vue'
  export default {
      name:'Operate',
      setup() {
        
      }
  }
  </script>
  
  <style>
    .el-button{
      margin: 10px;
    }
  </style>