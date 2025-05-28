import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { v4 as uuid } from "uuid";
import {
  Send,
  Plus,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Brain,
  Upload,
  FolderCode,
  User,
  Bot,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";

interface ChatPageProps {
  codebaseName: string | null;
  onBackToUpload: () => void;
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  thoughtProcess?: string;
  timestamp: Date;
  isThinking?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: Date;
  messages: Message[];
}

const ChatPage = () => {
  const { user, repo } = useParams<{ user: string; repo: string }>();
  const codebaseName = user && repo ? `${user}/${repo}` : null;
  const navigate = useNavigate();

  const onBackToUpload = () => {
    navigate("/train");
  };

  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: uuid(),
      title: `Chat with ${codebaseName || "codebase"}`,
      lastMessage: new Date(Date.now() - 1000 * 60 * 30),
      messages: [],
    },
  ]);

  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Set<string>>(
    new Set()
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentSession?.messages]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: uuid(),
      title: "New Chat",
      lastMessage: new Date(),
      messages: [],
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
  };

  // const simulateResponse = async (userMessage: string) => {
  //   setIsTyping(true);

  //   // Create initial thinking message
  //   const thinkingMessageId = uuid();
  //   const initialThinkingMessage: Message = {
  //     id: thinkingMessageId,
  //     type: "assistant",
  //     content: "",
  //     thoughtProcess: "Starting codebase analysis...",
  //     timestamp: new Date(),
  //     isThinking: true,
  //   };

  //   // Add thinking message to session
  //   const addThinkingMessage = () => {
  //     setSessions((prevSessions) =>
  //       prevSessions.map((session) => {
  //         if (session.id === currentSessionId) {
  //           return {
  //             ...session,
  //             messages: [...session.messages, initialThinkingMessage],
  //             lastMessage: new Date(),
  //           };
  //         }
  //         return session;
  //       })
  //     );
  //   };

  //   addThinkingMessage();

  //   // Progressive thought process steps
  //   const thoughtSteps = [
  //     "Starting codebase analysis...",
  //     "Scanning project structure...\n- Found src/ directory\n- Detected React TypeScript project\n- Located package.json",
  //     "Scanning project structure...\n- Found src/ directory\n- Detected React TypeScript project\n- Located package.json\n\nAnalyzing file dependencies...\n- Processing import/export statements\n- Building dependency graph",
  //     "Scanning project structure...\n- Found src/ directory\n- Detected React TypeScript project\n- Located package.json\n\nAnalyzing file dependencies...\n- Processing import/export statements\n- Building dependency graph\n\nIdentifying key components...\n- src/components/AuthProvider.tsx\n- src/auth/auth.service.ts\n- src/hooks/useAuth.ts",
  //     "Scanning project structure...\n- Found src/ directory\n- Detected React TypeScript project\n- Located package.json\n\nAnalyzing file dependencies...\n- Processing import/export statements\n- Building dependency graph\n\nIdentifying key components...\n- src/components/AuthProvider.tsx\n- src/auth/auth.service.ts\n- src/hooks/useAuth.ts\n\nExamining authentication flow...\n- JWT token implementation found\n- Refresh token rotation detected\n- Login/logout handlers identified",
  //     "Scanning project structure...\n- Found src/ directory\n- Detected React TypeScript project\n- Located package.json\n\nAnalyzing file dependencies...\n- Processing import/export statements\n- Building dependency graph\n\nIdentifying key components...\n- src/components/AuthProvider.tsx\n- src/auth/auth.service.ts\n- src/hooks/useAuth.ts\n\nExamining authentication flow...\n- JWT token implementation found\n- Refresh token rotation detected\n- Login/logout handlers identified\n\nSecurity analysis...\n- Checking token storage methods\n- Validating input sanitization\n- Reviewing API endpoint security",
  //     "Scanning project structure...\n- Found src/ directory\n- Detected React TypeScript project\n- Located package.json\n\nAnalyzing file dependencies...\n- Processing import/export statements\n- Building dependency graph\n\nIdentifying key components...\n- src/components/AuthProvider.tsx\n- src/auth/auth.service.ts\n- src/hooks/useAuth.ts\n\nExamining authentication flow...\n- JWT token implementation found\n- Refresh token rotation detected\n- Login/logout handlers identified\n\nSecurity analysis...\n- Checking token storage methods\n- Validating input sanitization\n- Reviewing API endpoint security\n\nGenerating comprehensive response...\n- Summarizing findings\n- Preparing code examples\n- Structuring recommendations",
  //   ];

  //   // Update thought process every 6 seconds
  //   thoughtSteps.forEach((step, index) => {
  //     setTimeout(() => {
  //       setSessions((prevSessions) =>
  //         prevSessions.map((session) => {
  //           if (session.id === currentSessionId) {
  //             const updatedMessages = session.messages.map((msg) => {
  //               if (msg.id === thinkingMessageId) {
  //                 return {
  //                   ...msg,
  //                   thoughtProcess: step,
  //                 };
  //               }
  //               return msg;
  //             });
  //             return {
  //               ...session,
  //               messages: updatedMessages,
  //             };
  //           }
  //           return session;
  //         })
  //       );
  //     }, (index + 1) * 6000);
  //   });

  //   // After 45 seconds, show final response
  //   setTimeout(() => {
  //     const responses = [
  //       {
  //         content:
  //           "I found several authentication-related files in your codebase. The main auth flow appears to be implemented in `src/auth/AuthProvider.tsx` using React Context. The system supports JWT tokens with refresh token rotation.",
  //         thoughtProcess: thoughtSteps[thoughtSteps.length - 1],
  //       },
  //       {
  //         content:
  //           "Based on your database schema, I can see you're using a PostgreSQL database with Prisma ORM. The main entities are User, Post, and Comment with proper foreign key relationships. Here's what I found:",
  //         thoughtProcess: thoughtSteps[thoughtSteps.length - 1],
  //       },
  //     ];

  //     const response = responses[Math.floor(Math.random() * responses.length)];

  //     // Replace thinking message with final response
  //     setSessions((prevSessions) =>
  //       prevSessions.map((session) => {
  //         if (session.id === currentSessionId) {
  //           const updatedMessages = session.messages.map((msg) => {
  //             if (msg.id === thinkingMessageId) {
  //               return {
  //                 ...msg,
  //                 content: response.content,
  //                 thoughtProcess: response.thoughtProcess,
  //                 isThinking: false,
  //               };
  //             }
  //             return msg;
  //           });
  //           return {
  //             ...session,
  //             messages: updatedMessages,
  //             lastMessage: new Date(),
  //             title:
  //               session.messages.length === 1
  //                 ? userMessage.slice(0, 30) + "..."
  //                 : session.title,
  //           };
  //         }
  //         return session;
  //       })
  //     );

  //     setIsTyping(false);
  //   }, 45000);
  // };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSessionId) return;

    const userMessage: Message = {
      id: uuid(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    const updatedSessions = sessions.map((session) => {
      if (session.id === currentSessionId) {
        return {
          ...session,
          messages: [...session.messages, userMessage],
          lastMessage: new Date(),
        };
      }
      return session;
    });

    setSessions(updatedSessions);
    setInputMessage("");

    // await simulateResponse(inputMessage);

    try {
      setIsTyping(true);
      const response = await fetch(`http://localhost:3030/${user}/${repo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: currentSessionId,
          message: inputMessage,
        }),
      });
      const data = await response.json();

      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                lastMessage: new Date(),
                messages: [
                  ...session.messages,
                  {
                    type: "assistant",
                    id: uuid(),
                    content: data.response,
                    timestamp: new Date(),
                  },
                ],
                title:
                  session.messages.length === 1
                    ? inputMessage.slice(0, 30) + "..."
                    : session.title,
              }
            : session
        )
      );

      //  setSessions((prevSessions) =>
      //       prevSessions.map((session) => {
      //         if (session.id === currentSessionId) {
      //           const updatedMessages = session.messages.map((msg) => {
      //             if (msg.id === thinkingMessageId) {
      //               return {
      //                 ...msg,
      //                 content: response.content,
      //                 thoughtProcess: response.thoughtProcess,
      //                 isThinking: false,
      //               };
      //             }
      //             return msg;
      //           });
      //           return {
      //             ...session,
      //             messages: updatedMessages,
      //             lastMessage: new Date(),
      //             title:
      //               session.messages.length === 1
      //                 ? userMessage.slice(0, 30) + "..."
      //                 : session.title,
      //           };
      //         }
      //         return session;
      //       })
      //     );
    } catch (err) {
      // Optionally handle error
      setIsTyping(false);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleThoughtProcess = (messageId: string) => {
    const newExpanded = new Set(expandedThoughts);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedThoughts(newExpanded);
  };

  // Auto-create first session if none exists
  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderCode className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {codebaseName}
              </p>
              <p className="text-xs text-gray-500">Active codebase</p>
            </div>
          </div>
          <Button
            onClick={createNewSession}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg mb-2 hover:bg-gray-100 transition-colors",
                currentSessionId === session.id
                  ? "bg-blue-50 border border-blue-200"
                  : ""
              )}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.lastMessage.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button onClick={onBackToUpload} variant="outline" className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            New Codebase
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="default"
            className="w-full mt-4"
          >
            <List className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentSession.title}
              </h2>
              <p className="text-sm text-gray-500">
                Ask questions about your codebase
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {currentSession.messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ready to help!
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    I've analyzed your codebase and I'm ready to answer
                    questions about architecture, functions, bugs, or anything
                    else.
                  </p>
                </div>
              ) : (
                currentSession.messages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    <div
                      className={cn(
                        "flex gap-3",
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      )}
                    >
                      {message.type === "assistant" && (
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-3xl",
                          message.type === "user"
                            ? "bg-blue-600 text-white rounded-2xl px-4 py-3"
                            : ""
                        )}
                      >
                        {message.type === "user" ? (
                          <p>{message.content}</p>
                        ) : (
                          <Card className="p-4 shadow-sm">
                            {message.isThinking ? (
                              <div className="flex items-center gap-2 mb-4">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                  <div
                                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.1s" }}
                                  ></div>
                                  <div
                                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.2s" }}
                                  ></div>
                                </div>
                                <span className="text-sm text-blue-600 font-medium">
                                  Analyzing codebase...
                                </span>
                              </div>
                            ) : (
                              message.content && (
                                <div className="prose prose-sm max-w-none mb-4">
                                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                                    {message.content}
                                  </p>
                                </div>
                              )
                            )}

                            {message.thoughtProcess && (
                              <div
                                className={cn(
                                  "border-t border-gray-100 pt-4",
                                  message.isThinking ? "border-t-0 pt-0" : ""
                                )}
                              >
                                <button
                                  onClick={() =>
                                    toggleThoughtProcess(message.id)
                                  }
                                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                  <Brain className="w-4 h-4" />
                                  <span>Thought Process</span>
                                  {expandedThoughts.has(message.id) ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>

                                {expandedThoughts.has(message.id) && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg animate-fade-in">
                                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                                      {message.thoughtProcess}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </Card>
                        )}
                      </div>
                      {message.type === "user" && (
                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isTyping &&
                !currentSession.messages.some((m) => m.isThinking) && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <Card className="p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">
                          Analyzing your codebase...
                        </span>
                      </div>
                    </Card>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex gap-3 max-w-4xl mx-auto">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about your codebase..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Select a chat or create a new one to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
