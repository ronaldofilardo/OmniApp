const express = require("express");
const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = 3333;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`🚀 Debug Server running on ${HOST}:${PORT}`);
  console.log(`- Local: http://localhost:${PORT}/health`);
  console.log(`- Network: http://192.168.15.3:${PORT}/health`);
});
