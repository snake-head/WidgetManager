<!--
 * @Description: 
 * @Author: zhuyc9
 * @Date: 2022-11-02 21:00:42
 * @LastEditTime: 2022-11-02 21:31:32
 * @LastEditors: zhuyc9
 * @Reference: 
-->
<template>
  <div id="root">
    <Display/>
  </div>
</template>

<script>
import Display from './components/Display'

export default {
  name: 'App',
  components: {
    Display
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
