import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Music, User, Mountain, Bike, Camera, BookOpen, Code } from 'lucide-react';
import type { WidgetType } from '../App';

interface ChatPanelProps {
  activeWidget: WidgetType;
  headerHeight?: number;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant' | 'planning';
  timestamp: Date;
  planning?: {
    tools: string[];
    reasoning: string;
  };
}

const widgetContexts = {
  about: {
    greeting: "AMA",
    responses: [
      "I'm a full-stack developer with 5+ years of experience, specializing in React and Node.js.",
      "I'm based in Colorado, which gives me easy access to amazing outdoor activities!",
      "I love the intersection of technology and design - building things that work well and look great.",
      "When I'm not coding, you'll find me on the slopes or bike trails!"
    ]
  },
  music: {
    greeting: "Don't judge how often baby shark gets played in this house 🙈",
    responses: [
      "M83's 'Midnight City' is my go-to coding soundtrack - perfect energy!",
      "I've been listening to a lot of progressive house and ambient electronic lately.",
      "Deadmau5's 'Strobe' is a masterpiece - that 10-minute build is incredible.",
      "Music really helps me focus when I'm deep in code. What kind of music do you like?"
    ]
  },
  snowboarding: {
    greeting: "I traded my surfboard for a snowboard when I moved to Colorado",
    responses: [
      "I usually ride at Breckenridge and Keystone - they have amazing terrain parks!",
      "My last session was in February 2024. Can't wait for the next snow season!",
      "I've been snowboarding for about 8 years now. Started on the bunny slopes!",
      "There's nothing like carving down fresh powder on a bluebird day."
    ]
  },
  biking: {
    greeting: "⛰️🚴💨",
    responses: [
      "I ride both mountain and road bikes - they each have their own appeal.",
      "My favorite trail is the Highline Canal Trail - great for long rides.",
      "I went out just a couple weeks ago! The weather has been perfect for riding.",
      "I'm training for a century ride next summer - 100 miles!"
    ]
  },
  photos: {
    greeting: "Photography is how I capture my adventures! Let's chat about it.",
    responses: [
      "I shoot mostly landscape and outdoor photography - nature is my favorite subject.",
      "I use a Canon mirrorless camera, but honestly, some of my best shots are on my phone!",
      "Golden hour is magical - that warm light makes everything look amazing.",
      "I love finding unique perspectives in familiar places."
    ]
  },
  books: {
    greeting: "Recovering English major 🤓",
    responses: [
      "The Pragmatic Programmer is a classic - every developer should read it at least once.",
      "I'm also reading Atomic Habits by James Clear. The small changes really do add up!",
      "I try to balance technical books with personal development and fiction.",
      "I usually read for 30 minutes before bed - it's a great way to wind down."
    ]
  },
  site: {
    greeting: "Ask me anything about how this site is built!",
    responses: [
      "This site is built with React and TypeScript on the frontend, using Vite as the build tool.",
      "The backend uses Vercel serverless functions to handle API requests and integrations.",
      "Widgets are draggable and rearrangeable using react-dnd library.",
      "The chat feature uses Claude AI to provide contextual responses based on which widget is active."
    ]
  }
};

const widgetIcons = {
  about: { icon: User, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', border: 'border-blue-500' },
  music: { icon: Music, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', border: 'border-purple-500' },
  snowboarding: { icon: Mountain, color: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500' },
  biking: { icon: Bike, color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', border: 'border-orange-500' },
  books: { icon: BookOpen, color: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400', border: 'border-green-500' },
  photos: { icon: Camera, color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', border: 'border-amber-500' },
  site: { icon: Code, color: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400', border: 'border-green-500' }
};

const suggestedPrompts = {
  about: [
    "What are your areas of expertise as a PM?",
    "Who's the GOAT 🏀",
    "Fender or Gibson 🎸"
  ],
  music: [
    "Top songs that aren't kids songs?",
    "How often does baby shark get played?"
  ],
  snowboarding: [
    "Where do you snowboard most often?",
    "What mountains did you visit last season?"
  ],
  biking: [
    "Longest ride over the past year?",
    "How much elevation past year?"
  ],
  books: [
    "What are you currently reading?",
    "What books have you read recently?"
  ],
  photos: [
    "Tell me about your photography",
    "Where have you traveled?"
  ],
  site: [
    "What technologies are used to build this site?",
    "How does the chat feature work?",
    "Can you explain the architecture?"
  ]
};

export function ChatPanel({ activeWidget, headerHeight = 0 }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 600);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const planningAddedRef = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Track window height for responsive chat panel
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeWidget && activeWidget !== null) {
      const context = widgetContexts[activeWidget];
      // Reset messages when widget changes, but keep initial greeting contextual
      setMessages([{
        id: Date.now().toString(),
        text: context.greeting,
        sender: 'assistant',
        timestamp: new Date()
      }]);
      setShowSuggestions(true); // Show suggestions when widget changes
    } else {
      setMessages([{
        id: 'initial',
        text: "👋 Hey! Ask me anything about Jeremy!",
        sender: 'assistant',
        timestamp: new Date()
      }]);
      setShowSuggestions(true); // Show general suggestions when no widget is active
    }
  }, [activeWidget]);

  const sendMessageToAPI = async (messageText: string) => {
    if (!messageText.trim()) return;

    // Hide suggestions when user sends a message
    setShowSuggestions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    const planningKey = `planning-${userMessage.id}`;

    try {
      // Get conversation history (last 10 messages for context, including the one we just added)
      const recentMessages = [...messages, userMessage].slice(-10).map(msg => ({
        role: msg.sender as 'user' | 'assistant',
        content: msg.text,
      }));

      // Call the API endpoint
      // When using 'vercel dev', the API is available at /api/chat
      // When deployed, it's also at /api/chat
      // If running just 'npm run dev', this will fail gracefully with a fallback message
      const apiUrl = '/api/chat';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: recentMessages,
          activeWidget,
          conversationHistory: messages.slice(-10).map(msg => ({
            role: msg.sender as 'user' | 'assistant',
            content: msg.text,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get response');
      }

      const data = await response.json();
      
      console.log('Received API response:', {
        hasPlanning: !!data.planning,
        hasMessage: !!data.message,
        messageLength: data.message?.length,
        messagePreview: data.message?.substring(0, 100)
      });
      
      // Add planning message FIRST (as soon as available) to show it immediately
      if (data.planning && !planningAddedRef.current.has(planningKey)) {
        planningAddedRef.current.add(planningKey);
        const planningMessage: Message = {
          id: planningKey,
          text: data.planning.reasoning || `I'll use ${data.planning.tools.join(', ')} to answer this question.`,
          sender: 'planning',
          timestamp: new Date(),
          planning: data.planning
        };
        
        setMessages(prev => {
          // Double-check we don't already have this planning message
          if (prev.some(msg => msg.id === planningKey)) {
            return prev;
          }
          console.log('Adding planning message immediately:', planningKey);
          return [...prev, planningMessage];
        });
      }
      
      // Then add assistant message (keep loading state visible until this is added)
      const responseId = `response-${userMessage.id}`;
      const assistantMessage: Message = {
        id: responseId,
        text: (data.message && data.message.trim()) 
          ? data.message 
          : 'Sorry, I encountered an error processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => {
        // Check if we already have this response message
        if (prev.some(msg => msg.id === responseId && msg.sender === 'assistant')) {
          return prev;
        }
        console.log('Adding assistant message:', responseId);
        return [...prev, assistantMessage];
      });
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Check if it's an overloaded service error
      const isOverloaded = error.message?.includes('overloaded') || error.message?.includes('Overloaded') || error.message?.includes('temporarily unavailable');
      
      // Fallback to mock response if API fails
      const context = activeWidget ? widgetContexts[activeWidget] : null;
      const randomResponse = context?.responses?.[Math.floor(Math.random() * (context?.responses?.length || 1))] || 'I had trouble processing that request.';
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error.message?.includes('ANTHROPIC_API_KEY') 
          ? '⚠️ Claude API is not configured. Please set ANTHROPIC_API_KEY in your Vercel environment variables. Using fallback response: ' + randomResponse
          : isOverloaded
          ? '⚠️ The AI service is currently overloaded. Please try again in a few moments. Here\'s a fallback response: ' + randomResponse
          : 'Sorry, I encountered an error. ' + (error.message || 'Please try again.'),
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    sendMessageToAPI(prompt);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userInput = input;
    setInput('');
    await sendMessageToAPI(userInput);
  };

  // Calculate responsive height for large screens: viewport height - header - padding
  const responsiveHeight = windowHeight - headerHeight - 40; // 40px for padding/gap

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[600px]"
      style={{ 
        height: typeof window !== 'undefined' && window.innerWidth >= 1024 
          ? `${Math.max(400, responsiveHeight)}px` // Minimum 400px height
          : '600px' 
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-gray-900 dark:text-gray-100">Chat</h3>
          </div>
          
          {/* Active Widget Indicator - On same row */}
          {activeWidget && widgetIcons[activeWidget] && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${widgetIcons[activeWidget].border} ${widgetIcons[activeWidget].color}`}
            >
              {React.createElement(widgetIcons[activeWidget].icon, { className: 'w-4 h-4' })}
              <span className="text-sm capitalize">
                Chatting about {activeWidget === 'about' ? 'me' : activeWidget === 'site' ? 'this site' : activeWidget}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.sender === 'planning'
                    ? 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 italic'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                {message.sender === 'planning' && message.planning && (
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Planning</span>
                  </div>
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {showSuggestions && messages.length <= 1 && (
        <div className="px-4 pt-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {activeWidget && suggestedPrompts[activeWidget] ? (
              suggestedPrompts[activeWidget].map((prompt, index) => (
                <motion.button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(prompt)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                >
                  {prompt}
                </motion.button>
              ))
            ) : (
              <>
                <motion.button
                  type="button"
                  onClick={() => handleSuggestionClick("What are your areas of expertise?")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                >
                  What are your areas of expertise?
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => handleSuggestionClick("What outdoor activities do you do?")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                >
                  What outdoor activities do you do?
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => handleSuggestionClick("What are you currently listening to?")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                >
                  What are you currently listening to?
                </motion.button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className={`px-4 pb-3 ${showSuggestions && messages.length <= 1 ? 'pt-0' : 'pt-4 border-t border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800`} style={{ paddingBottom: '0.75rem' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Hide suggestions when user starts typing
              if (showSuggestions && e.target.value.trim()) {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => {
              // Show suggestions again if input is empty and we're on first message
              if (!input.trim() && messages.length <= 1) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 text-white rounded-xl px-4 py-2 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}