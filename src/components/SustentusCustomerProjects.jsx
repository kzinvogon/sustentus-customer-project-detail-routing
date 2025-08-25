import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

/**
 * Sustentus – Customer Project Flow (List → Detail, Chat, Actions, Documents)
 * - Routing:
 *   /projects           → list
 *   /projects/:id       → detail (default tab: overview)
 *   /projects/:id/:tab  → detail with tab (overview|chat|financials|profile|documents)
 */

export const projectsData = [
  {
    id: 123,
    title: "Website Upgrade – Phase 1",
    updated: "22 Aug 2025",
    stage: "Waiting Approval",
    chatUnread: 1,
    actionLabel: "View Approve",
    description:
      "Modernise website foundation: migrate CMS, implement component library, and set up CI/CD for safe releases.",
    status: "Waiting Approval",
    nextAction: {
      label: "Approve Requirements",
      ownerRole: "Customer",
      due: "24 Aug 2025",
    },
    responseRequired: true,
    lastActions: [
      { when: "22 Aug 2025 10:14", who: "CSM", what: "Requested approval of requirement v1.3" },
      { when: "21 Aug 2025 16:02", who: "PM", what: "Attached timeline draft and milestones" },
      { when: "21 Aug 2025 12:26", who: "Expert", what: "Added CMS migration notes" },
    ],
    history: [
      { when: "22 Aug 2025 10:14", who: "CSM", what: "Approval requested (v1.3)" },
      { when: "21 Aug 2025 17:21", who: "Customer", what: "Commented on scope for blog archive" },
      { when: "21 Aug 2025 16:02", who: "PM", what: "Uploaded project plan PDF" },
      { when: "21 Aug 2025 12:26", who: "Expert", what: "Posted CMS migration approach" },
      { when: "19 Aug 2025 09:40", who: "CSM", what: "Opened project and assigned roles" },
    ],
    quotes: [
      { id: "Q-7841", date: "22 Aug 2025", amount: 4200, status: "Pending Approval" },
    ],
    invoices: [
      { id: "INV-3012", date: "15 Aug 2025", amount: 1200, status: "Issued" },
    ],
    profile: {
      customerRef: "ACME-CO",
      contact: "Jane Cooper",
      email: "jane.cooper@example.com",
      environment: "Production + Staging",
    },
    chat: [
      { id: 1, role: "CSM", at: "22 Aug 09:10", text: "Shared v1.3 requirements. Please review.", seen: true },
      { id: 2, role: "Customer", at: "22 Aug 09:40", text: "Skimmed—looks good, two questions on SEO.", seen: true },
      { id: 3, role: "Expert", at: "22 Aug 10:00", text: "Answered both; added notes in the doc.", seen: true },
      { id: 4, role: "CSM", at: "22 Aug 10:14", text: "Great—could you approve to proceed?", seen: false },
    ],
    documents: [
      { id: "DOC-1001", name: "Requirements v1.3.pdf", uploadedBy: "CSM", date: "22 Aug 2025 10:10" },
      { id: "DOC-0999", name: "Timeline Draft.xlsx", uploadedBy: "PM", date: "21 Aug 2025 15:55" },
    ],
  },
  {
    id: 124,
    title: "CRM Data Migration",
    updated: "19 Aug 2025",
    stage: "In Progress",
    chatUnread: 0,
    actionLabel: "Track Progress",
    description: "Migrate legacy CRM data to new platform with field mapping and validation.",
    status: "In Progress",
    responseRequired: false,
    nextAction: { label: "Awaiting vendor export", ownerRole: "Expert", due: "—" },
    lastActions: [
      { when: "19 Aug 2025 16:41", who: "PM", what: "Confirmed field-mapping rules" },
    ],
    history: [],
    quotes: [],
    invoices: [],
    profile: { customerRef: "BRAVO-INC", contact: "Alex Rivers", email: "alex@bravo.com", environment: "Sandbox" },
    chat: [
      { id: 1, role: "PM", at: "19 Aug 15:00", text: "Upload received; starting validation.", seen: true },
    ],
    documents: [],
  },
];

const Pill = ({ children, tone = "slate" }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-${tone}-100 text-${tone}-800`}>{children}</span>
);

const StatusPill = ({ status }) => {
  const map = {
    "In Progress": { bg: "sky", text: "In Progress" },
    "Waiting Approval": { bg: "amber", text: "Waiting Approval" },
    "Invoice Issued": { bg: "violet", text: "Invoice Issued" },
    "Project Closed": { bg: "slate", text: "Project Closed" },
    "Review Quote": { bg: "blue", text: "Review Quote" },
  };
  const s = map[status] || { bg: "slate", text: status };
  return <Pill tone={s.bg}>{s.text}</Pill>;
};

const RoleBadge = ({ role }) => {
  const tone = role === "Customer" ? "stone" : role === "CSM" ? "cyan" : role === "PM" ? "rose" : role === "Expert" ? "emerald" : "slate";
  return <Pill tone={tone}>{role}</Pill>;
};

const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100" aria-label="Close">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">{children}</div>
        <div className="px-5 py-4 bg-slate-50 rounded-b-2xl flex items-center justify-end gap-3">{footer}</div>
      </div>
    </div>
  );
};

export default function SustentusCustomerProjects({ mode = "list" }) {
  const navigate = useNavigate();
  const params = useParams();
  const [projects, setProjects] = useState(projectsData);
  const [view, setView] = useState("list"); // Always start with list view
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState("Approve");
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Load from URL if detail route
  useEffect(() => {
    console.log("useEffect triggered", { mode, params, projects: projects.length });
    if (mode === "detail" && params.id) {
      const id = Number(params.id);
      const proj = projects.find(p => p.id === id) || projects[0];
      setSelected(proj);
      const tab = params.tab || "overview";
      setActiveTab(tab);
      setView("detail");
      console.log("Set to detail view", { proj, tab });
    } else {
      setView("list");
      console.log("Set to list view");
    }
  }, [mode, params, projects]);

  // Ensure we always have a view set
  useEffect(() => {
    if (!view) {
      setView("list");
      console.log("Fallback: set view to list");
    }
  }, [view]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Focus search input
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) searchInput.focus();
      }
      
      // Cmd/Ctrl + / for shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(!showShortcuts);
      }
      
      // Cmd/Ctrl + D for dark mode toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        // Trigger theme toggle (this will be handled by the parent component)
        const themeButton = document.querySelector('[aria-label="Toggle theme"]');
        if (themeButton) themeButton.click();
      }
      
      // ESC to close modals/shortcuts
      if (e.key === 'Escape') {
        if (showShortcuts) setShowShortcuts(false);
        if (actionOpen) setActionOpen(false);
      }
      
      // Tab navigation with Cmd/Ctrl + number
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        const tabs = ['overview', 'dashboard', 'chat', 'financials', 'profile', 'documents'];
        if (tabs[tabIndex] && view === 'detail') {
          setActiveTab(tabs[tabIndex]);
          if (selected) navigate(`/projects/${selected.id}/${tabs[tabIndex]}`);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts, actionOpen, view, selected, navigate]);

  const openProject = (project, tab = "overview") => {
    setSelected(project);
    setActiveTab(tab);
    setView("detail");
    navigate(`/projects/${project.id}/${tab}`);
  };

  const gotoTab = (tab) => {
    setActiveTab(tab);
    if (selected) navigate(`/projects/${selected.id}/${tab}`);
  };

  const onOpenAction = (type) => {
    setActionType(type);
    setActionOpen(true);
  };

  return (
    <div>
      {view === "list" ? (
        <ProjectList
          projects={projects}
          onRowClick={(p) => openProject(p, "overview")}
          onChatClick={(p) => openProject(p, "chat")}
          onActionClick={(p) => {
            setSelected(p);
            setActionType(p.id === 123 ? "Approve" : "Clarify");
            setActionOpen(true);
          }}
        />
      ) : (
        <ProjectDetail
          project={selected}
          activeTab={activeTab}
          onBack={() => { setView("list"); navigate("/projects"); }}
          onOpenAction={onOpenAction}
          onTab={gotoTab}
          onUploadDoc={(fileObj) => {
            if (!fileObj || !selected) return;
            setProjects(prev => prev.map(p => {
              if (p.id !== selected.id) return p;
              const docs = p.documents ? [...p.documents] : [];
              docs.unshift({
                id: `DOC-${Math.floor(Math.random()*9000)+1000}`,
                name: fileObj.name,
                uploadedBy: "Customer",
                date: new Date().toLocaleString()
              });
              return { ...p, documents: docs };
            }));
          }}
        />
      )}

      <ActionModal
        open={actionOpen}
        type={actionType}
        onClose={() => setActionOpen(false)}
        project={selected}
      />

      {showShortcuts && <KeyboardShortcuts />}
      <NotificationSystem />
    </div>
  );
}

function ProjectList({ projects, onRowClick, onChatClick, onActionClick }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    return projects.filter(
      (p) => `${p.id} ${p.title}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, projects]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <div className="flex gap-2">
          <button className="rounded-full px-3 py-1.5 bg-black text-white text-sm">Active</button>
          <button className="rounded-full px-3 py-1.5 text-sm border">All</button>
        </div>
      </div>

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ID or title..."
          className="w-full rounded-xl border px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="absolute right-3 top-2.5">🔎</span>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th>ID</Th>
              <Th>Project Title</Th>
              <Th>Last Update</Th>
              <Th>Current Stage</Th>
              <Th>Chat</Th>
              <Th className="text-right pr-4">Action</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t hover:bg-slate-50">
                <Td onClick={() => onRowClick(p)} className="cursor-pointer font-medium">{p.id}</Td>
                <Td onClick={() => onRowClick(p)} className="cursor-pointer">
                  <div className="font-medium">{p.title}</div>
                </Td>
                <Td onClick={() => onRowClick(p)} className="cursor-pointer">{p.updated}</Td>
                <Td onClick={() => onRowClick(p)} className="cursor-pointer"><StatusPill status={p.stage === "Waiting Approval" ? "Waiting Approval" : p.stage} /></Td>
                <Td>
                  <button
                    onClick={() => onChatClick(p)}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-slate-50"
                  >
                    💬 Chat {p.chatUnread ? <span className="ml-1 rounded-full bg-red-500 text-white text-xs font-semibold px-1.5">{p.chatUnread}</span> : null}
                  </button>
                </Td>
                <Td className="text-right pr-4">
                  <button
                    onClick={() => onActionClick(p)}
                    className="rounded-lg bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700"
                  >
                    {p.id === 123 ? "View Approve" : p.actionLabel}
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const Th = ({ children, className = "" }) => (
  <th className={`text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3 ${className}`}>{children}</th>
);
const Td = ({ children, className = "", onClick }) => (
  <td onClick={onClick} className={`px-4 py-3 align-top ${className}`}>{children}</td>
);

function ProjectDetail({ project, activeTab, onBack, onOpenAction, onTab, onUploadDoc }) {
  if (!project) return null;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-lg border px-3 py-1.5">← Back</button>
        <h2 className="text-2xl font-bold">{project.title}</h2>
        <div className="ml-auto flex items-center gap-2">
          <StatusPill status={project.status} />
          {project.responseRequired && (
            <span className="rounded-md bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1">Response required</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TabButton active={activeTab === "overview"} onClick={() => onTab("overview")}>Overview</TabButton>
        <TabButton active={activeTab === "dashboard"} onClick={() => onTab("dashboard")}>Dashboard</TabButton>
        <TabButton active={activeTab === "chat"} onClick={() => onTab("chat")}>Chat</TabButton>
        <TabButton active={activeTab === "financials"} onClick={() => onTab("financials")}>Financials</TabButton>
        <TabButton active={activeTab === "profile"} onClick={() => onTab("profile")}>Profile</TabButton>
        <TabButton active={activeTab === "documents"} onClick={() => onTab("documents")}>Documents</TabButton>

        <div className="ml-auto flex gap-2">
          <button onClick={() => onOpenAction("Approve")} className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 hover:bg-emerald-700">Approve</button>
          <button onClick={() => onOpenAction("Reject")} className="rounded-lg bg-rose-600 text-white px-3 py-1.5 hover:bg-rose-700">Reject</button>
          <button onClick={() => onOpenAction("Clarify")} className="rounded-lg bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700">Clarify</button>
        </div>
      </div>

      {activeTab === "overview" && <OverviewTab project={project} />}
      {activeTab === "dashboard" && <DashboardTab project={project} />}
      {activeTab === "chat" && <ChatTab project={project} />}
      {activeTab === "financials" && <FinancialsTab project={project} />}
      {activeTab === "profile" && <ProfileTab project={project} />}
      {activeTab === "documents" && <DocumentsTab project={project} onUploadDoc={onUploadDoc} />}
    </div>
  );
}

const TabButton = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`rounded-xl px-3 py-1.5 text-sm ${ active ? "bg-black text-white" : "border hover:bg-slate-50" }`}>
    {children}
  </button>
);

function OverviewTab({ project }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <Card title="Project Description">
          <p className="text-slate-700 leading-relaxed">{project.description}</p>
        </Card>

        <ProjectTimeline project={project} />

        <Card title="Last Actions (most recent first)">
          <ul className="divide-y">
            {project.lastActions.map((a, idx) => (
              <li key={idx} className="py-3 flex items-start gap-3">
                <div className="pt-0.5"><RoleBadge role={a.who} /></div>
                <div>
                  <div className="text-sm font-medium">{a.what}</div>
                  <div className="text-xs text-slate-500 mt-1">{a.when}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Activity Log / History">
          <ol className="relative border-l pl-4">
            {project.history.map((h, i) => (
              <li key={i} className="mb-4 ml-2">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-slate-300" />
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{h.when}</span>
                  <RoleBadge role={h.who} />
                </div>
                <div className="mt-1 text-sm">{h.what}</div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="space-y-5">
        <Card title="Status">
          <div className="flex items-center gap-2">
            <StatusPill status={project.status} />
          </div>
        </Card>

        <Card title="Next Action">
          <div className="space-y-1">
            <div className="text-sm font-medium">{project.nextAction?.label || "—"}</div>
            <div className="text-xs text-slate-500">Owner: {project.nextAction?.ownerRole || "—"}</div>
            <div className="text-xs text-slate-500">Due: {project.nextAction?.due || "—"}</div>
          </div>
        </Card>

        {project.responseRequired && (
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
            <div className="text-sm font-semibold text-amber-900">Your response is required</div>
            <p className="text-sm text-amber-900/90 mt-1">To keep things moving, please approve, reject, or request clarifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatTab({ project }) {
  const [messages, setMessages] = useState(project.chat || []);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Demo AI responses based on project context
  const generateAIResponse = (userMessage, project) => {
    const responses = [
      {
        trigger: ["approve", "approval", "ok", "yes", "good", "looks good", "fine"],
        response: "Excellent! I'll mark this as approved and notify the development team to proceed with implementation. You should receive a confirmation email within the next hour.",
        role: "CSM"
      },
      {
        trigger: ["reject", "no", "bad", "wrong", "issue", "problem", "concern"],
        response: "I understand your concerns. Let me schedule a call with the team to address these issues and come back with a revised approach. When would be a good time for you?",
        role: "CSM"
      },
      {
        trigger: ["timeline", "schedule", "when", "deadline", "due date", "completion"],
        response: `Based on our current progress, we're looking at completion around ${project.nextAction?.due || "the end of next month"}. I can break down the remaining milestones and show you exactly what's left to complete.`,
        role: "PM"
      },
      {
        trigger: ["cost", "price", "budget", "quote", "money", "payment"],
        response: `The current quote is €${project.quotes?.[0]?.amount?.toLocaleString() || "pending"}. I can provide a detailed breakdown of all line items, or we can discuss payment terms if you'd like to proceed.`,
        role: "PM"
      },
      {
        trigger: ["technical", "tech", "implementation", "how", "code", "development"],
        response: "Great technical question! I'll have our senior developer review this and provide you with a detailed response including code examples, architecture diagrams, and implementation steps.",
        role: "Expert"
      },
      {
        trigger: ["document", "file", "upload", "attachment", "pdf", "spec"],
        response: "I can see you've uploaded a document. I'll review it thoroughly and get back to you with any questions or feedback within the next few hours. This will help us move the project forward.",
        role: "CSM"
      },
      {
        trigger: ["status", "progress", "update", "where are we"],
        response: `Currently, your project is in the "${project.stage}" stage. The next action required is: ${project.nextAction?.label || "team review"}. Would you like me to provide a detailed progress report?`,
        role: "PM"
      },
      {
        trigger: ["team", "who", "contact", "person"],
        response: "Our team includes a Customer Success Manager (CSM), Project Manager (PM), and Technical Expert. I can connect you with any specific team member or schedule a group call to discuss your project.",
        role: "CSM"
      },
      {
        trigger: ["quality", "testing", "review", "check"],
        response: "Quality assurance is built into every phase of our process. We have automated testing, code reviews, and client approval checkpoints. Would you like me to show you our quality metrics for this project?",
        role: "Expert"
      }
    ];

    // Find matching response
    const userLower = userMessage.toLowerCase();
    const matchedResponse = responses.find(r => 
      r.trigger.some(trigger => userLower.includes(trigger))
    );

    if (matchedResponse) {
      return {
        id: Date.now() + 1,
        role: matchedResponse.role,
        at: new Date().toLocaleTimeString(),
        text: matchedResponse.response,
        seen: false
      };
    }

    // Default intelligent responses based on project context
    const defaultResponses = [
      {
        role: "CSM",
        text: "That's a great question! Let me check with the team and get back to you with a comprehensive answer within the next hour."
      },
      {
        role: "PM", 
        text: "I understand your question perfectly. Let me gather the relevant information from our project files and provide you with a detailed response."
      },
      {
        role: "Expert",
        text: "Excellent technical question! I'll need to review the current implementation and provide you with a thorough explanation including best practices."
      }
    ];

    const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    return {
      id: Date.now() + 1,
      role: randomResponse.role,
      at: new Date().toLocaleTimeString(),
      text: randomResponse.text,
      seen: false
    };
  };

  const send = () => {
    if (!text.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      role: "Customer",
      at: new Date().toLocaleTimeString(),
      text: text.trim(),
      seen: false
    };
    
    setMessages(prev => [...prev, userMessage]);
    setText("");
    
    // Simulate AI thinking
    setIsTyping(true);
    
    // Generate AI response after a short delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(text.trim(), project);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5 seconds
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2">
        <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm flex flex-col h-[520px]">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold">Project Chat</div>
            <div className="text-xs text-slate-500">Participants: <RoleBadge role="Customer" /> <RoleBadge role="CSM" /> <RoleBadge role="PM" /> <RoleBadge role="Expert" /></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((m) => (
              <div key={m.id} className={`max-w-[80%] ${m.role === "Customer" ? "ml-auto" : ""}`}>
                <div className={`rounded-2xl px-4 py-2 shadow-sm ring-1 ring-black/5 ${m.role === "Customer" ? "bg-emerald-600 text-white" : "bg-white"}`}>
                  <div className="flex items-center gap-2 text-xs mb-1 opacity-80">
                    <RoleBadge role={m.role} /> <span>{m.at}</span>
                  </div>
                  <div className="text-sm leading-relaxed">{m.text}</div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="max-w-[80%]">
                <div className="rounded-2xl px-4 py-2 shadow-sm ring-1 ring-black/5 bg-white">
                  <div className="flex items-center gap-2 text-xs mb-1 opacity-80">
                    <RoleBadge role="CSM" /> <span>typing...</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t bg-white flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message…"
              className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={send} 
              disabled={!text.trim() || isTyping}
              className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <Card title="Chat Info">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span>Unread</span><span className="font-medium">{project.chatUnread || 0}</span></div>
            <div className="flex items-center justify-between"><span>SLA timer</span><span className="font-medium">4h 12m</span></div>
            <div className="flex items-center justify-between"><span>Last message</span><span className="font-medium">{messages[messages.length - 1]?.at || "—"}</span></div>
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg border px-3 py-1.5">Attach file</button>
            <button className="rounded-lg border px-3 py-1.5">Add watcher</button>
            <button className="rounded-lg border px-3 py-1.5">Mark as resolved</button>
          </div>
        </Card>

        <Card title="Demo Tips">
          <div className="text-xs text-slate-600 space-y-2">
            <p>Try asking about:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Project approval</li>
              <li>Timeline & deadlines</li>
              <li>Costs & quotes</li>
              <li>Technical details</li>
              <li>Document uploads</li>
            </ul>
            <p className="text-xs text-slate-500 mt-2">The AI will respond based on the project context!</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function FinancialsTab({ project }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="Quotes">
        {project.quotes?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-2">ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {project.quotes.map((q) => (
                <tr key={q.id} className="border-t">
                  <td className="py-2">{q.id}</td>
                  <td>{q.date}</td>
                  <td>€{q.amount.toLocaleString()}</td>
                  <td><Pill tone={q.status.includes("Pending") ? "amber" : "emerald"}>{q.status}</Pill></td>
                  <td className="text-right"><button className="rounded-lg bg-blue-600 text-white px-3 py-1.5">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>There are no quotes yet.</Empty>
        )}
      </Card>

      <Card title="Invoices">
        {project.invoices?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-2">ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {project.invoices.map((inv) => (
                <tr key={inv.id} className="border-top">
                  <td className="py-2">{inv.id}</td>
                  <td>{inv.date}</td>
                  <td>€{inv.amount.toLocaleString()}</td>
                  <td><Pill tone={inv.status === "Issued" ? "violet" : "emerald"}>{inv.status}</Pill></td>
                  <td className="text-right"><button className="rounded-lg border px-3 py-1.5">Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>No invoices yet.</Empty>
        )}
      </Card>
    </div>
  );
}

function ProfileTab({ project }) {
  const p = project.profile || {};
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="Project Profile">
        <div className="grid grid-cols-1 gap-3 text-sm">
          <L item="Customer Ref" value={p.customerRef} />
          <L item="Primary Contact" value={p.contact} />
          <L item="Email" value={p.email} />
          <L item="Environments" value={p.environment} />
        </div>
      </Card>

      <Card title="Update Profile">
        <form className="space-y-3">
          <Field label="Primary Contact" defaultValue={p.contact} />
          <Field label="Email" defaultValue={p.email} type="email" />
          <Field label="Environment" defaultValue={p.environment} />
          <div className="pt-2">
            <button type="button" className="rounded-lg bg-black text-white px-4 py-2">Save Changes</button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function DocumentsTab({ project, onUploadDoc }) {
  const docs = project.documents || [];
  const [uploadName, setUploadName] = useState("");
  const [fileObj, setFileObj] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      setFileObj(file);
      setUploadName(file.name);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileObj(file);
      setUploadName(file.name);
    }
  };

  const simulateUpload = () => {
    if (!fileObj) return;
    
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          onUploadDoc && onUploadDoc(fileObj);
          setFileObj(null);
          setUploadName("");
          setUploadProgress(0);
          return 0;
        }
        return prev + 10;
      });
    }, 100);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      case 'zip':
      case 'rar': return '📦';
      default: return '📎';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <Card title="Documents">
          {docs.length ? (
            <div className="space-y-3">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border dark:border-slate-700 border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                  <div className="text-2xl">{getFileIcon(d.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate dark:text-white">{d.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Uploaded by <RoleBadge role={d.uploadedBy} /> on {d.date}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 dark:border-slate-600 dark:text-slate-300 transition-colors duration-200">
                      View
                    </button>
                    <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 dark:border-slate-600 dark:text-slate-300 transition-colors duration-200">
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>No documents uploaded yet.</Empty>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="Upload a Document">
          <div className="space-y-3 text-sm">
            {/* Drag & Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-4xl mb-2">📁</div>
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">or</p>
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors duration-200"
              >
                Choose File
              </label>
            </div>

            {/* File Preview */}
            {fileObj && (
              <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getFileIcon(fileObj.name)}</span>
                  <span className="font-medium text-sm dark:text-white">{fileObj.name}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Size: {(fileObj.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={simulateUpload}
              className="w-full rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-200"
              disabled={!fileObj || uploadProgress > 0}
            >
              {uploadProgress > 0 ? 'Uploading...' : 'Upload Document'}
            </button>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Note: This demo simulates upload by adding the file to the list.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ActionModal({ open, onClose, type, project }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const header = {
    Approve: "Approve Request",
    Reject: "Reject Request",
    Clarify: "Ask for Clarification",
  }[type || "Approve"];

  const submitLabel = {
    Approve: "Approve & Continue",
    Reject: "Submit Rejection",
    Clarify: "Send Clarification",
  }[type || "Approve"];

  const showReason = type === "Reject";

  return (
    <Modal open={open} onClose={onClose} title={header}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button>
          <button onClick={onClose} className={`rounded-lg px-4 py-2 text-white ${type === "Reject" ? "bg-rose-600 hover:bg-rose-700" : type === "Clarify" ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>{submitLabel}</button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="text-slate-600">Project: <span className="font-medium">{project?.title || "—"}</span></div>
        {type === "Approve" && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-900">
            You are approving the latest request (e.g., requirements v1.3 / quote {project?.quotes?.[0]?.id || "—"}).
          </div>
        )}
        {showReason && (
          <div>
            <label className="text-xs font-medium text-slate-600">Reason (required)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Explain why you’re rejecting…" />
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-slate-600">Note (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder={type === "Clarify" ? "Ask your question(s)…" : "Add an optional note…"} />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div>Owner after this action: <span className="font-medium">{type === "Approve" ? "PM" : type === "Reject" ? "CSM" : "CSM"}</span></div>
          <div>Next step: <span className="font-medium">{type === "Approve" ? "Start build" : type === "Reject" ? "Revise & resend" : "Provide clarification"}</span></div>
        </div>
      </div>
    </Modal>
  );
}

const Card = ({ title, children }) => (
  <div className="rounded-2xl shadow-sm ring-1 ring-black/5 transition-colors duration-200 dark:bg-slate-800 dark:ring-slate-700 bg-white">
    <div className="px-5 py-4 border-b flex items-center justify-between dark:border-slate-700 border-slate-200">
      <h3 className="font-semibold dark:text-white">{title}</h3>
    </div>
    <div className="px-5 py-4 dark:text-slate-200">{children}</div>
  </div>
);

const Empty = ({ children }) => (
  <div className="text-sm text-slate-500">{children}</div>
);

const L = ({ item, value }) => (
  <div className="flex items-center justify-between">
    <div className="text-slate-500">{item}</div>
    <div className="font-medium">{value || "—"}</div>
  </div>
);

const Field = ({ label, type = "text", defaultValue = "" }) => (
  <div>
    <label className="text-xs font-medium text-slate-600">{label}</label>
    <input type={type} defaultValue={defaultValue} className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </div>
);

function ProjectTimeline({ project }) {
  const milestones = [
    { id: 1, title: "Requirements Gathering", status: "completed", date: "15 Aug 2025", progress: 100 },
    { id: 2, title: "Design & Planning", status: "completed", date: "18 Aug 2025", progress: 100 },
    { id: 3, title: "Development Phase", status: "in-progress", date: "22 Aug 2025", progress: 65 },
    { id: 4, title: "Testing & QA", status: "pending", date: "25 Aug 2025", progress: 0 },
    { id: 5, title: "Deployment", status: "pending", date: "28 Aug 2025", progress: 0 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500';
      case 'in-progress': return 'bg-blue-500';
      case 'pending': return 'bg-slate-300';
      default: return 'bg-slate-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  return (
    <Card title="Project Timeline">
      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="flex items-center gap-4">
            {/* Status indicator */}
            <div className={`w-3 h-3 rounded-full ${getStatusColor(milestone.status)}`} />
            
            {/* Progress bar */}
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{milestone.title}</span>
                <span className="text-slate-500">{milestone.date}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    milestone.status === 'completed' ? 'bg-emerald-500' : 
                    milestone.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                  style={{ width: `${milestone.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>{getStatusText(milestone.status)}</span>
                <span>{milestone.progress}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DashboardTab({ project }) {
  const metrics = [
    { label: "Project Progress", value: "65%", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20" },
    { label: "Days Remaining", value: "12", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/20" },
    { label: "Budget Used", value: "€1,200", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/20" },
    { label: "Team Members", value: "4", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/20" }
  ];

  const recentActivity = [
    { type: "comment", text: "Customer approved requirements v1.3", time: "2 hours ago", icon: "💬" },
    { type: "upload", text: "PM uploaded project timeline", time: "4 hours ago", icon: "📁" },
    { type: "status", text: "Project moved to Development phase", time: "1 day ago", icon: "🔄" },
    { type: "chat", text: "Technical discussion in chat", time: "2 days ago", icon: "💭" }
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className={`p-4 rounded-xl ${metric.bg} border dark:border-slate-700`}>
            <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Project Health">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Overall Score</span>
              <span className="text-lg font-bold text-emerald-600">8.5/10</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Timeline</span>
                <span className="text-emerald-600">On Track</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Budget</span>
                <span className="text-amber-600">Under Budget</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Quality</span>
                <span className="text-emerald-600">Excellent</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Recent Activity">
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                <span className="text-lg">{activity.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium dark:text-white">{activity.text}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="p-3 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-xs font-medium dark:text-white">Generate Report</div>
          </button>
          <button className="p-3 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
            <div className="text-2xl mb-2">📅</div>
            <div className="text-xs font-medium dark:text-white">Schedule Meeting</div>
          </button>
          <button className="p-3 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
            <div className="text-2xl mb-2">📧</div>
            <div className="text-xs font-medium dark:text-white">Send Update</div>
          </button>
          <button className="p-3 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-xs font-medium dark:text-white">Quick Actions</div>
          </button>
        </div>
      </Card>
    </div>
  );
}

function KeyboardShortcuts() {
  const shortcuts = [
    { key: "⌘ + K", description: "Quick search" },
    { key: "⌘ + N", description: "New project" },
    { key: "⌘ + S", description: "Save changes" },
    { key: "⌘ + /", description: "Show shortcuts" },
    { key: "⌘ + D", description: "Toggle dark mode" },
    { key: "⌘ + T", description: "Switch tabs" }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-white">Keyboard Shortcuts</h3>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">✕</button>
        </div>
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          Press ESC to close
        </div>
      </div>
    </div>
  );
}

function NotificationSystem() {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', title: 'Project Updated', message: 'Your project has been successfully updated.', time: '2 minutes ago' },
    { id: 2, type: 'info', title: 'New Message', message: 'You have a new message in the project chat.', time: '5 minutes ago' },
    { id: 3, type: 'warning', title: 'Deadline Approaching', message: 'Project deadline is approaching in 3 days.', time: '1 hour ago' }
  ]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800';
      case 'error': return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      case 'warning': return 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800';
      case 'info': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
      default: return 'border-slate-200 bg-slate-50 dark:bg-slate-900/20 dark:border-slate-800';
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addNotification = (type, title, message) => {
    const newNotification = {
      id: Date.now(),
      type,
      title,
      message,
      time: 'Just now'
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  return (
    <div className="fixed top-4 right-4 z-40 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} shadow-lg transition-all duration-300 transform hover:scale-105`}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm dark:text-white">{notification.title}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notification.message}</div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-2">{notification.time}</div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
