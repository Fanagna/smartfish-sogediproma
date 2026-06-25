import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { chatWithAssistant } from '../../services/iaService'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { FiMessageCircle, FiArrowUp, FiTrash2, FiUser, FiCpu, FiInfo, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  "Quel est l'état actuel de la flotte et des stocks ?",
  "Combien de captures avons-nous faites ce mois-ci ?",
  "Quelles sont les anomalies en cours ?",
  "Recommande-moi des actions pour améliorer la rentabilité",
  "Quel est le chiffre d'affaires des ventes récentes ?",
  "Y a-t-il des risques à signaler ?",
]

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
        isUser ? 'bg-primary text-white' : 'bg-gradient-to-br from-accent to-blue-500 text-white'
      }`}>
        {isUser ? <FiUser className="w-4 h-4" /> : <FiCpu className="w-4 h-4" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-tr-md'
            : 'bg-theme-surface border border-theme-subtle shadow-sm rounded-tl-md text-theme-primary'
        }`}>
          {msg.content}
        </div>
        <p className={`text-[10px] text-theme-tertiary mt-1 ${isUser ? 'text-right' : ''}`}>
          {isUser ? 'Vous' : 'IA2 Assistant'}
        </p>
      </div>
    </div>
  )
}

export default function ChatbotExecutif() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `👋 Bonjour ! Je suis l'assistant exécutif **IA2** de SmartFish. Posez-moi des questions sur la flotte, les captures, les stocks, les ventes ou toute autre donnée opérationnelle.` }
  ])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isSending) return
    const question = input.trim()
    setInput('')
    setIsSending(true)

    const userMsg = { role: 'user', content: question }
    const loadingMsg = { role: 'assistant', content: '...', isLoading: true }
    setMessages(prev => [...prev, userMsg, loadingMsg])

    try {
      const history = messages
        .filter(m => !m.isLoading)
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }))

      const result = await chatWithAssistant(question, history)
      const reponse = result.reponse || result.message || 'Désolé, je n\'ai pas pu traiter votre demande.'

      setMessages(prev => {
        const newMsgs = [...prev]
        newMsgs.pop() // remove loading
        newMsgs.push({ role: 'assistant', content: reponse })
        return newMsgs
      })
    } catch (err) {
      setMessages(prev => {
        const newMsgs = [...prev]
        newMsgs.pop()
        newMsgs.push({ role: 'assistant', content: '❌ Désolé, une erreur est survenue. Veuillez réessayer.' })
        return newMsgs
      })
      toast.error('Erreur de communication avec l\'IA')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: `👋 Bonjour ! Je suis l'assistant exécutif **IA2** de SmartFish. Posez-moi des questions sur la flotte, les captures, les stocks, les ventes ou toute autre donnée opérationnelle.` }
    ])
    toast.success('Conversation réinitialisée')
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-accent/20 to-purple-500/20 rounded-2xl"><FiMessageCircle className="w-7 h-7 text-accent" /></div>
            <h1 className="text-3xl font-bold text-primary">Chatbot Exécutif</h1>
            <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">IA2</span>
          </div>
          <p className="text-theme-secondary ml-1">Assistant conversationnel — données temps réel de SmartFish</p>
        </div>
        <button onClick={clearChat} className="p-2.5 text-theme-secondary hover:text-danger hover:bg-danger/10 rounded-xl transition-all" title="Nouvelle conversation">
          <FiTrash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Suggestions sidebar */}
        <div className="lg:col-span-1">
          <Card variant="glass" className="!p-4 lg:sticky lg:top-6">
            <h3 className="text-sm font-bold text-theme-primary mb-3 flex items-center gap-2">
              <FiCpu className="w-4 h-4 text-accent" /> Suggestions
            </h3>
            <div className="space-y-2">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => { setInput(s) }}
                  className="w-full text-left p-2.5 bg-theme-surface hover:bg-accent/5 hover:border-accent/30 rounded-xl text-xs text-theme-secondary hover:text-accent border border-theme-subtle transition-all">
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-theme-tertiary">
                Les réponses sont générées par IA2 via Google Gemini 1.5 Flash avec les données temps réel de la base.
              </p>
            </div>
          </Card>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-3">
          <Card variant="glass" className="!p-0 flex flex-col" style={{ minHeight: '550px' }}>
            {/* Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[450px] custom-scrollbar">
              {messages.map((msg, i) => (
                msg.isLoading ? (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center shrink-0 shadow-md">
                      <FiCpu className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-theme-surface border border-theme-subtle shadow-sm rounded-2xl rounded-tl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Spinner className="w-4 h-4 border-2 border-accent/30 border-t-accent" />
                        <span className="text-sm text-theme-tertiary">Réflexion en cours...</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ChatMessage key={i} msg={msg} />
                )
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-4 bg-theme-surface/50 rounded-b-2xl">
              <div className="flex items-center gap-3">
                <textarea value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question à l'assistant IA..."
                  rows={1}
                  className="flex-1 px-4 py-3 bg-theme-surface border border-theme rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent resize-none placeholder-gray-400" />
                <button onClick={handleSend} disabled={!input.trim() || isSending}
                  className="p-3 bg-accent text-white rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">
                  {isSending ? <Spinner className="w-5 h-5 border-2 border-white/30 border-t-white" /> : <FiArrowUp className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[10px] text-theme-tertiary mt-2">L'assistant utilise Gemini 1.5 Flash — les réponses peuvent prendre quelques secondes</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Info */}
      <Card variant="glass" className="!p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-accent/10 rounded-xl shrink-0"><FiMessageCircle className="w-5 h-5 text-accent" /></div>
          <div>
            <h3 className="font-bold text-theme-primary mb-1">À propos d'IA2</h3>
            <p className="text-sm text-theme-secondary">
              L'assistant exécutif conversationnel (IA15 / IA2) utilise Google Gemini 1.5 Flash pour répondre
              à vos questions en langage naturel. Il a accès aux données temps réel de la base SmartFish :
              captures, stocks, bateaux, maintenances, ventes, exportations, anomalies et KPIs clés.
              Les 10 derniers échanges sont conservés pour assurer la continuité de la conversation.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
