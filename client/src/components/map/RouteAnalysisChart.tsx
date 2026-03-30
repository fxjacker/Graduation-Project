import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Waves, X, Anchor } from 'lucide-react';

export default function RouteAnalysisChart({ data, onClose, startName, endName }: any) {
  if (!data || data.length === 0) return null;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[3000] w-[90%] max-w-5xl bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-8 border border-white animate-in slide-in-from-bottom duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
            <Waves size={24} className="animate-pulse" />
          </div>
          <div>
            <h4 className="font-black text-xl text-[#003366] flex items-center gap-2">
              실시간 항로 수심 분석 <span className="text-sm font-normal text-gray-400">({startName} → {endName})</span>
            </h4>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all">
          <X size={24} className="text-gray-400" />
        </button>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="dist" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis reversed domain={[0, 'auto']} fontSize={10} axisLine={false} tickLine={false} unit="m" />
            <Tooltip />
            <Area type="monotone" dataKey="depth" stroke="#2563eb" fill="url(#colorDepth)" strokeWidth={4} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}