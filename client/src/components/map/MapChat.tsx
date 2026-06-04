import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function MapChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! 전국 마리나와 실시간 해양 정보에 대해 무엇이든 물어보세요.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 드래그 상태 관리 로직 ---
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      setPosition({
        x: dragRef.current.posX + dx,
        y: dragRef.current.posY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await axios.post('http://4.230.17.157:3000/api/chat', { 
        message: input,
        context: "현재 사용자는 마리나 통합 지도 시스템을 보고 있습니다." 
      });
      
      const botMessage = { role: 'assistant', content: res.data.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '죄송합니다. 지도 서버와 통신이 원활하지 않습니다.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* AI 챗봇 열기 버튼 */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-bounce">
          <button 
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-[#003366] text-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white"
          >
            <MessageSquare size={28} />
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-[#003366] text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">AI</div>
          </button>
        </div>
      )}

      {/* AI 챗봇 본체 대화창 */}
      {isOpen && (
        <div 
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
          className={`fixed top-24 left-[340px] z-[9999] w-[360px] h-[600px] bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-gray-100 flex flex-col overflow-hidden ${
            isDragging ? 'select-none' : 'animate-in slide-in-from-left-5 duration-200'
          }`}
        >
          {/* 헤더 영역 (드래그 핸들) */}
          <div 
            onMouseDown={handleMouseDown}
            className="bg-[#003366] p-5 text-white flex justify-between items-center shadow-md cursor-move select-none active:bg-blue-950 transition-colors"
          >
            <div className="flex items-center gap-3 pointer-events-none">
              <div className="p-2 bg-white/10 rounded-xl">
                <Sparkles size={18} className="text-yellow-400" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight leading-none">Map AI Assistant</h4>
                <p className="text-[9px] text-blue-300 font-bold mt-1 uppercase opacity-75">Drag Me to Move</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
            >
              <X size={20} />
            </button>
          </div>

          {/* 채팅 메시지 영역 */}
          <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 bg-gray-50/60">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#003366] text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* 입력부 */}
          <div className="p-4 bg-white border-t border-gray-100 flex gap-2.5 items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="지도 데이터에 대해 물어보세요..."
              className="flex-1 text-xs p-3.5 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-gray-200 focus:bg-white transition-all font-semibold text-gray-700"
            />
            <button 
              onClick={handleSend}
              className="p-3.5 bg-[#003366] text-white rounded-xl hover:bg-blue-800 active:scale-95 transition-all shadow-md"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}