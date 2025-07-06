const Fastify = require("fastify");
const WebSocket = require("ws");
const fastify = Fastify({ logger: true });

const TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbW91bnQiOjB9.p56b5g73I9wyoVu4db679bOvVeFJWVjGDg_ulBXyav8";
const PORT = process.env.PORT || 4000;

const API_KEY = "tinh592007pq";
fastify.register(require('@fastify/cors'), { origin: true });

let historyData = [];

function connectWebSocket() {
  const ws = new WebSocket(`wss://websocket.azhkthg1.net/websocket?token=${TOKEN}`);

  ws.on("open", () => {
    console.log("✅ Đã kết nối WebSocket Sunwin");

    const authPayload = [
      1,
      "MiniGame",
      "SC_tool1m",
      "any-password",
      {
        info: JSON.stringify({
          ipAddress: "2405:4802:1d04:cef0:27a0:a772:6d69:8d8f",
          userId: "fd9d6b4b-ac56-4aca-87b6-50ab3376a161",
          username: "SC_tool1m",
          timestamp: Date.now(),
          refreshToken: "29be769189794e39b1a88618ca5d2983.e9404bac15d9457f86226a841685b355"
        }),
        signature: "0CAA038570A04E97020E166AE52B11CE2DBE2A87C260104DBC9DD4D93A92FA4CAAF00BFF1377D3317902E55F4DAD707E7BDCF46043EB098B33CF25C3AE64DDE128D31172DCCB852AB66F2D47FE766801F04DBB95ADD95C644FDC3CD7FE87FE20108FC6F1B7270A594FD056A4BB9CE3C86734087E63F48CD542003C929C062A26"
      }
    ];

    ws.send(JSON.stringify(authPayload));

    setInterval(() => {
      const cmdPayload = [6, "MiniGame", "taixiuPlugin", { cmd: 1005 }];
      ws.send(JSON.stringify(cmdPayload));
    }, 5000);
  });

  ws.on("message", (data) => {
    console.log("📦 WS RAW:", data.toString()); // 👈 Thêm dòng này để in tất cả dữ liệu nhận được

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
              total,
              result,
              timestamp: Date.now()
            };

            historyData.unshift(session);
            if (historyData.length > 1000) historyData.pop();

            console.log(`📥 Phiên ${item.sid}: ${item.d1}-${item.d2}-${item.d3} = ${total} (${result})`);
          }
        });
      }
    } catch (err) {
      console.error("❌ Lỗi parse dữ liệu:", err.message);
    }
  });

  ws.on("close", () => {
    console.warn("⚠️ WebSocket đóng. Tự động kết nối lại sau 5s...");
    setTimeout(connectWebSocket, 5000);
  });

  ws.on("error", (err) => {
    console.error("❌ WebSocket lỗi:", err.message);
  });
}

connectWebSocket();

fastify.get("/", (req, reply) => {
  reply.send({
    message: "✅ Sunwin WS API đang hoạt động!",
    route: "/api/history?key=tinh592007pq"
  });
});

fastify.get("/api/history", (req, reply) => {
  const key = req.query.key;
  if (key !== API_KEY) {
    return reply.code(403).send({ error: "Sai API key" });
  }

  reply.send({
    status: "OK",
    data: historyData.slice(0, 100)
  });
});

fastify.listen({ port: PORT, host: "0.0.0.0" }, err => {
  if (err) {
    console.error("❌ Server lỗi:", err);
    process.exit(1);
  }
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});