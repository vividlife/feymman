#!/bin/bash
# 费曼学习法应用停止脚本

echo "=== 停止服务 ==="

# 杀掉相关进程
pkill -f "tsx watch src/index.ts" 2>/dev/null && echo "  ✅ 后端已停止" || echo "  ⚠️ 后端未运行"
pkill -f "vite" 2>/dev/null && echo "  ✅ 前端已停止" || echo "  ⚠️ 前端未运行"

# 清理端口
for port in 5173 8081 8082; do
  pid=$(lsof -ti :$port 2>/dev/null) || true
  if [ -n "$pid" ]; then
    echo "  清理端口 $port (PID: $pid)"
    kill -9 $pid 2>/dev/null || true
  fi
done

echo ""
echo "=== 所有服务已停止 ==="
