"use client";

import { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { useRouter } from "next/navigation";
import { Mic, X, Send, Maximize2, Minimize2, MessageSquare, Volume2, VolumeX, List, Plus } from "lucide-react";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false); // To toggle between large window and small bubble while open
  const [messages, setMessages] = useState<{id?: string, role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<{id: string, title: string, updatedAt: string}[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Sound effect for incoming messages
  const playBop = () => {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAQABAAAA"); // Tiny silent fallback or real bop could go here. We'll use a standard browser beep approach using AudioContext if we wanted, but simplest is just trying to use the Speech API with a short 'bop' or an actual audio file. Since we don't have an asset, we'll use a tiny synthesized oscillator bop.
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch(e) {
      // Ignore audio context errors if user hasn't interacted
    }
  };

  useEffect(() => {
    fetch('/api/chat/sessions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSessions(data);
      });
  }, [showSessions, isOpen]);

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/chat/history?sessionId=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setMessages(data);
          }
        });
    } else {
      setMessages([{ role: 'assistant', content: '¡Hola! Soy tu asistente de Órbita Enterprise. ¿En qué te puedo ayudar hoy?' }]);
    }
  }, [sessionId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'es-ES';
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
          sendMessage(undefined, transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch(e) {}
    }
  };

  const speak = (text: string) => {
    if (!voiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    
    const cleanText = text.replace(/[*_~`#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    
    const voices = synthRef.current.getVoices();
    let bestVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Google')));
    if (!bestVoice) bestVoice = voices.find(v => v.lang.startsWith('es'));
    if (bestVoice) utterance.voice = bestVoice;

    synthRef.current.speak(utterance);
  };

  const sendMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msgToSend = customMsg || input.trim();
    if (!msgToSend || loading) return;

    if (!customMsg) setInput("");
    setMessages(prev => [...prev, { role: 'user', content: msgToSend }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgToSend, sessionId })
      });
      const data = await res.json();
      
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }
      
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        if (isOpen && isMinimized) playBop();
        if (isOpen && !isMinimized) speak(data.reply);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión.' }]);
    } finally {
      setLoading(false);
    }
  };

  const router = useRouter();
  const bubbleRef = useRef(null);
  const panelRef = useRef(null);

  if (!isOpen) {
    return (
      <Draggable nodeRef={bubbleRef} bounds="parent">
        <div ref={bubbleRef} style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          cursor: 'grab'
        }}>
          {/* Botón de Chat Escrito */}
          <button 
            onClick={() => setIsOpen(true)}
            style={{
              position: 'absolute',
              bottom: '75px',
              right: '0px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--primary)',
              border: '2px solid var(--primary)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            title="Chat Escrito"
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <MessageSquare size={24} />
          </button>

          {/* Botón Principal (Orbe Hablado) */}
          <button 
            onClick={() => router.push('/asistente')}
            style={{
              width: '65px',
              height: '65px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            title="Asistente de Voz Pro"
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Mic size={32} />
          </button>
        </div>
      </Draggable>
    );
  }

  return (
    <Draggable nodeRef={panelRef} bounds="parent" handle=".chat-header">
      <div ref={panelRef} style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: isMinimized ? '300px' : '380px',
        height: isMinimized ? '60px' : '600px',
        maxHeight: '80vh',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        overflow: 'hidden',
        transition: 'height 0.3s ease, width 0.3s ease'
      }}>
        
        {/* Header (Draggable) */}
        <div className="chat-header" style={{
          padding: '1rem',
          backgroundColor: 'var(--primary)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'grab'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <MessageSquare size={18} />
            Asistente Órbita
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowSessions(!showSessions)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} title="Historial">
              <List size={16} />
            </button>
            <button onClick={() => setVoiceEnabled(!voiceEnabled)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} title={voiceEnabled ? "Silenciar asistente" : "Activar voz"}>
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button onClick={() => setIsMinimized(!isMinimized)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        {!isMinimized && showSessions && (
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => { setSessionId(null); setShowSessions(false); }}
              style={{ padding: '1rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <Plus size={16} /> Nueva Conversación
            </button>
            {sessions.map(s => (
              <button 
                key={s.id}
                onClick={() => { setSessionId(s.id); setShowSessions(false); }}
                style={{ padding: '1rem', borderBottom: '1px solid var(--border)', backgroundColor: sessionId === s.id ? 'var(--secondary)' : 'transparent', color: sessionId === s.id ? 'white' : 'var(--foreground)', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'block', width: '100%' }}
              >
                <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{new Date(s.updatedAt).toLocaleDateString()}</div>
              </button>
            ))}
          </div>
        )}
        {!isMinimized && !showSessions && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--background)' }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{
                    backgroundColor: msg.role === 'user' ? 'var(--secondary)' : 'var(--primary)',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', backgroundColor: 'var(--primary)', color: 'white', padding: '0.75rem 1rem', borderRadius: '16px 16px 16px 0', fontSize: '0.9rem' }}>
                  Escribiendo...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}>
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button"
                  onClick={toggleListen}
                  style={{ 
                    padding: '0.5rem', 
                    borderRadius: '50%', 
                    backgroundColor: isListening ? '#ef4444' : 'var(--secondary)', 
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Mic size={18} />
                </button>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe o habla..." 
                  style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                />
                <button type="submit" disabled={loading || !input.trim()} style={{ background: 'none', border: 'none', color: input.trim() ? 'var(--primary)' : 'var(--secondary)', cursor: input.trim() ? 'pointer' : 'default' }}>
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </Draggable>
  );
}
