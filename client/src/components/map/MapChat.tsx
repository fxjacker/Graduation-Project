// React의 핵심 상태 관리(useState), 참조(useRef), 생명주기(useEffect) 훅을 불러옵니다.
import { useState, useRef, useEffect } from 'react';
// UI 디자인을 위한 Lucide 아이콘(전송, 말풍선, 닫기, 반짝임)들을 불러옵니다.
import { Send, MessageSquare, X, Sparkles } from 'lucide-react';
// 백엔드와 HTTP 통신을 하기 위해 axios 라이브러리를 불러옵니다.
import axios from 'axios';

// 💡 [핵심] 부모 컴포넌트(Map)에서 선을 그릴 수 있도록 onNavigate 함수를 Props로 받습니다.
export default function MapChat({ onNavigate }: any) {
  // 챗봇 창이 열려있는지 닫혀있는지 관리하는 상태 변수입니다.
  const [isOpen, setIsOpen] = useState(false);
  // 사용자와 AI가 주고받은 채팅 메시지 목록을 저장하는 배열 상태 변수입니다.
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! 전국 마리나의 실시간 날씨, 수심 정보에 대해 물어보세요. 길찾기도 가능합니다! (예: "명동 마리나에서 충무 마리나 어때?")' }
  ]);
  // 사용자가 키보드로 입력하고 있는 현재 텍스트(input)를 관리하는 상태 변수입니다.
  const [input, setInput] = useState('');
  // AI가 답변을 생성하느라 로딩 중인지(점 3개 깜빡임) 관리하는 상태 변수입니다.
  const [isLoading, setIsLoading] = useState(false);
  // 채팅창 내용이 길어지면 자동으로 맨 밑으로 스크롤을 내리기 위한 돔(DOM) 참조 변수입니다.
  const scrollRef = useRef<HTMLDivElement>(null);

  // 💡 [핵심] AI가 길찾기를 제안했을 때, 사용자의 수락을 기다리며 임시로 저장해두는 상태 변수입니다.
  const [pendingNav, setPendingNav] = useState<any>(null);

  // 챗봇 창의 실시간 X, Y 픽셀 위치를 저장하는 상태 변수입니다. (드래그 용도)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // 현재 사용자가 챗봇 헤더를 마우스로 꾹 누르고 드래그 중인지 판별하는 상태 변수입니다.
  const [isDragging, setIsDragging] = useState(false);
  // 드래그를 시작한 마우스의 최초 좌표를 저장해두는 참조 변수입니다.
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  // 메시지 배열에 새로운 대화가 추가될 때마다 실행되는 이펙트 훅입니다.
  useEffect(() => {
    // 채팅 스크롤 영역이 존재한다면
    if (scrollRef.current) {
      // 스크롤바를 뷰포트의 가장 맨 밑바닥 높이까지 강제로 끌어내립니다. (자동 스크롤)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  // 의존성 배열에 messages를 넣어 메시지가 바뀔 때만 이 기능이 동작하게 합니다.
  }, [messages]);

  // 챗봇 상단 파란색 헤더 부분에 마우스를 꾹 눌렀을 때(MouseDown) 실행되는 함수입니다.
  const handleMouseDown = (e: React.MouseEvent) => {
    // 만약 닫기(X) 버튼을 누른 거라면 창 드래그가 작동하지 않도록 예외 처리합니다.
    if ((e.target as HTMLElement).closest('button')) return;

    // 드래그가 시작되었다고 상태를 true로 변경합니다.
    setIsDragging(true);
    // 마우스를 클릭한 순간의 정확한 화면 좌표를 백업해 둡니다.
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  // 창을 꾹 누르고 있는(드래그) 동안 마우스가 움직일 때마다 위치를 업데이트하는 훅입니다.
  useEffect(() => {
    // 마우스가 화면 위를 이동할 때 발동하는 함수입니다.
    const handleMouseMove = (e: MouseEvent) => {
      // 마우스를 꾹 누른(드래그) 상태가 아니면 그냥 무시하고 함수를 종료합니다.
      if (!isDragging) return;
      
      // 처음 클릭했던 위치에서 마우스가 X축으로 얼만큼 움직였는지 계산합니다.
      const dx = e.clientX - dragRef.current.startX;
      // 처음 클릭했던 위치에서 마우스가 Y축으로 얼만큼 움직였는지 계산합니다.
      const dy = e.clientY - dragRef.current.startY;

      // 계산된 이동 거리만큼 챗봇 창의 현재 위치(Position) 상태를 갱신합니다.
      setPosition({
        x: dragRef.current.posX + dx,
        y: dragRef.current.posY + dy,
      });
    };

    // 마우스 클릭을 손에서 뗐을 때 발동하여 드래그를 멈추는 함수입니다.
    const handleMouseUp = () => setIsDragging(false);

    // 드래그 중일 때만 화면 전체(window)에 마우스 움직임 감지 센서를 켭니다.
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    // 컴포넌트가 꺼지거나 이펙트가 끝날 때 켜두었던 센서들을 메모리에서 깔끔하게 지웁니다.
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  // 드래그 상태가 변할 때만 이 이펙트 로직을 다시 세팅합니다.
  }, [isDragging]);

  // 💡 [핵심] 사용자가 텍스트를 다 치고 '전송' 버튼(또는 엔터)을 눌렀을 때 실행되는 함수입니다.
  const handleSend = async () => {
    // 아무것도 안 치고 빈 칸이거나 공백만 쳤다면 전송되지 않게 막습니다.
    if (!input.trim()) return;

    // 내가 방금 친 텍스트를 화면 말풍선에 띄우기 위해 객체로 만듭니다.
    const userMessage = { role: 'user', content: input };
    // 기존 대화 내역 배열의 맨 뒤에 내 메시지를 찰칵 붙여넣습니다.
    setMessages(prev => [...prev, userMessage]);
    // 전송했으니 텍스트 입력창은 다시 깔끔하게 비워줍니다.
    setInput('');
    // AI가 생각(로딩)하고 있다는 점 3개 애니메이션을 화면에 켭니다.
    setIsLoading(true);

    // 💡 [초강력 예외 처리] 만약 AI가 네비게이션을 제안해서 대기 중(pendingNav)인 상태라면?
    if (pendingNav) {
      // 사용자가 긍정(허락)을 뜻하는 단어를 쳤는지 배열을 돌며 검사합니다.
      const isPositive = ['응', '어', '네', '해줘', '그래', '시작', '콜', 'yes', '부탁해'].some(word => input.includes(word));
      // 사용자가 부정(거절)을 뜻하는 단어를 쳤는지 배열을 돌며 검사합니다.
      const isNegative = ['아니', '됐어', '괜찮아', '싫어', '취소', 'no', '안해'].some(word => input.includes(word));

      // 1. 만약 긍정적인 대답을 했다면? (서버에 물어볼 필요 없이 프론트에서 즉시 실행!)
      if (isPositive) {
        // 부모(지도) 컴포넌트로 출발지/도착지 데이터를 쏴서 냅다 길을 그려버립니다!
        if (onNavigate) onNavigate(pendingNav.start, pendingNav.end);
        // AI가 대답한 것처럼 "네비게이션 켭니다!" 말풍선을 화면에 추가합니다.
        setMessages(prev => [...prev, { role: 'assistant', content: '🌊 경로 탐색을 시작합니다! 하단의 뷰를 확인해주세요.' }]);
        // 미션 클리어했으니 대기열(pending)을 깔끔하게 비워줍니다.
        setPendingNav(null);
        // 로딩 애니메이션을 끄고 함수를 즉시 종료합니다.
        setIsLoading(false);
        return;
      }
      
      // 2. 만약 부정적인 대답을 했다면?
      if (isNegative) {
        // AI가 취소했다고 말풍선을 띄워줍니다.
        setMessages(prev => [...prev, { role: 'assistant', content: '네, 알겠습니다. 네비게이션 실행을 취소할게요. 다른 궁금한 점이 있으신가요?' }]);
        // 취소했으니 대기열을 깔끔하게 비워줍니다.
        setPendingNav(null);
        // 로딩 끄고 종료합니다.
        setIsLoading(false);
        return;
      }
      // 긍정도 부정도 아니면(엉뚱한 소리를 하면) 그냥 아래 통신 로직으로 넘어가서 평소처럼 AI에게 대답을 요구합니다.
    }

    // 서버와 통신하다가 터질 수 있으니 try-catch로 감쌉니다.
    try {
      // 백엔드 API 주소로 사용자의 메시지를 POST 전송합니다.
      const res = await axios.post('http://4.230.17.157:3000/api/chat', { 
        message: input 
      });
      
      // 서버에서 훌륭하게 답변이 도착했다면 봇의 말풍선으로 만들어줍니다.
      const botMessage = { role: 'assistant', content: res.data.reply };
      // 화면 채팅창 목록에 봇의 말풍선을 띄웁니다.
      setMessages(prev => [...prev, botMessage]);

      // 💡 [핵심] 서버가 "야! 사용자가 마리나 2개 불렀어! 길찾기 준비해!" 하고 데이터를 몰래 넘겨줬다면?
      if (res.data.proposedNav) {
        // 프론트엔드의 대기열(pendingNav) 상태에 그 출발지/도착지 덩어리를 쏙 저장해 둡니다.
        // 이러면 다음 턴에 사용자가 "응" 이라고 대답할 때 즉시 반응할 수 있습니다.
        setPendingNav(res.data.proposedNav);
      }

    // 서버가 죽었거나 통신이 실패하면 이쪽으로 빠집니다.
    } catch (err) {
      // 사용자 당황하지 않게 정중한 통신 실패 에러 말풍선을 띄워줍니다.
      setMessages(prev => [...prev, { role: 'assistant', content: '죄송합니다. 챗봇 서버와 통신이 원활하지 않습니다.' }]);
    // 성공했든 실패했든 무조건 로딩 애니메이션은 꺼줘야 합니다.
    } finally {
      setIsLoading(false);
    }
  // 전송 함수 괄호를 닫습니다.
  };

  // 본격적으로 화면(HTML/DOM)을 그리는 렌더링 구역입니다.
  return (
    // React 프래그먼트(<>)를 열어 태그들을 하나로 묶어줍니다.
    <>
      {/* 챗봇 창이 꺼져있을 때(!isOpen)만 우측 하단에 동그란 말풍선 버튼을 보여줍니다. */}
      {!isOpen && (
        // z-index 9999로 최상단에 띄우고, 위아래로 둥둥 떠다니는 애니메이션(bounce)을 줍니다.
        <div className="fixed bottom-6 right-6 z-[9999] animate-bounce">
          <button 
            // 버튼을 누르면 isOpen 상태를 true로 바꿔서 챗봇 본체를 엽니다.
            onClick={() => setIsOpen(true)}
            // 짙은 남색 배경, 둥근 모양, 그림자 등 테일윈드(Tailwind) CSS 스타일을 잔뜩 입힙니다.
            className="w-16 h-16 bg-[#003366] text-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white"
          >
            {/* Lucide의 말풍선 아이콘을 가운데 그립니다. */}
            <MessageSquare size={28} />
            {/* 우측 상단에 노란색으로 앙증맞은 'AI' 딱지를 붙여 강조합니다. */}
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-[#003366] text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">AI</div>
          </button>
        </div>
      )}

      {/* 버튼을 눌러서 isOpen 상태가 true로 바뀌면, 진짜 챗봇 대화창 본체를 화면에 그립니다. */}
      {isOpen && (
        <div 
          // 드래그 할 때마다 position.x 와 position.y 값이 바뀌며 창이 마우스를 따라다니게 만듭니다.
          style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
          // 창 크기, 반투명 효과(backdrop-blur), 둥근 모서리, 왼쪽에서 튀어나오는 등장 애니메이션을 줍니다.
          className={`fixed top-24 left-[340px] z-[9999] w-[360px] h-[600px] bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-gray-100 flex flex-col overflow-hidden ${
            // 드래그 중일 땐 글씨가 복사(선택)되지 않게 막고, 아니면 등장 애니메이션을 줍니다.
            isDragging ? 'select-none' : 'animate-in slide-in-from-left-5 duration-200'
          }`}
        >
          {/* 파란색 상단 헤더 영역입니다. 이 부분을 잡고 마우스로 끌 수 있습니다(드래그 핸들). */}
          <div 
            // 마우스를 꾹 누르면 아까 만든 handleMouseDown 함수가 발동합니다.
            onMouseDown={handleMouseDown}
            // 짙은 남색 배경, 패딩, 마우스 커서가 십자가(move)로 바뀌는 스타일을 줍니다.
            className="bg-[#003366] p-5 text-white flex justify-between items-center shadow-md cursor-move select-none active:bg-blue-950 transition-colors"
          >
            {/* 헤더 왼쪽 텍스트와 반짝이 아이콘을 묶어두는 래퍼입니다. */}
            <div className="flex items-center gap-3 pointer-events-none">
              <div className="p-2 bg-white/10 rounded-xl">
                {/* 노란색 반짝이 아이콘을 넣습니다. */}
                <Sparkles size={18} className="text-yellow-400" />
              </div>
              <div>
                {/* 챗봇의 웅장한(?) 타이틀 텍스트입니다. */}
                <h4 className="text-sm font-black tracking-tight leading-none">Map AI Assistant</h4>
                {/* 잡고 끌라는 힌트를 주는 작고 귀여운 서브 텍스트입니다. */}
                <p className="text-[9px] text-blue-300 font-bold mt-1 uppercase opacity-75">Drag Me to Move</p>
              </div>
            </div>
            <button 
              // 우측의 X 버튼을 누르면 창이 닫히도록 isOpen을 false로 되돌립니다.
              onClick={() => setIsOpen(false)} 
              // 마우스를 올리면 밝아지고 누르면 쏙 들어가는 효과를 줍니다.
              className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
            >
              {/* Lucide의 X 아이콘을 그립니다. */}
              <X size={20} />
            </button>
          </div>

          {/* 사용자와 AI가 나눈 대화 말풍선들이 리스트업 되는 중앙 채팅 내역 영역입니다. */}
          <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 bg-gray-50/60">
            {/* messages 배열에 들어있는 대화(객체) 개수만큼 루프(map)를 돌면서 말풍선을 하나씩 뽑아냅니다. */}
            {messages.map((msg, i) => (
              // 내 메시지면 오른쪽 정렬(justify-end), AI 메시지면 왼쪽 정렬(justify-start)을 합니다.
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {/* 말풍선의 모서리를 둥글게 깎고 디자인합니다. */}
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                  // 내 메시지면 파란색 배경에 흰 글씨, AI면 하얀 배경에 검은 글씨를 입힙니다.
                  msg.role === 'user' 
                    ? 'bg-[#003366] text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {/* 진짜 텍스트 알맹이가 화면에 출력되는 부분입니다. */}
                  {msg.content}
                </div>
              </div>
            ))}
            {/* 만약 AI가 답변을 생성하느라 로딩 중(isLoading이 true)이라면? */}
            {isLoading && (
              // AI 위치(왼쪽)에 귀여운 점 3개가 튀어오르는 애니메이션 말풍선을 띄워줍니다.
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* 맨 밑에 사용자가 키보드로 텍스트를 입력하는 바텀 인풋(Input) 영역입니다. */}
          <div className="p-4 bg-white border-t border-gray-100 flex gap-2.5 items-center">
            <input 
              // 글씨를 쓰는 input 태그입니다.
              type="text" 
              // 입력창의 값은 우리가 선언한 input 상태 변수에 묶여(바인딩) 있습니다.
              value={input}
              // 키보드를 칠 때마다 input 상태 변수의 값을 최신 글자로 업데이트합니다.
              onChange={(e) => setInput(e.target.value)}
              // 엔터(Enter) 키를 치면 마우스로 전송 버튼을 누른 것과 똑같이 handleSend 함수를 발동시킵니다.
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              // 힌트 텍스트(플레이스홀더)를 적어줍니다.
              placeholder="예: 명동에서 충무 어때?"
              // 테두리를 둥글게 하고 포커스가 가면 배경색이 하얗게 변하는 스타일을 줍니다.
              className="flex-1 text-xs p-3.5 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-gray-200 focus:bg-white transition-all font-semibold text-gray-700"
            />
            <button 
              // 텍스트를 다 치고 이 버튼을 클릭하면 서버로 데이터를 날리는 handleSend 함수가 켜집니다.
              onClick={handleSend}
              // 남색 배경과 입체감을 주는 스타일을 입힙니다.
              className="p-3.5 bg-[#003366] text-white rounded-xl hover:bg-blue-800 active:scale-95 transition-all shadow-md"
            >
              {/* 종이비행기 모양의 전송(Send) 아이콘을 그려 넣습니다. */}
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  // 컴포넌트 JSX 반환 블록을 닫아줍니다.
  );
// MapChat 메인 함수 블록을 닫아줍니다.
}