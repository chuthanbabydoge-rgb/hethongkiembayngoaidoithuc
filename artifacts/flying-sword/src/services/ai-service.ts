export interface TelemetryState {
  battery: number;
  speed: number;
  motorTemp: number;
  altitude: number;
  gpsSignal: number;
  isFlying: boolean;
}

export interface AIDecision {
  id: string;
  time: string;
  trigger: string;
  suggestion: string;
  severity: "info" | "warning" | "critical";
  action?: string;
}

export interface MissionAnalysis {
  mission: string;
  distance: string;
  batteryRequired: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedTime: string;
  aiResponse: string;
  steps: string[];
}

const MISSION_DB: Record<string, MissionAnalysis> = {
  default: {
    mission: "Custom Mission",
    distance: "~15.0 km",
    batteryRequired: "45%",
    riskLevel: "LOW",
    estimatedTime: "18 phút",
    aiResponse: "Nhiệm vụ khả thi. Đang phân tích điều kiện môi trường...",
    steps: ["Khởi động hệ thống định vị", "Tính toán đường bay tối ưu", "Xác nhận điều kiện thời tiết", "Thực thi nhiệm vụ"],
  },
};

const MISSIONS: Record<string, MissionAnalysis> = {
  "fly to mountain": {
    mission: "Fly to Mountain",
    distance: "42.5 km",
    batteryRequired: "78%",
    riskLevel: "MEDIUM",
    estimatedTime: "34 phút",
    aiResponse: "⟁ PHÂN TÍCH NHIỆM VỤ HOÀN TẤT\n\nDự tính đường bay tối ưu qua vùng núi. Gió đầu nhẹ ở 1.800m. Khuyến nghị bay ở độ cao 2.200m để tối ưu hiệu suất.",
    steps: ["Đạt độ cao hành trình 2.200m", "Bay theo hướng NNE 042°", "Vượt đèo núi ở km 28.5", "Hạ độ cao về 800m khi đến đích"],
  },
  "return home": {
    mission: "Return Home",
    distance: "8.2 km",
    batteryRequired: "22%",
    riskLevel: "LOW",
    estimatedTime: "8 phút",
    aiResponse: "⟁ LỆNH TRỞ VỀ NHẬN ĐƯỢC\n\nĐường về đã được tính toán. Mức pin hiện tại đủ để về an toàn với biên độ 12%. Kích hoạt chế độ RETURN TO HOME.",
    steps: ["Xoay hướng về điểm xuất phát", "Bay thẳng theo đường ngắn nhất", "Giảm tốc độ khi còn 500m", "Hạ cánh tự động tại điểm xuất phát"],
  },
  "scan area": {
    mission: "Scan Area",
    distance: "Phủ sóng 360°",
    batteryRequired: "35%",
    riskLevel: "LOW",
    estimatedTime: "22 phút",
    aiResponse: "⟁ CHẾ ĐỘ QUÉT KHU VỰC KÍCH HOẠT\n\nScannerAgent đang thiết lập mạng lưới quét 5×5km. Radar tần số cao được bật. Dự kiến phát hiện vật thể > 0.5m.",
    steps: ["Lên đến độ cao tối ưu quét: 150m", "Bay theo đường kẻ ô tự động", "Kích hoạt radar và camera nhiệt", "Xử lý dữ liệu và lập bản đồ"],
  },
  "activate combat mode": {
    mission: "Combat Mode",
    distance: "Bán kính 5 km",
    batteryRequired: "60%",
    riskLevel: "HIGH",
    estimatedTime: "Không xác định",
    aiResponse: "⟁ CHẾ ĐỘ CHIẾN ĐẤU KÍCH HOẠT\n\n[CẢNH BÁO] Hệ thống vũ trang đang sẵn sàng. Radar theo dõi mục tiêu được bật. Tốc độ phản ứng nâng lên 95%. AI quyết định trong 0.3 giây.",
    steps: ["Kích hoạt hệ thống phòng thủ", "Bật radar theo dõi đa mục tiêu", "Nâng giới hạn tốc độ lên 250km/h", "Chuyển sang chế độ phản xạ tự động"],
  },
  "activate hover mode": {
    mission: "Hover Mode",
    distance: "Tĩnh tại",
    batteryRequired: "28%/giờ",
    riskLevel: "LOW",
    estimatedTime: "Không giới hạn",
    aiResponse: "⟁ CHẾ ĐỘ LƯỢN KÍCH HOẠT\n\nHệ thống giữ vị trí GPS độ chính xác cao. Bù trừ gió tự động. Công suất động cơ được tối ưu để duy trì vị trí tối thiểu năng lượng.",
    steps: ["Khóa tọa độ GPS hiện tại", "Bật cảm biến gió và bù trừ", "Điều chỉnh công suất PID", "Duy trì độ cao ±0.5m"],
  },
};

export function analyzeMission(input: string): MissionAnalysis {
  const key = input.toLowerCase().trim();
  return MISSIONS[key] ?? { ...MISSION_DB.default, mission: input, aiResponse: `⟁ PHÂN TÍCH: "${input}"\n\nNhiệm vụ không chuẩn được nhận. AI đang xây dựng kế hoạch tuỳ chỉnh dựa trên điều kiện hiện tại.` };
}

export function checkTelemetry(state: TelemetryState): AIDecision[] {
  const now = new Date().toLocaleTimeString("vi", { hour12: false });
  const decisions: AIDecision[] = [];

  if (state.battery < 10) {
    decisions.push({ id: Date.now() + "1", time: now, trigger: `Pin: ${state.battery.toFixed(0)}%`, suggestion: "EMERGENCY LAND", severity: "critical", action: "emergency-land" });
  } else if (state.battery < 20) {
    decisions.push({ id: Date.now() + "2", time: now, trigger: `Pin: ${state.battery.toFixed(0)}%`, suggestion: "RETURN HOME", severity: "warning", action: "return-home" });
  }

  if (state.speed > 150) {
    decisions.push({ id: Date.now() + "3", time: now, trigger: `Tốc độ: ${state.speed.toFixed(0)} km/h`, suggestion: "REDUCE SPEED", severity: "warning", action: "reduce-speed" });
  }

  if (state.motorTemp > 75) {
    decisions.push({ id: Date.now() + "4", time: now, trigger: `Nhiệt độ: ${state.motorTemp.toFixed(0)}°C`, suggestion: "REDUCE POWER", severity: "warning", action: "reduce-power" });
  }

  if (state.gpsSignal < 40 && state.isFlying) {
    decisions.push({ id: Date.now() + "5", time: now, trigger: `GPS: ${state.gpsSignal.toFixed(0)}%`, suggestion: "HOVER NOW", severity: "critical", action: "hover" });
  }

  return decisions;
}

export const VOICE_COMMANDS = ["take off", "land", "ascend", "descend", "forward", "backward", "hover", "emergency stop", "scan area", "return home"];

export function parseVoiceCommand(transcript: string): string | null {
  const lower = transcript.toLowerCase();
  return VOICE_COMMANDS.find((cmd) => lower.includes(cmd)) ?? null;
}
