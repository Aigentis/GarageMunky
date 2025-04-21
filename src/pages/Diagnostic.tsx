
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";

const Diagnostic = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', text: string}>>([
    {
      role: "assistant",
      text: "Hi there! I'm your AI vehicle diagnostic assistant. Tell me what issues you're experiencing with your vehicle, and I'll try to help diagnose the problem."
    }
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsThinking(true);

    // Simulate AI thinking
    setTimeout(() => {
      let response = "";
      
      // Basic response logic based on keywords
      if (userMessage.toLowerCase().includes("brake") || userMessage.toLowerCase().includes("stopping")) {
        response = "Based on your description, it sounds like you might be experiencing brake issues. This could be due to worn brake pads, low brake fluid, or a problem with the brake lines. I recommend having your brake system inspected by a professional mechanic as soon as possible, as brake problems can be a safety concern.";
      } else if (userMessage.toLowerCase().includes("noise") || userMessage.toLowerCase().includes("sound")) {
        response = "Unusual noises can indicate various issues depending on when they occur. If you hear squealing during braking, it might be worn brake pads. A grinding noise while driving could indicate wheel bearing problems. Knocking sounds from the engine might suggest ignition timing or fuel issues. Can you describe when exactly you hear the noise and what it sounds like?";
      } else if (userMessage.toLowerCase().includes("engine") || userMessage.toLowerCase().includes("starting")) {
        response = "Engine starting issues often relate to the battery, starter motor, or fuel system. First, check if your dashboard lights come on - if not, your battery might be dead. If lights work but the engine doesn't turn over, it could be your starter motor. If it turns over but doesn't start, it might be a fuel or spark plug issue. When did you first notice this problem?";
      } else if (userMessage.toLowerCase().includes("light") || userMessage.toLowerCase().includes("warning")) {
        response = "Warning lights on your dashboard are your vehicle's way of communicating specific issues. Can you tell me which warning light is displayed (color and symbol)? This will help me provide more specific guidance on what might be wrong and what action you should take.";
      } else {
        response = "I understand you're experiencing an issue with your vehicle. To help diagnose the problem more accurately, could you provide more specific details? For example, when does the issue occur (during starting, while driving, etc.)? Are there any unusual sounds, smells, or warning lights? The more information you provide, the better I can assist you.";
      }
      
      setMessages(prev => [...prev, { role: "assistant", text: response }]);
      setIsThinking(false);
    }, 2000);
  };

  return (
    <div className="pb-20 flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white p-4 border-b">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft size={24} />
          </button>
          
          <h1 className="text-xl font-bold ml-2">AI Diagnostic Assistant</h1>
        </div>
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`mb-4 ${
              message.role === "user" ? "flex justify-end" : "flex justify-start"
            }`}
          >
            <div 
              className={`max-w-[75%] p-3 rounded-lg ${
                message.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-gray-100 text-gray-800 rounded-tl-none"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        
        {isThinking && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="bg-white border-t p-4">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your vehicle issue..."
            className="flex-1 border border-gray-300 rounded-l-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isThinking}
            className="bg-primary text-primary-foreground px-5 rounded-r-full flex items-center justify-center disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-2">
          This is a simulated AI assistant for demonstration purposes
        </p>
      </div>
      
      {/* Bottom Navigation */}
      <NavBar />
    </div>
  );
};

export default Diagnostic;
