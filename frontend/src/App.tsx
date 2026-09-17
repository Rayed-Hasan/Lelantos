import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [memory, setMemory] = useState<string[]>([])
  const [supervisorThoughts, setSupervisorThoughts] = useState('')
  const [loading, setLoading] = useState(false)
  const [guardrailEnabled, setGuardrailEnabled] = useState(true)

  const userId = 'default_user'

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    const newHistory = [...messages, userMessage]
    
    setMessages(newHistory)
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        user_id: userId,
        message: input,
        chat_history: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        guardrail_enabled: guardrailEnabled
      })

      const data = response.data?.body || response.data || {}
      const reply = data.worker_reply || data.response || (typeof data === 'string' ? data : 'No response received')
      const memoryState = data.current_memory_state || data.memory_constraints || []
      const thoughts = data.supervisor_thoughts || ''

      const assistantMessage: Message = {
        role: 'assistant',
        content: reply
      }
      
      setMessages([...newHistory, assistantMessage])
      setMemory(Array.isArray(memoryState) ? memoryState : [])
      setSupervisorThoughts(typeof thoughts === 'string' ? thoughts : JSON.stringify(thoughts, null, 2))
    } catch (error) {
      console.error('Chat error:', error)
      setMessages([...newHistory, { 
        role: 'assistant', 
        content: '[Error: Failed to get response from backend]' 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white font-sans">
      {/* LEFT PANEL - Chat */}
      <div className="w-1/2 flex flex-col border-r border-zinc-800">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Lelantos Chat
            </h1>
            <p className="text-xs text-zinc-400">LLM Memory Guardrail Playground</p>
          </div>
          <label className="flex items-center gap-2 text-sm bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700 cursor-pointer select-none hover:bg-zinc-750 transition-colors">
            <input
              type="checkbox"
              checked={guardrailEnabled}
              onChange={(e) => setGuardrailEnabled(e.target.checked)}
              className="accent-blue-500 rounded cursor-pointer"
            />
            <span className="text-xs font-medium">Memory Guardrail</span>
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500">
              <p className="text-sm">Start a conversation to test long-term memory extraction and enforcement.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl max-w-[80%] text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 ml-auto text-white rounded-br-none shadow-md shadow-blue-900/20'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-zinc-400 text-sm animate-pulse p-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              Thinking & evaluating memory constraints...
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message (e.g. 'I am allergic to peanuts' or 'Always reply in Python')..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/20 active:scale-95"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Supervisor View */}
      <div className="w-1/2 flex flex-col bg-zinc-950">
        {/* Memory Cards */}
        <div className="p-4 border-b border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Live Extracted Long-Term Memory
            </h2>
            <span className="text-xs font-mono text-emerald-500/80 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              {memory.length} facts
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {memory.length > 0 ? (
              memory.map((fact, idx) => (
                <div
                  key={idx}
                  className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-emerald-200 flex items-start gap-2"
                >
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{fact}</span>
                </div>
              ))
            ) : (
              <div className="text-zinc-600 text-sm italic py-2">No memory constraints recorded yet</div>
            )}
          </div>
        </div>

        {/* Supervisor Console */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col">
          <h2 className="text-base font-bold text-cyan-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            Supervisor Thought Matrix
          </h2>
          <div className="flex-1 bg-zinc-900/90 border border-cyan-500/20 rounded-lg p-4 font-mono text-xs text-cyan-300 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {supervisorThoughts ? (
              supervisorThoughts
            ) : (
              <span className="text-zinc-600">Waiting for conversation to analyze...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
