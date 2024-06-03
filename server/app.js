const express = require("express");
const jwt = require("jsonwebtoken");
const compression = require("compression");
const axios = require("axios");
const { writeFile, readdir, readFile } = require("fs/promises");

const BASE_URL = "https://winners.gzhotelgroup.com/api/Winner";

const app = express();
// app.use((req, res, next) => {
//   if (req.url.includes("/find")) {
//     req.url = req.url.replace("/find", "");
//   }
//   if (req.url.includes("/api")) {
//     req.url = req.url.replace("/api", "");
//   }
//   next();
// });
app.use(express.static("./dist"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// 响应统一格式化
function responseFormat(code = 200, data = [], msg = "ok") {
  const response = {
    code,
    data,
    msg,
  };
  return response;
}

const request = axios.create({
  timeout: 1000 * 10 * 3,
  baseURL: "",
  withCredentials: true,
});
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function getRemoteDate(date, Start = 0) {
  const data = {
    joinDate: date,
    Start,
    Length: 20000,
  };
  return request.post(BASE_URL, data);
}

function writeDataByDate(date, data) {
  if (!data.length) return;
  const path = `./data/${date}.json`;
  const res = JSON.stringify(data);
  writeFile(path, res).then(() => {
    console.log(date + ".json 写入完成");
  });
}

async function hasFile(date) {
  const dir = await readdir("./data");
  return dir.includes(date + ".json");
}

async function WFile(date) {
  const hasJson = await hasFile(date);
  let data = [];
  if (hasJson) return;
  const { data: data1 } = await getRemoteDate(date);
  const winners1 = data1.winners;
  const len = winners1.length;
  console.log("data1", len);
  const total = data1.totalCount;
  data = data.concat(winners1);
  if (len < total) {
    const { data: data2 } = await getRemoteDate(date, len - 1);
    const winners2 = data2.winners;
    data = data.concat(winners2);
  }
  if (data.length !== total) {
    console.log("采集数据源数量有误", data.length);
    return;
  }

  const result = data.map((item) => {
    return {
      name: item.name,
      mobile: item.mobile,
      idNo: item.idNo,
    };
  });
  writeDataByDate(date, result);
  return true;
}

function maskPhoneNumber(phoneNumber) {
  // 使用正则表达式匹配手机号的中间四位数字
  return phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}
async function RFile(date) {
  const text = await readFile(`./data/${date}.json`);
  const data = JSON.parse(text);
  const total = data.length;
  const map = new Map();
  data.forEach((item) => {
    if (map.has(item.mobile)) {
      const obj = map.get(item.mobile);
      const num = obj.num;
      map.set(item.mobile, { ...obj, num: num + 1 });
    } else {
      map.set(item.mobile, { name: item.name, num: 1, idNo: item.idNo });
    }
  });
  return { map, total };
}

async function findWinner(date, phones) {
  const result = { date, list: [], total: 0, code: 0 };
  const hasF = await hasFile(date);
  if (!hasF) {
    const res = await WFile(date);
    if (!res) return;
  }
  if (hasF) {
    const { map, total } = await RFile(date);
    result.total = total;
    phones.forEach((item) => {
      const phone = maskPhoneNumber(item);
      if (map.has(phone)) {
        const user = map.get(phone);
        result.list.push({ ...user, phone });
      }
    });
    result.code = 1;
  }
  return result;
}
// token生成
function generateAccessToken(user, key) {
  return jwt.sign(user, key, {
    expiresIn: "8h",
  });
}

// 返回10位格式时间戳
function getTimeSpan() {
  return String(parseInt(new Date().getTime() / 1000));
}

//
async function readUser() {
  const data = await readFile("./user.json");
  const res = JSON.parse(data);
  return res;
}

async function writeUser(user) {
  const users = await readUser();
  const index = users.findIndex((item) => {
    return user.uname === item.uname && user.password === item.password;
  });
  if (index < 0) return;
  users.forEach((item) => {
    if (item.uname === user.uname) {
      item.token_key = user.token_key;
      item.token = user.token;
    }
  });
  return writeFile("./user.json", JSON.stringify(users));
}

// 登录
app.post("/admin/login", async (req, res) => {
  const data = req.body;
  const users = await readUser();
  const user1 = users.find((item) => {
    return data.uname === item.uname && data.password === item.password;
  });
  if (!user1) {
    return res.send(responseFormat(409, [], "用户名或密码错误"));
  }
  const user = { uname: data.uname };
  const token_key = data.uname + getTimeSpan();
  const token = generateAccessToken(user, token_key);
  user1.token_key = token_key;
  user1.token = token;
  writeUser(user1)
    .then(() => {
      res.send(responseFormat(200, { token }));
    })
    .catch(() => {
      res.send(responseFormat(409, [], "更新用户出错"));
    });
});
// token验证
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader;
  if (!token) {
    return res.send(responseFormat(409, null, "需要登录,才能操作"));
  }

  const users = await readUser();
  const user1 = users.find((item) => {
    return token === item.token;
  });
  if (!user1) {
    return res.send(responseFormat(401, null, "token无效"));
  }
  const token_key = user1.token_key;
  jwt.verify(token, token_key, (err, decoded) => {
    if (!err) {
      const time = getTimeSpan();
      if (time < decoded.exp) {
        next();
      } else {
        return res.send(responseFormat(401, null, "token过期"));
      }
    } else {
      return res.send(responseFormat(401, null, "token过期"));
    }
  });
}
app.post("/findWinner", authenticateToken, async (req, res) => {
  const data = req.body;
  const result = [];
  const res1 = await findWinner(data.date, data.phones);
  if (!res1) {
    return res.send(responseFormat(500, null, "采集数据源数量有误"));
  }
  if (res1.code) {
    result.push(res1);
  }
  res.send(responseFormat(200, result));
});

app.listen(9080, () => {
  console.log("9080 is running");
});

// 服务器写法
// app.listen(process.env.PORT,function() {
//   console.log(process.env.PORT ,"is running");
// })
