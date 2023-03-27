/*
 * @Description: 
 * @Author: zhuyc9
 * @Date: 2022-11-02 21:00:42
 * @LastEditTime: 2022-11-02 21:02:50
 * @LastEditors: zhuyc9
 * @Reference: 
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus)
app.mount('#app')
