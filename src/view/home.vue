<template>
  <div class="web-main">
    <el-input type="textarea" class="textarea" placeholder="输入手机号，多个换行输入" v-model="phone" rows="7" />
    <div class="date">
      <button @click="subDay">前一天</button>
      <el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" placeholder="请选择日期" size="large" />
      <button @click="addDay">后一天</button>
    </div>
    <button class="btn" @click="search">搜索 </button>
    <p class="num">搜索结果：共{{ total }}个</p>
    <div class="result">
      <div class="content" v-for="item in formData">
        <p>{{ item.date }} 数量: {{ item.list.length }}</p>
        <ul class="list">
          <li v-for=" item  in  item.list">{{ item }}</li>
        </ul>
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { findWinnerApi } from '../api/home.js'
const now = dayjs()
let dateTemp = now.subtract(1, 'day').format('YYYY-MM-DD')
const date = ref(dateTemp)
const total = ref('***')
const phone = ref('')
const formData = ref([])
function isValidPhoneNumber(phoneNumber) {
  // 正则表达式，用于匹配11位手机号
  const regex = /^\d{11}$/;
  // 使用test方法校验手机号
  return regex.test(phoneNumber);
}

const subDay = () => {
  const d = dayjs(date.value)
  date.value = d.subtract(1, 'day').format('YYYY-MM-DD')
}
const addDay = () => {
  const d = dayjs(date.value)
  date.value = d.add(1, 'day').format('YYYY-MM-DD')
}
const search = () => {
  total.value = "***"
  if (!phone.value) return;
  const phones = phone.value.split('\n')
  const isPhone = phones.every(item => {
    return isValidPhoneNumber(item)
  })
  if (!isPhone) {
    return ElMessage.error('手机号输入有误! ')
  }
  const data = {
    date: date.value,
    phones: phones
  }
  findWinnerApi(data).then((res) => {
    let num = 0
    res.data.forEach(item => {
      num += item.list.length
    })
    total.value = num
    formData.value = res.data
  })
}
</script>

<style scoped lang="less">
.web-main {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f9f9f9;
  padding: 0 8px;

  .textarea {
    width: 100%;
    height: 160px;
  }

  .date {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-around;
    margin: 4px 0;

    >button {
      width: 60px;
      height: 100%;
    }
  }

  .btn {
    width: 100%;
    height: 40px;
    margin: 4px 0;
  }

  .num {
    font-size: 20px;
  }

  .result {
    width: 100%;
    height: 360px;
    border: 1px solid #ccc;
    overflow-y: auto;
    margin-top: 4px;

    .content {
      border-bottom: 2px dashed #ddd;
    }

    .list {
      display: flex;

      >li {
        margin-right: 8px;
      }
    }
  }

}
</style>
