import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, Bot, User, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function MapChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! 전국 마리나와 실시간 해양 정보에 대해 무엇이든 물어보세요.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 메시지 올 때마다 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 백엔드 API 호출 (윤석님 API 주소)
      const res = await axios.post('http://localhost:3000/api/chat', { 
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
      {/* 챗봇 열기 버튼 (플로팅 스타일) */}
      {!isOpen && (
        <div className="absolute bottom-10 right-10 z-[4000] animate-bounce">
          <button 
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-[#003366] text-white rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 transition-all border-4 border-white"
          >
            <MessageSquare size={28} />
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-[#003366] text-[10px] font-black px-2 py-0.5 rounded-full">AI</div>
          </button>
        </div>
      )}

      {/* 챗봇 창 */}
      {isOpen && (
        <div className="absolute bottom-10 right-10 z-[4000] w-[350px] h-[550px] bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* 헤더 */}
          <div className="bg-[#003366] p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Sparkles size={18} className="text-yellow-400" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight leading-none">Map AI Assistant</h4>
                <p className="text-[9px] text-blue-300 font-bold mt-1 uppercase opacity-70">Maritime Intelligence</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
          </div>

          {/* 채팅 메시지 영역 */}
          <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-3xl text-xs font-bold leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#003366] text-white rounded-tr-none shadow-blue-100' 
                    : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* 입력부 */}
          <div className="p-6 bg-white border-t border-gray-50 flex gap-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="지도 데이터에 대해 물어보세요..."
              className="flex-1 text-xs p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-blue-100 transition-all font-bold"
            />
            <button 
              onClick={handleSend}
              className="p-4 bg-[#003366] text-white rounded-2xl hover:bg-blue-800 transition-all shadow-lg shadow-blue-100"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}