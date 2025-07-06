const Fastify = require("fastify");
const WebSocket = require("ws");
const fastify = Fastify({ logger: true });

const TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbW91bnQiOjB9.p56b5g73I9wyoVu4db679bOvVeFJWVjGDg_ulBXyav8";
const PORT = process.env.PORT || 4000;

// API key check (tùy chọn)
const API_KEY = "tinh592007pq";

// CORS cho trình duyệt
fastify.register(require('@fastify/cors'), { origin: true });

let historyData = []; // Bộ nhớ lưu dữ liệu

// Kết nối WebSocket đến Sunwin
function connectWebSocket() {
  const ws = new WebSocket(`wss://websocket.azhkthg1.net/websocket?token=${TOKEN}`);

  ws.on("open", () => {
    console.log("✅ Đã kết nối tới WebSocket Sunwin");

    // Gửi auth payload
    const authPayload = [
      1,
      "MiniGame",
      "SC_xigtupou",
      "conga999",
      {
        info: JSON.stringify({
          ipAddress: "171.246.10.199",
          userId: "7c54ec3f-ee1a-428c-a56e-1bc14fd27e57",
          username: "SC_xigtupou",
          timestamp: Date.now(),
          refreshToken: "ce8de19af18f4417bb68c3632408d4d7.479079475124482181468c8923b636af"
        }),
        signature: "0EC9E9B2311CD352561D9556F88F6AB4167502EAC5F9767D07D43E521FE1BA056C7C67DF0491D20BCE9877B71373A2115CC61E9ED43B8AF1EF6EAC3757EA5B2A46BCB0C519EDCB46DB0EB9ACA445D7076CC1F3F830745609C02BE9F4D86CF419924E33EE3398F1EE4FE65FD045C1A2EE05C85CDBF2EAE6E4297E000664E4CC21"
      }
    ];

    ws.send(JSON.stringify(authPayload));

    setInterval(() => {
      const cmdPayload = [6, "MiniGame", "taixiuPlugin", { cmd: 1005 }];
      ws.send(JSON.stringify(cmdPayload));
    }, 5000);
  });

  ws.on("message", (data) => {
    try {
      const json = JSON.parse(data);
      if (Array.isArray(json) && json[1]?.htr) {
        const results = json[1].htr;
        results.forEach(item => {
          if (!historyData.find(h => h.sid === item.sid)) {
            const total = item.d1 + item.d2 + item.d3;
            const result = total <= 10 ? "Xỉu" : "Tài";

            const session = {
              sid: item.sid,
              d1: item.d1,
              d2: item.d2,
              d3: item.d3,
              total: total,
              result: result,
              timestamp: Date.now()
            };

            historyData.unshift(session);
            if (historyData.length > 1000) historyData.pop();

            console.log(`📥 Phiên ${item.sid}: ${item.d1}-${item.d2}-${item.d3} = ${total} (${result})`);
          }
        });
      }
    } catch (err) {
      console.error("❌ Lỗi WebSocket:", err.message);
    }
  });

  ws.on("close", () => {
    console.warn("⚠️ WS đóng. Kết nối lại sau 5s...");
    setTimeout(connectWebSocket, 5000);
  });

  ws.on("error", (err) => {
    console.error("❌ Lỗi kết nối:", err.message);
  });
}

// Bắt đầu WebSocket
connectWebSocket();

// Tạo API để lấy dữ liệu history
fastify.get("/api/history", (request, reply) => {
  const key = request.query.key;
  if (key !== API_KEY) {
    return reply.code(403).send({ error: "Sai API key" });
  }

  reply.send({
    status: "OK",
    data: historyData.slice(0, 100) // Gửi 100 dòng gần nhất
  });
});

// Khởi động server
fastify.listen({ port: PORT, host: "0.0.0.0" }, err => {
  if (err) {
    console.error("❌ Server lỗi:", err);
    process.exit(1);
  }
  console.log(`🚀 Server API đang chạy tại http://localhost:${PORT}`);
});