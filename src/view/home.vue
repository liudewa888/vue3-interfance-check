<template>
  <div class="web-main">
    <h1>90度幸福定制版</h1>
    <el-input type="textarea" class="textarea" placeholder="输入手机号，多个换行输入" v-model="phone" rows="7" resize="none" />
    <div class="date">
      <button @click="subDay">前一天</button>
      <el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" placeholder="请选择日期" size="large" />
      <button @click="addDay">后一天</button>
    </div>
    <button class="btn" @click="search">搜索 </button>
    <p class="num">搜索结果：共{{ total }}个</p>
    <div class="result">
      <div class="content" v-for="item in formData">
        <div class="title">
          <span>日期: {{ item.date }}</span>
          <span>总: {{ item.total }}</span>
          <span>数量: {{ item.num }}</span>
        </div>
        <ul class="list">
          <li v-for=" item  in  item.list">
            <span>{{ item.phone }} </span>
            <span>{{ item.name }} </span>
            <span>{{ item.idNo }} </span>
            <span :class="item.num > 1 ? 'red' : ''" class="num">{{ item.num }} </span>
          </li>
        </ul>
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref } from 'vue'
import { ElInput, ElMessage, ElDatePicker } from 'element-plus'
import dayjs from 'dayjs'
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
  if (!phone.value) {
    ElMessage.error('手机号不能为空! ')
    return
  };
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
      const tempNum = item.list.reduce((a, b) => {
        return a + b.num
      }, 0)
      item.num = tempNum
      num += tempNum
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

      .title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 10px;
      }

      .list {
        width: 100%;

        li {
          display: flex;
          justify-content: space-around;
          align-items: center;
          font-size: 12px;

          .num {
            font-size: 14px;
          }

          .red {
            color: red;
          }
        }
      }
    }
  }

}
</style>
