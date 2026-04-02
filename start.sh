#!/bin/bash
# 费曼学习法应用启动脚本

set -e

echo "=== 清理旧进程 ==="
# 杀掉相关进程
pkill -f "tsx watch src/index.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# 等待进程退出
sleep 2

# 确保端口释放
for port in 5173 8081 8082; do
  pid=$(lsof -ti :$port 2>/dev/null) || true
  if [ -n "$pid" ]; then
    echo "  强制杀掉占用端口 $port 的进程: $pid"
    kill -9 $pid 2>/dev/null || true
  fi
done

sleep 1

echo ""
echo "=== 启动后端 (端口 8081/8082) ==="
cd /Users/huangrongsheng/Work/feymman/backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "  后端 PID: $BACKEND_PID"

echo ""
echo "=== 启动前端 (端口 5173) ==="
cd /Users/huangrongsheng/Work/feymman/frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  前端 PID: $FRONTEND_PID"

echo ""
echo "=== 等待服务启动 ==="
sleep 4

echo ""
echo "=== 检查服务状态 ==="
echo -n "  后端 HTTP (8081): "
curl -s http://localhost:8081/health > /dev/null 2>&1 && echo "✅ OK" || echo "❌ 失败"

echo -n "  后端 WebSocket (8082): "
nc -z localhost 8082 > /dev/null 2>&1 && echo "✅ OK" || echo "❌ 失败"

echo -n "  前端 (5173): "
curl -s http://localhost:5173 > /dev/null 2>&1 && echo "✅ OK" || echo "❌ 失败"

echo ""
echo "=== 服务已启动 ==="
echo "  前端: http://localhost:5173"
echo "  后端 HTTP: http://localhost:8081"
echo "  后端 WebSocket: ws://localhost:8082"
echo ""
echo "日志文件:"
echo "  后端: /tmp/backend.log"
echo "  前端: /tmp/frontend.log"
echo ""
echo "停止服务: ./stop.sh"
