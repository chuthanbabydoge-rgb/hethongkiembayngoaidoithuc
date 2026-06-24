import { Router, type IRouter } from "express";
import os from "os";

const router: IRouter = Router();

const startTime = Date.now();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: "1.0.0",
    agents: 5,
    memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    systemHealth: "nominal",
  });
});

router.get("/agents", (_req, res) => {
  res.json([
    {
      id: "planner",
      name: "Planner Agent",
      status: "active",
      result: "Tối ưu hóa tuyến đường bay — ETA 14 phút",
      lastUpdate: new Date().toISOString(),
      cpu: Math.round(30 + Math.random() * 30),
      health: Math.round(90 + Math.random() * 10),
    },
    {
      id: "navigation",
      name: "Navigation Agent",
      status: "active",
      result: `Hướng 045° — GPS đã khóa (${Math.round(6 + Math.random() * 3)} vệ tinh)`,
      lastUpdate: new Date().toISOString(),
      cpu: Math.round(50 + Math.random() * 20),
      health: Math.round(88 + Math.random() * 12),
    },
    {
      id: "memory",
      name: "Memory Agent",
      status: "idle",
      result: `Đã lưu ${Math.round(1200 + Math.random() * 100)} điểm telemetry`,
      lastUpdate: new Date().toISOString(),
      cpu: Math.round(5 + Math.random() * 15),
      health: 100,
    },
    {
      id: "fix",
      name: "Fix Agent",
      status: "warning",
      result: "Rung động cánh quạt #3 hơi cao — đang theo dõi",
      lastUpdate: new Date().toISOString(),
      cpu: Math.round(20 + Math.random() * 20),
      health: Math.round(65 + Math.random() * 15),
    },
    {
      id: "scanner",
      name: "Scanner Agent",
      status: "idle",
      result: "Khu vực thông thoáng — không phát hiện chướng ngại",
      lastUpdate: new Date().toISOString(),
      cpu: Math.round(15 + Math.random() * 20),
      health: Math.round(82 + Math.random() * 18),
    },
  ]);
});

router.get("/memory", (_req, res) => {
  res.json({
    savedTasks: [
      { id: "T001", title: "Quét địa hình khu A", createdAt: "2025-01-21T10:00:00Z", status: "completed" },
      { id: "T002", title: "Triển khai mô đun cảm biến nhiệt", createdAt: "2025-01-20T14:30:00Z", status: "completed" },
      { id: "T003", title: "Hiệu chỉnh GPS sau cập nhật firmware", createdAt: "2025-01-19T09:15:00Z", status: "pending" },
    ],
    missionHistory: [
      { id: "M001", name: "Trinh Sát Vùng A", date: "2025-01-15", outcome: "Thành công", dataCollected: "2.4GB" },
      { id: "M002", name: "Tuần Tra Biên Giới B", date: "2025-01-21", outcome: "Đang thực hiện", dataCollected: "0.8GB" },
      { id: "M003", name: "Cứu Hộ Khu C", date: "2025-01-10", outcome: "Thất bại — mất GPS", dataCollected: "0.1GB" },
    ],
    aiDecisions: [
      { id: "D001", time: "17:24:02", agent: "PlannerAgent", decision: "Điều chỉnh cao độ lên 1.400m để tránh gió đầu" },
      { id: "D002", time: "17:22:15", agent: "FixAgent", decision: "Giảm công suất động cơ #3 xuống 85% do rung động cao" },
      { id: "D003", time: "17:20:00", agent: "NavigationAgent", decision: "Rẽ phải 12° để tránh khu vực hạn chế bay" },
      { id: "D004", time: "17:18:40", agent: "ScannerAgent", decision: "Phát hiện đàn chim — né tránh thành công +45m bên phải" },
    ],
  });
});

router.post("/run-terminal", (req, res) => {
  const { command } = req.body as { command?: string };
  if (!command) {
    return res.status(400).json({ error: "Thiếu tham số command" });
  }

  const cmd = command.trim().toLowerCase();
  const responses: Record<string, { output: string; exitCode: number }> = {
    ls: { output: "agents/  config/  data/  logs/  models/  src/  package.json  README.md", exitCode: 0 },
    pwd: { output: "/home/flying-sword/workspace", exitCode: 0 },
    whoami: { output: "ai-dev-os", exitCode: 0 },
    "ps aux": { output: "USER  PID  CPU  MEM  COMMAND\nai  1  0.0  0.1  /usr/bin/node server.js\nai  42  12.3  2.1  planner-agent\nai  43  8.7  1.5  nav-agent\nai  44  1.2  0.8  memory-agent", exitCode: 0 },
    "df -h": { output: "Filesystem  Size  Used  Avail  Use%  Mounted\n/dev/sda1  50G  12G  36G  25%  /\ntmpfs  2G  128M  1.9G  7%  /tmp", exitCode: 0 },
    "date": { output: new Date().toString(), exitCode: 0 },
    "uptime": { output: `up ${Math.floor((Date.now() - startTime) / 60000)} minutes, load average: 0.42, 0.38, 0.31`, exitCode: 0 },
    help: { output: "Lệnh có sẵn: ls, pwd, whoami, ps aux, df -h, date, uptime, agents, scan\nGõ bất kỳ lệnh nào — AI Terminal sẽ xử lý qua engine mô phỏng.", exitCode: 0 },
    agents: { output: "● planner   [ACTIVE]  CPU: 42%  Health: 98%\n● navigation [ACTIVE]  CPU: 61%  Health: 94%\n● memory    [IDLE]    CPU: 14%  Health: 100%\n● fix       [WARNING] CPU: 33%  Health: 72%\n● scanner   [IDLE]    CPU: 29%  Health: 88%", exitCode: 0 },
    scan: { output: "Đang quét dự án...\n✓ 47 tệp tìm thấy\n✓ 8 thư mục\n✓ 0 lỗi nghiêm trọng\n✓ 2 cảnh báo nhỏ\nKết quả: Dự án ổn định", exitCode: 0 },
  };

  const matched = Object.entries(responses).find(([k]) => cmd === k || cmd.startsWith(k));
  if (matched) {
    return res.json({ output: matched[1].output, exitCode: matched[1].exitCode });
  }

  return res.json({
    output: `[飛劍 AI Terminal] Đã thực thi: ${command}`,
    error: `Lệnh '${command}' không được nhận ra. Gõ 'help' để xem danh sách lệnh.`,
    exitCode: 1,
  });
});

router.post("/auto-fix", (_req, res) => {
  const fixes = [
    "Tối ưu hóa vòng lặp điều khiển PID — giảm độ trễ 12ms",
    "Vá lỗi tràn bộ đệm trong mô đun telemetry",
    "Cập nhật bản đồ nhiễu từ tính cho vùng hoạt động",
  ];
  const numFixed = Math.floor(Math.random() * 3) + 1;
  const selected = fixes.slice(0, numFixed);
  res.json({
    fixed: selected,
    summary: `Đã phát hiện và sửa ${selected.length} vấn đề tự động`,
    errorsFound: Math.round(Math.random() * 5 + numFixed),
    status: "completed",
  });
});

router.post("/analyze-error", (req, res) => {
  const { error } = req.body as { error?: string };
  if (!error) return res.status(400).json({ error: "Thiếu nội dung lỗi" });

  res.json({
    analysis: `FixAgent đã phân tích lỗi:\n"${error.slice(0, 60)}..."\n\nNguyên nhân: Truy cập thuộc tính của đối tượng null hoặc undefined.\nVùng ảnh hưởng: Mô đun điều khiển bay, bộ xử lý telemetry.`,
    suggestions: [
      "Kiểm tra giá trị null/undefined trước khi truy cập thuộc tính",
      "Thêm try/catch xung quanh các lời gọi API quan trọng",
      "Triển khai Optional Chaining (?.) và Nullish Coalescing (??)",
    ],
    severity: "medium",
    confidence: Math.round(75 + Math.random() * 20),
  });
});

router.get("/scan-project", (_req, res) => {
  res.json({
    totalFiles: 47,
    directories: 8,
    projectContext: "飛劍 AI DEV OS — Hệ điều hành bay thông minh",
    files: [
      { path: "src/", type: "directory", children: [
        { path: "src/pages/", type: "directory", children: [
          { path: "src/pages/agents.tsx", type: "file", size: "4.2KB", status: "ok" },
          { path: "src/pages/os-terminal.tsx", type: "file", size: "5.1KB", status: "ok" },
          { path: "src/pages/os-memory.tsx", type: "file", size: "6.3KB", status: "ok" },
          { path: "src/pages/os-scanner.tsx", type: "file", size: "7.8KB", status: "ok" },
          { path: "src/pages/simulation.tsx", type: "file", size: "8.5KB", status: "ok" },
        ]},
        { path: "src/services/", type: "directory", children: [
          { path: "src/services/api.ts", type: "file", size: "1.2KB", status: "ok" },
        ]},
        { path: "src/hooks/", type: "directory", children: [
          { path: "src/hooks/use-flight-simulation.ts", type: "file", size: "3.1KB", status: "ok" },
          { path: "src/hooks/use-activity-log.ts", type: "file", size: "1.8KB", status: "warning" },
        ]},
        { path: "src/App.tsx", type: "file", size: "9.7KB", status: "ok" },
      ]},
      { path: "artifacts/api-server/", type: "directory", children: [
        { path: "artifacts/api-server/src/routes/", type: "directory", children: [
          { path: "artifacts/api-server/src/routes/ai.ts", type: "file", size: "5.6KB", status: "ok" },
          { path: "artifacts/api-server/src/routes/health.ts", type: "file", size: "0.5KB", status: "ok" },
        ]},
      ]},
    ],
    issues: [
      { file: "src/hooks/use-activity-log.ts", type: "warning", message: "Biến chưa sử dụng: 'globalLog'" },
    ],
    summary: "Dự án ổn định — 0 lỗi nghiêm trọng, 1 cảnh báo nhỏ",
  });
});

router.post("/plan-task", (req, res) => {
  const { task } = req.body as { task?: string };
  if (!task) return res.status(400).json({ error: "Thiếu tham số task" });

  res.json({
    goal: task,
    estimatedTime: `${Math.round(10 + Math.random() * 50)} phút`,
    steps: [
      { id: 1, title: "Phân tích mục tiêu", description: `PlannerAgent hiểu rõ yêu cầu: "${task}"`, status: "completed", agent: "PlannerAgent" },
      { id: 2, title: "Lập kế hoạch tuyến đường", description: "NavigationAgent tính toán đường bay tối ưu", status: "completed", agent: "NavigationAgent" },
      { id: 3, title: "Kiểm tra an toàn", description: "ScannerAgent xác nhận khu vực thông thoáng", status: "active", agent: "ScannerAgent" },
      { id: 4, title: "Chuẩn bị hệ thống", description: "FixAgent kiểm tra toàn bộ thiết bị", status: "pending", agent: "FixAgent" },
      { id: 5, title: "Thực thi nhiệm vụ", description: "Tất cả agents phối hợp thực hiện nhiệm vụ", status: "pending", agent: "All Agents" },
    ],
    progress: 40,
  });
});

export default router;
