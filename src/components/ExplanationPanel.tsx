import { 
  Users, 
  Search, 
  RotateCw, 
  GitFork, 
  Spline, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function ExplanationPanel() {
  const steps = [
    {
      icon: <Users id="step-1-icon" className="w-5 h-5 text-blue-600" />,
      title: "1. Khởi tạo (Initialization)",
      desc: "Tạo một quần thể ngẫu nhiên gồm các cá thể (nhiễm sắc thể). Mỗi cá thể đóng vai trò là một lời giải tiềm năng cho bài toán.",
      bgColor: "bg-blue-50/50",
      borderColor: "border-blue-100",
      textColor: "text-blue-800"
    },
    {
      icon: <Search id="step-2-icon" className="w-5 h-5 text-amber-600" />,
      title: "2. Đánh giá độ thích nghi (Fitness)",
      desc: "Tính toán điểm thích nghi (fitness score) cho mỗi cá thể. Điểm càng cao nghĩa là phương án giải quyết càng tối ưu.",
      bgColor: "bg-amber-50/50",
      borderColor: "border-amber-100",
      textColor: "text-amber-800"
    },
    {
      icon: <RotateCw id="step-3-icon" className="w-5 h-5 text-emerald-600" />,
      title: "3. Chọn lọc (Selection)",
      desc: "Lựa chọn các cá thể tốt từ quần thể hiện tại làm bố mẹ để sinh sản. Các phương pháp chọn lọc chuẩn bao gồm: Vòng quay may mắn (Roulette), Giải đấu đấu loại (Tournament).",
      bgColor: "bg-emerald-50/50",
      borderColor: "border-emerald-100",
      textColor: "text-emerald-800"
    },
    {
      icon: <GitFork id="step-4-icon" className="w-5 h-5 text-indigo-600" />,
      title: "4. Lai ghép (Crossover)",
      desc: "Ghép các đoạn mã gen từ bố và mẹ để sinh ra cá thể con mới (thế hệ F1). Mục tiêu là tạo ra tổ hợp gen tốt thừa hưởng sức mạnh từ đời trước.",
      bgColor: "bg-indigo-50/50",
      borderColor: "border-indigo-100",
      textColor: "text-indigo-800"
    },
    {
      icon: <Sparkles id="step-5-icon" className="w-5 h-5 text-rose-600" />,
      title: "5. Đột biến (Mutation)",
      desc: "Thay đổi xác suất ngẫu nhiên một vài gen nhỏ của cá thể con để duy trì tính đa dạng sinh học và tránh rơi vào cực trị địa phương (local optimal).",
      bgColor: "bg-rose-50/50",
      borderColor: "border-rose-100",
      textColor: "text-rose-800"
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-center space-x-2.5 mb-5">
        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
          <Spline id="exp-panel-icon" className="w-5 h-5" />
        </div>
        <h3 id="exp-panel-title" className="text-base sm:text-lg font-bold text-slate-900">
          Cơ chế vận hành của Thuật toán Di truyền (GA)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((step, index) => (
          <div key={index} className="relative flex flex-col h-full">
            <div className={`p-4 rounded-xl border ${step.bgColor} ${step.borderColor} flex-1 flex flex-col justify-between`}>
              <div>
                <div className="flex items-center space-x-2.5 mb-2.5">
                  <div className="p-1 rounded-lg bg-white shadow-sm border border-slate-100">
                    {step.icon}
                  </div>
                  <span className={`text-xs font-bold ${step.textColor}`}>Bước {index + 1}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1.5 leading-snug">
                  {step.title.split('. ')[1]}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>
            </div>
            {index < 4 && (
              <div className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 text-slate-300 pointer-events-none">
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 p-3 sm:p-4 bg-slate-50 border border-slate-200/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
        <p className="leading-relaxed">
          💡 <strong>Mẹo nhỏ:</strong> Bạn có thể cấu hình <strong>Tỷ lệ đột biến (Mutation Rate)</strong> cao hơn để đột phá tìm kiếm ở không gian rộng, nhưng quá cao sẽ biến thuật toán thành dò tìm ngẫu nhiên (Random Search). Tỷ lệ khuyến nghị thông thường là <strong>1% - 5%</strong>.
        </p>
      </div>
    </div>
  );
}
