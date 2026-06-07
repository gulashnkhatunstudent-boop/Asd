/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { 
  Terminal, 
  Settings, 
  Database, 
  FileCode, 
  GitBranch, 
  Play, 
  Pause, 
  UserPlus, 
  RefreshCw, 
  Sliders, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  FileText, 
  Check, 
  Copy, 
  Download, 
  Send, 
  MessageSquare, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  DatabaseZap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { phpFiles } from './phpCodeData';
import { 
  SimulatedConfig, 
  BotStep, 
  SimulatedUser, 
  CallbackLog, 
  WorkerLog, 
  SystemLog, 
  ActiveTab, 
  ActiveCodeFile, 
  ActiveDbTable 
} from './types';

export default function App() {
  // Tab Management
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [activeCodeFile, setActiveCodeFile] = useState<ActiveCodeFile>('install.php');
  const [activeDbTable, setActiveDbTable] = useState<ActiveDbTable>('users');
  
  // Simulated Settings and Configuration (Pre-configured correctly based on PRD)
  const [config, setConfig] = useState<SimulatedConfig>({
    dbHost: 'localhost',
    dbName: 'telegram_funnel_db',
    dbUser: 'admin_user',
    telegramToken: '827194625:AAH_Un_46B_Anita_Desai_here_Example',
    channelId: '-1002047382910'
  });

  // State flags
  const [copiedCode, setCopiedCode] = useState(false);
  const [autoTick, setAutoTick] = useState(true);
  const [selectedUserForChat, setSelectedUserForChat] = useState<number | null>(2); // Rohan selected by default
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [chatMessageInput, setChatMessageInput] = useState('');

  // Tables state
  const [users, setUsers] = useState<SimulatedUser[]>([
    {
      id: 1,
      userId: 748192039,
      username: "arjun_mehta",
      firstName: "Arjun",
      step: BotStep.STEP_4,
      actionTimestamp: new Date(Date.now() - 45000).toISOString(),
      isBlocked: false,
      createdAt: new Date(Date.now() - 120000).toISOString(),
      updatedAt: new Date(Date.now() - 45500).toISOString(),
      joinedSimSecsAgo: 120
    },
    {
      id: 2,
      userId: 618293049,
      username: "rohan_s",
      firstName: "Rohan",
      step: BotStep.STEP_1,
      actionTimestamp: new Date(Date.now() - 3000).toISOString(), // Joined 3s ago
      isBlocked: false,
      createdAt: new Date(Date.now() - 3000).toISOString(),
      updatedAt: new Date(Date.now() - 3000).toISOString(),
      joinedSimSecsAgo: 3
    },
    {
      id: 3,
      userId: 509281726,
      username: "priya_sharma",
      firstName: "Priya",
      step: BotStep.STEP_2, // Already clicked Get Bonus
      actionTimestamp: new Date(Date.now() - 35000).toISOString(),
      isBlocked: false,
      createdAt: new Date(Date.now() - 40000).toISOString(),
      updatedAt: new Date(Date.now() - 35000).toISOString(),
      joinedSimSecsAgo: 40
    }
  ]);

  const [callbackLogs, setCallbackLogs] = useState<CallbackLog[]>([
    {
      id: 1,
      userId: 509281726,
      callbackData: 'get_bonus',
      createdAt: new Date(Date.now() - 35000).toISOString()
    }
  ]);

  const [workerLogs, setWorkerLogs] = useState<WorkerLog[]>([
    {
      id: 1,
      userId: 748192039,
      actionType: 'send_salary_message',
      createdAt: new Date(Date.now() - 60000).toISOString()
    },
    {
      id: 2,
      userId: 748192039,
      actionType: 'send_media_group',
      createdAt: new Date(Date.now() - 45000).toISOString()
    }
  ]);

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([
    {
      id: 1,
      timestamp: new Date(Date.now() - 120000).toISOString(),
      type: 'webhook',
      message: 'Processing chat_member update: User ID = 748192039, Status = member'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 119500).toISOString(),
      type: 'webhook',
      message: 'Created new user database state: ID = 748192039, Name = Arjun'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 60000).toISOString(),
      type: 'worker',
      message: 'State Lock: Transformed User 748192039 from Step 1 -> Step 3. Dispatching salary message.'
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 45000).toISOString(),
      type: 'worker',
      message: 'State Lock: Transformed User 748192039 from Step 3 -> Step 4. Dispatching Media Group album.'
    }
  ]);

  // Terminal Ref for auto scroll
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll Terminal Logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [systemLogs]);

  // Dynamic log writing wrapper
  const addSystemLog = (type: 'webhook' | 'worker' | 'error', message: string) => {
    setSystemLogs(prev => [
      ...prev,
      {
        id: prev.length + 1,
        timestamp: new Date().toISOString(),
        type,
        message
      }
    ]);
  };

  // Automated 1-second ticking simulation representing Cron Watchdog Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoTick) {
      interval = setInterval(() => {
        // Increment timer values
        setUsers(currentUsers => {
          return currentUsers.map(user => {
            const joinedSecs = user.joinedSimSecsAgo + 1;
            const updatedUser = { ...user, joinedSimSecsAgo: joinedSecs };

            // Determine time gap from actionTimestamp
            const actionMillis = new Date(user.actionTimestamp).getTime();
            const elapsedSecs = Math.floor((Date.now() - actionMillis) / 1000);

            // Step 1 Users Check (>= 10 seconds -> Move to Step 3)
            if (user.step === BotStep.STEP_1 && elapsedSecs >= 10 && !user.isBlocked) {
              // Simulated Transaction block 'SELECT FOR UPDATE'
              addSystemLog('worker', `CRON EXEC: Running 10-second check. SELECT FOR UPDATE row of user ${user.userId}`);
              
              setTimeout(() => {
                setWorkerLogs(w => [
                  ...w,
                  {
                    id: w.length + 1,
                    userId: user.userId,
                    actionType: 'send_salary_message',
                    createdAt: new Date().toISOString()
                  }
                ]);
                addSystemLog('worker', `DATABASE COMMIT: Marked user ${user.userId} -> Step 3 (action_timestamp updated)`);
                addSystemLog('webhook', `DISPATCH CURL: sendPhoto to User Chat ${user.userId} (Salary Image #2)`);
              }, 100);

              return {
                ...updatedUser,
                step: BotStep.STEP_3,
                actionTimestamp: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            }

            // Step 3 Users Check (>= 5 seconds -> Move to Step 4)
            if (user.step === BotStep.STEP_3 && elapsedSecs >= 5 && !user.isBlocked) {
              addSystemLog('worker', `CRON EXEC: Running 5-second check. SELECT FOR UPDATE row of user ${user.userId}`);
              
              setTimeout(() => {
                setWorkerLogs(w => [
                  ...w,
                  {
                    id: w.length + 1,
                    userId: user.userId,
                    actionType: 'send_media_group',
                    createdAt: new Date().toISOString()
                  }
                ]);
                addSystemLog('worker', `DATABASE COMMIT: Marked user ${user.userId} -> Step 4 (action_timestamp updated). Flow complete.`);
                addSystemLog('webhook', `DISPATCH CURL: sendMediaGroup to User Chat ${user.userId} (4 Images Album + Welcome code)`);
              }, 100);

              return {
                ...updatedUser,
                step: BotStep.STEP_4,
                actionTimestamp: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            }

            return updatedUser;
          });
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoTick, users]);

  // Simulate User joining channel
  const handleSimulateJoin = (e: FormEvent) => {
    e.preventDefault();
    const fName = newUserFirstName.trim() || 'Guest';
    const uName = newUserUsername.trim() ? newUserUsername.trim().toLowerCase() : fName.toLowerCase() + '_user';
    const cleanUName = uName.startsWith('@') ? uName.slice(1) : uName;
    const generatedUserId = Math.floor(100000000 + Math.random() * 900000000);

    // Sequence check log entries
    addSystemLog('webhook', `[Webhook Catch] Received chat_member update for ${fName} (@${cleanUName}). status=member`);
    addSystemLog('webhook', `PRE-FLIGHT CHECK: Query user_id = ${generatedUserId}. Record missing.`);
    
    // Create DB entry
    const newRecord: SimulatedUser = {
      id: users.length + 1,
      userId: generatedUserId,
      username: cleanUName,
      firstName: fName,
      step: BotStep.STEP_1,
      actionTimestamp: new Date().toISOString(),
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      joinedSimSecsAgo: 0
    };

    setUsers(prev => [...prev, newRecord]);
    setSelectedUserForChat(newRecord.userId);
    setNewUserFirstName('');
    setNewUserUsername('');

    setTimeout(() => {
      addSystemLog('webhook', `DATABASE ROW INSERTED. step = 1, user_id = ${generatedUserId}, action_timestamp = NOW()`);
      addSystemLog('webhook', `DISPATCH CURL: sendMessage with inline button '🎁 GET BONUS'`);
    }, 150);
  };

  // Simulate Clicking Get Bonus
  const handleGetBonusClick = (userId: number, callbackIdStr: string) => {
    addSystemLog('webhook', `[Webhook Catch] Received callback_query for User ID ${userId}. action=get_bonus`);
    addSystemLog('webhook', `TRANSACTION BEGIN: Locking row for user_id = ${userId} (SELECT FOR UPDATE)`);

    setUsers(currentUsers => {
      const match = currentUsers.find(u => u.userId === userId);
      if (!match) return currentUsers;

      if (match.step !== BotStep.STEP_1) {
        addSystemLog('webhook', `TRANSACTION ROLLBACK/IGNORE: Click blocked. User is in active step ${match.step} (Double-click shielded)`);
        return currentUsers;
      }

      // Update state
      setTimeout(() => {
        setCallbackLogs(prev => [
          ...prev,
          {
            id: prev.length + 1,
            userId,
            callbackData: 'get_bonus',
            createdAt: new Date().toISOString()
          }
        ]);
        addSystemLog('webhook', `DATABASE UPDATE COMMIT: step = 2, action_timestamp = NOW()`);
        addSystemLog('webhook', `DISPATCH CURL: sendPhoto with READY BELOW redirect URL (Image #1)`);
      }, 100);

      return currentUsers.map(u => {
        if (u.userId === userId) {
          return {
            ...u,
            step: BotStep.STEP_2,
            actionTimestamp: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        return u;
      });
    });
  };

  // Simulate custom Start command triggers
  const handleSendCommand = (userId: number, commandStr: string) => {
    const text = commandStr.trim();
    if (!text) return;

    addSystemLog('webhook', `[Webhook Catch] Received message from User ID ${userId}: '${text}'`);

    if (text.toUpperCase() === '/START') {
      addSystemLog('webhook', `SLASH COMMAND DETECTED: Redirect update triggered.`);
      
      setUsers(currentUsers => {
        return currentUsers.map(u => {
          if (u.userId === userId) {
            return {
              ...u,
              // Keep the current step but record is updated
              updatedAt: new Date().toISOString()
            };
          }
          return u;
        });
      });

      setTimeout(() => {
        addSystemLog('webhook', `DISPATCH CURL: sendMessage pointing to @Anita_Desai_here`);
      }, 150);
    } else {
      addSystemLog('webhook', `INFO: Unhandled free text received. Moving on.`);
    }

    // Capture start chats
    setChatMessageInput('');
  };

  // Reset core simulation state
  const handleResetSimulation = () => {
    setUsers([
      {
        id: 1,
        userId: 748192039,
        username: "arjun_mehta",
        firstName: "Arjun",
        step: BotStep.STEP_4,
        actionTimestamp: new Date(Date.now() - 45000).toISOString(),
        isBlocked: false,
        createdAt: new Date(Date.now() - 120000).toISOString(),
        updatedAt: new Date(Date.now() - 45500).toISOString(),
        joinedSimSecsAgo: 120
      },
      {
        id: 2,
        userId: 618293049,
        username: "rohan_s",
        firstName: "Rohan",
        step: BotStep.STEP_1,
        actionTimestamp: new Date(Date.now() - 1000).toISOString(),
        isBlocked: false,
        createdAt: new Date(Date.now() - 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1000).toISOString(),
        joinedSimSecsAgo: 1
      },
      {
        id: 3,
        userId: 509281726,
        username: "priya_sharma",
        firstName: "Priya",
        step: BotStep.STEP_2,
        actionTimestamp: new Date(Date.now() - 35000).toISOString(),
        isBlocked: false,
        createdAt: new Date(Date.now() - 40000).toISOString(),
        updatedAt: new Date(Date.now() - 35000).toISOString(),
        joinedSimSecsAgo: 40
      }
    ]);
    setCallbackLogs([
      {
        id: 1,
        userId: 509281726,
        callbackData: 'get_bonus',
        createdAt: new Date(Date.now() - 35000).toISOString()
      }
    ]);
    setWorkerLogs([
      {
        id: 1,
        userId: 748192039,
        actionType: 'send_salary_message',
        createdAt: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: 2,
        userId: 748192039,
        actionType: 'send_media_group',
        createdAt: new Date(Date.now() - 45000).toISOString()
      }
    ]);
    setSystemLogs([
      {
        id: 1,
        timestamp: new Date().toISOString(),
        type: 'webhook',
        message: 'Simulation state successfully re-seeded and refreshed.'
      }
    ]);
    setSelectedUserForChat(2);
  };

  // Copy code handler
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Download PHP files as standard text payload
  const downloadCodeFile = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Find active chat user
  const activeChatUser = useMemo(() => {
    return users.find(u => u.userId === selectedUserForChat);
  }, [users, selectedUserForChat]);

  // Construct Mock Messages chronologically based on Step & Start triggers
  const chatMessagesOfSelectedUser = useMemo(() => {
    if (!activeChatUser) return [];

    const messages = [];

    // All steps have the initial welcome message
    messages.push({
      sender: 'bot',
      text: `🎁 <b>Welcome!</b><br/><br/>Claim your bonus below. 👇`,
      timestamp: activeChatUser.createdAt,
      replyMarkup: activeChatUser.step === BotStep.STEP_1 ? 'get_bonus' : null
    });

    // Step 2 has the first photo message
    if (activeChatUser.step === BotStep.STEP_2) {
      messages.push({
        sender: 'user',
        text: '<i>[Action: Clicked 🎁 GET BONUS Button]</i>',
        timestamp: activeChatUser.actionTimestamp
      });
      messages.push({
        sender: 'bot',
        image: 'https://i.ibb.co/1Y39dQgM/IMG-20260604-WA0020.jpg',
        text: `If you're looking for <b>"quick and easy,"</b><br/>you're not looking for me.<br/><br/>👛🔄 But if you're ready for the real working system,<br/>click <b>READY</b> below⤵️`,
        timestamp: activeChatUser.actionTimestamp,
        urlButton: { text: 'READY BELOW', url: 'https://t.me/Anita_Desai_here' }
      });
    }

    // Step 3 or greater has the salary message
    if (activeChatUser.step === BotStep.STEP_3 || activeChatUser.step === BotStep.STEP_4) {
      messages.push({
        sender: 'bot',
        image: 'https://i.ibb.co/4nYtsQ6z/IMG-20260604-WA0019.jpg',
        text: `💵➕💰 <b>Start building a supplemental income to your salary or pension today</b><br/><br/>Its, will you start now or in a year?`,
        timestamp: new Date(new Date(activeChatUser.createdAt).getTime() + 10000).toISOString() // 10s gap
      });
    }

    // Step 4 has the media group message
    if (activeChatUser.step === BotStep.STEP_4) {
      messages.push({
        sender: 'bot',
        album: [
          'https://i.ibb.co/whR6Hdpg/IMG-20260604-WA0015.jpg',
          'https://i.ibb.co/8QZqWVT/IMG-20260604-WA0018.jpg',
          'https://i.ibb.co/7JrfWntY/IMG-20260604-WA0016.jpg',
          'https://i.ibb.co/9kJ5z8sB/IMG-20260604-WA0017.jpg'
        ],
        text: `🧿 <b>Activate code NEW-1 to join with a welcome bonus!</b><br/><br/>Best conditions and bonuses already available to you!<br/><br/>Click /START to continue!`,
        timestamp: new Date(new Date(activeChatUser.createdAt).getTime() + 15000).toISOString() // 5s more
      });
    }

    // If they did /START command simulation
    // We judge if updatedAt is more recent than actionTimestamp when they are in Step 2 or Step 4
    const updatedTime = new Date(activeChatUser.updatedAt).getTime();
    const createdTime = new Date(activeChatUser.createdAt).getTime();
    if (updatedTime > createdTime && (activeChatUser.step === BotStep.STEP_2 || activeChatUser.step === BotStep.STEP_4)) {
      messages.push({
        sender: 'user',
        text: '/START',
        timestamp: activeChatUser.updatedAt
      });
      messages.push({
        sender: 'bot',
        text: `👋🏻 <b>I have a quick update for you.</b><br/><br/>Please message me privately👉🏻<br/><br/><a href="https://t.me/Anita_Desai_here" target="_blank" rel="noreferrer" class="text-blue-400 underline font-medium">@Anita_Desai_here</a>`,
        timestamp: activeChatUser.updatedAt
      });
    }

    return messages;
  }, [activeChatUser]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-blue-600 selection:text-white" id="main_wrapper">
      
      {/* Upper Navigation Control Room Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4" id="header_nav">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2.5 rounded-lg text-white" id="logo_container">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white flex items-center gap-2">
              Telegram Funnel Bot Hub
              <span className="text-[10px] font-mono py-0.5 px-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                PHP Core + MySQL
              </span>
            </h1>
            <p className="text-xs text-slate-400">Enterprise Deterministic Sequence Automation Console</p>
          </div>
        </div>

        {/* Global tab controllers */}
        <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs" id="nav_tabs">
          {[
            { id: 'simulator', label: 'Interactive Simulator', icon: Sliders },
            { id: 'code', label: 'Source Code Files', icon: FileCode },
            { id: 'database', label: 'Database Tables', icon: Database },
            { id: 'logs', label: 'System Logs', icon: Terminal },
            { id: 'architecture', label: 'Technical Flow', icon: Info },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                id={`tab_btn_${tab.id}`}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all ${
                  isSelected 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action resets */}
        <div className="flex items-center space-x-2" id="header_actions">
          <button
            onClick={handleResetSimulation}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 transition-colors"
            title="Reset Simulation Schema and States"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset Hub</span>
          </button>
          
          <span className="h-4 w-[1px] bg-slate-800"></span>

          <div className="flex items-center text-xs space-x-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Daemon:</span>
            <span className={`inline-block h-2 w-2 rounded-full ${autoTick ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></span>
            <span className="font-mono text-[11px] text-slate-200 font-bold">{autoTick ? 'ACTIVE' : 'IDLE'}</span>
          </div>
        </div>
      </header>

      {/* Main Container Viewport */}
      <main className="flex-1 flex flex-col min-w-0" id="main_container">
        <AnimatePresence mode="wait">
          
          {/* ========================================================
              TAB: SIMULATION CONTROL CENTER
              ======================================================== */}
          {activeTab === 'simulator' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              key="simulator-panel"
              className="p-4 md:p-6 flex-1 flex flex-col gap-6"
              id="simulator_tab_view"
            >
              {/* Top Banner Alert explaining how actions process */}
              <div className="bg-slate-900 border border-slate-800 text-slate-300 p-5 rounded-2xl flex items-start space-x-4 shadow-sm">
                <Sparkles className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-white font-bold text-sm tracking-tight">How the Funnel Works Deterministically</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    When a user triggers a <b className="text-blue-400">Join Event</b>, they enter <b className="text-white font-semibold">Step 1</b> and get the bonus button. 
                    If they click <b className="text-white font-semibold">GET BONUS</b>, they jump straight to <b className="text-emerald-400 font-semibold">Step 2</b> (getting the Direct link <code>@Anita_Desai_here</code>) and skip the worker sequence.
                    If they do not click, the <i>cron daemon</i> wakes up at <b className="text-white font-semibold">10 seconds</b> to send them <b className="text-amber-400 font-semibold">Step 3</b> (Salary), then at <b className="text-white font-semibold">5 seconds</b> more to send <b className="text-violet-400">Step 4</b> (Media Group).
                  </p>
                </div>
              </div>

              {/* Grid split - User Lists, Flow Config, and Live Telegram Chat simulation */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
                
                {/* Simulated Users & Flow Control panel */}
                <div className="lg:col-span-7 flex flex-col space-y-6">
                  
                  {/* Join trigger form */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm" id="sim_join_trigger">
                    <h3 className="text-sm font-bold text-white mb-3.5 flex items-center space-x-2">
                       <UserPlus className="h-4 w-4 text-blue-400" />
                       <span className="tracking-tight text-slate-100">Simulate Webhook Trigger (User Joins)</span>
                    </h3>
                    
                    <form onSubmit={handleSimulateJoin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wider">First Name</label>
                        <input
                          type="text"
                          required
                          value={newUserFirstName}
                          onChange={e => setNewUserFirstName(e.target.value)}
                          placeholder="e.g. Vikram"
                          className="w-full text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wider">Username (Optional)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-slate-600 text-xs">@</span>
                          <input
                            type="text"
                            value={newUserUsername}
                            onChange={e => setNewUserUsername(e.target.value)}
                            placeholder="vikram_singh"
                            className="w-full text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                          />
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
                        >
                          <Send className="h-3 w-3" />
                          <span>Join Channel</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Active Users Table and State grid */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex-1 flex flex-col shadow-sm" id="sim_users_table">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                           <DatabaseZap className="h-4 w-4 text-indigo-400" />
                           <span className="tracking-tight text-slate-100">Simulated Database State Table (<code>users</code>)</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Select a user to review their chronological chat funnel view</p>
                      </div>
                      
                      {/* Daemon control toggle */}
                      <button
                        onClick={() => setAutoTick(!autoTick)}
                        className={`text-[11px] font-bold px-3 py-2 rounded-xl border flex items-center space-x-1.5 transition-all ${
                          autoTick 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {autoTick ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        <span>{autoTick ? 'Pause PHP Cron' : 'Start PHP Cron'}</span>
                      </button>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                            <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">User Reference</th>
                            <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Current State Machine Step</th>
                            <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Timer State</th>
                            <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px] text-right">Interaction Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                                No active database records present. Trigger a join event above to populate!
                              </td>
                            </tr>
                          ) : (
                            users.slice().reverse().map(user => {
                              const isInspected = selectedUserForChat === user.userId;
                              
                              // Check timer seconds
                              const actionMs = new Date(user.actionTimestamp).getTime();
                              const secondsElapsed = Math.floor((Date.now() - actionMs) / 1000);

                              return (
                                <tr 
                                  key={user.userId} 
                                  onClick={() => setSelectedUserForChat(user.userId)}
                                  className={`cursor-pointer transition-colors group ${
                                    isInspected 
                                      ? 'bg-blue-500/5 hover:bg-blue-500/10 border-l-2 border-l-blue-500' 
                                      : 'hover:bg-slate-900/40'
                                  }`}
                                >
                                  <td className="py-3.5 px-4">
                                    <div className="font-bold text-slate-100 flex items-center space-x-1">
                                      <span>{user.firstName}</span>
                                      {user.username && <span className="text-[10px] text-slate-500 font-normal">(@{user.username})</span>}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500">ID: {user.userId}</div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center space-x-2">
                                      <span className={`inline-block py-0.5 px-2 rounded-lg font-mono text-[10px] font-bold ${
                                        user.step === BotStep.STEP_1 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                        user.step === BotStep.STEP_2 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        user.step === BotStep.STEP_3 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                        'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                      }`}>
                                        Step {user.step}
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-300">
                                        {user.step === BotStep.STEP_1 && 'Welcome (Standby)'}
                                        {user.step === BotStep.STEP_2 && 'Bonus Clicked (Done)'}
                                        {user.step === BotStep.STEP_3 && 'Salary Msg Sent'}
                                        {user.step === BotStep.STEP_4 && 'Media Album Complete'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 font-mono text-[11px]">
                                    {user.step === BotStep.STEP_1 ? (
                                      <span className="text-slate-400 font-semibold">
                                        Salary trigger: {Math.max(0, 10 - secondsElapsed)}s left
                                      </span>
                                    ) : user.step === BotStep.STEP_3 ? (
                                      <span className="text-amber-400 font-semibold">
                                        Album trigger: {Math.max(0, 5 - secondsElapsed)}s left
                                      </span>
                                    ) : (
                                      <span className="text-emerald-500 font-bold flex items-center space-x-1">
                                        <span>Completed</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <div className="flex items-center justify-end space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Inspect</span>
                                      <ChevronRight className="h-3.5 w-3.5 text-blue-400" />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Step Visual Progression Path Mapper */}
                    {activeChatUser && (
                      <div className="mt-5 pt-4 border-t border-slate-800" id="state_progression_line">
                        <div className="text-[11px] font-bold text-slate-100 uppercase tracking-wider mb-3">
                          State Progression of {activeChatUser.firstName}:
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px]" id="step_stepper">
                          
                          {/* Welcome */}
                          <div className={`p-2.5 rounded-xl border transition-all ${
                            activeChatUser.step >= BotStep.STEP_1
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold shadow-[0_0_12px_rgba(59,130,246,0.05)]' 
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}>
                            <div className="font-bold">Step 1</div>
                            <div className="text-[9px] font-medium">Welcome</div>
                          </div>

                          {/* Bonus Click OR Delay */}
                          {activeChatUser.step === BotStep.STEP_2 ? (
                            <div className="col-span-3 p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center space-x-2 shadow-[0_0_12px_rgba(16,185,129,0.05)]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Step 2 Conversion Complete (Clicked Bonus, Redirected privately)</span>
                            </div>
                          ) : (
                            <>
                              {/* Step 3 (Salary) */}
                              <div className={`p-2.5 rounded-xl border transition-all ${
                                activeChatUser.step >= BotStep.STEP_3
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 font-bold shadow-[0_0_12px_rgba(245,158,11,0.05)]' 
                                  : 'bg-slate-950 border-slate-800 text-slate-500'
                              }`}>
                                <div className="font-bold">Step 3</div>
                                <div className="text-[9px] font-medium">Salary Msg</div>
                              </div>

                              {/* Step 4 (Media Album) */}
                              <div className={`p-2.5 rounded-xl border transition-all ${
                                activeChatUser.step >= BotStep.STEP_4
                                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 font-bold shadow-[0_0_12px_rgba(139,92,246,0.05)]' 
                                  : 'bg-slate-950 border-slate-800 text-slate-500'
                              }`}>
                                <div className="font-bold">Step 4</div>
                                <div className="text-[9px] font-medium">Media Group</div>
                              </div>

                              {/* Redirect End */}
                              <div className={`p-2.5 rounded-xl border ${
                                activeChatUser.step === BotStep.STEP_4
                                  ? 'bg-white/10 border-white/20 text-white font-bold animate-pulse' 
                                  : 'bg-slate-950 border-slate-800 text-slate-500'
                              }`}>
                                <div className="font-bold">/START</div>
                                <div className="text-[9px] font-medium">Final Chat</div>
                              </div>
                            </>
                          )}

                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Simulated Telegram Screen */}
                <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl" id="telegram_terminal_wrapper">
                  
                  {/* Premium Telegram Header bar */}
                  <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between" id="telegram_hub_header">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#24a1de] shadow-[0_0_8px_rgba(36,161,222,0.6)]"></div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <span>Simulated Telegram Client</span>
                          <span className="py-0.5 px-2 bg-blue-600/10 text-blue-400 text-[9px] font-bold border border-blue-500/20 rounded-full">
                            Client-Side
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {activeChatUser ? `Inspecting Chat: ${activeChatUser.firstName}` : 'No active member selected'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center text-[10px] font-mono text-slate-400">
                      <span>@Anita_Desai_here</span>
                    </div>
                  </div>

                  {/* Message scroll list */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950 min-h-[350px] max-h-[460px] flex flex-col justify-end">
                    {activeChatUser ? (
                      <>
                        {chatMessagesOfSelectedUser.map((msg, idx) => {
                          const isBot = msg.sender === 'bot';
                          return (
                            <div 
                              key={idx} 
                              className={`flex flex-col max-w-[85%] ${
                                isBot ? 'self-start' : 'self-end items-end'
                              }`}
                            >
                              {/* Avatar label */}
                              <span className="text-[9px] text-slate-500 mb-1 font-semibold px-1">
                                {isBot ? '🛡 Anita Funnel Bot' : `👤 ${activeChatUser.firstName}`}
                              </span>

                              {/* Message bubble card */}
                              <div className={`p-4 rounded-2xl text-xs space-y-2.5 shadow-sm text-slate-200 ${
                                isBot 
                                  ? 'bg-slate-900 border border-slate-800 rounded-tl-sm' 
                                  : 'bg-blue-600/10 border border-blue-500/20 rounded-tr-sm text-slate-200'
                              }`}>
                                
                                {/* Photo image attachment */}
                                {msg.image && (
                                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black">
                                    <img 
                                      src={msg.image} 
                                      alt="Telegram Funnel Attachment" 
                                      className="w-full object-cover max-h-[160px]"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-[9px] px-1.5 py-0.5 rounded-md text-slate-300 font-bold font-mono">
                                      Photo
                                    </span>
                                  </div>
                                )}

                                {/* Media Group multiple attachment */}
                                {msg.album && (
                                  <div className="space-y-1">
                                    <span className="text-[9px] uppercase font-bold font-mono tracking-widest text-slate-500 block">
                                      Media Group Album (4 Photos Attached)
                                    </span>
                                    <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-slate-800 bg-black">
                                      {msg.album.map((img, i) => (
                                        <img 
                                          key={i}
                                          src={img} 
                                          alt={`Album Part ${i}`} 
                                          className="w-full max-h-[70px] object-cover h-14"
                                          referrerPolicy="no-referrer"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Rich HTML-based text content */}
                                <p className="leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.text }} />

                                {/* Action keyboard buttons */}
                                {msg.replyMarkup === 'get_bonus' && (
                                  <button
                                    onClick={() => handleGetBonusClick(activeChatUser.userId, 'get_bonus')}
                                    className="w-full mt-1 bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl font-bold text-center transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)] flex items-center justify-center space-x-1 border border-amber-500/10 cursor-pointer text-xs"
                                  >
                                    <span>🎁 GET BONUS</span>
                                  </button>
                                )}

                                {msg.urlButton && (
                                  <a
                                    href={msg.urlButton.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full mt-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-center transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] flex items-center justify-center space-x-1.5 border border-blue-500/10 cursor-pointer text-xs"
                                  >
                                    <span>{msg.urlButton.text}</span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}

                              </div>

                              {/* Message time indicator */}
                              <span className="text-[8px] text-slate-600 mt-1 pr-1 font-mono">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                        <MessageSquare className="h-10 w-10 text-slate-800 mb-2" />
                        <p className="text-xs">Select a user to display their funnel state in real-time</p>
                      </div>
                    )}
                  </div>

                  {/* Message command sender trigger */}
                  <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3" id="telegram_chat_controls">
                    {activeChatUser ? (
                      <div className="space-y-2">
                        {/* Interactive trigger helpers */}
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => handleSendCommand(activeChatUser.userId, '/START')}
                            className="bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800 text-[10px] font-mono py-1.5 px-3 rounded-full transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <span>Trigger command: /START</span>
                          </button>
                          
                          {activeChatUser.step === BotStep.STEP_1 && (
                            <button
                              onClick={() => handleGetBonusClick(activeChatUser.userId, 'get_bonus')}
                              className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-[10px] font-mono py-1.5 px-3 rounded-full transition-colors flex items-center space-x-1 cursor-pointer"
                            >
                              <span>Click Callback: get_bonus</span>
                            </button>
                          )}
                        </div>

                        {/* Text form input simulation */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={chatMessageInput}
                            onChange={e => setChatMessageInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendCommand(activeChatUser.userId, chatMessageInput)}
                            placeholder="Type a custom message or try /START command..."
                            className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                          />
                          <button
                            onClick={() => handleSendCommand(activeChatUser.userId, chatMessageInput)}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl transition-all h-10 w-10 flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-[11px] text-slate-500 py-2">
                        Register or pick a simulator candidate to write mock updates.
                      </div>
                    )}
                  </div>

                </div>

              </div>
              
              {/* Live Reactive Console Terminal (Webhook + Worker logs) */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col mt-6 shadow-sm" id="simulator_terminal">
                <div className="bg-slate-900/50 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    <span className="text-[11px] font-mono font-bold text-slate-200">Continuous Execution Logs (Webhook + Worker Engine)</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
                    <span className="font-mono font-bold">SYSTEM_POLLING_LIVE</span>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-950 font-mono text-[10.5px] text-slate-300 space-y-1.5 h-[140px] overflow-y-auto max-h-[140px]">
                  {systemLogs.map((log) => {
                    const isWorker = log.type === 'worker';
                    const isError = log.type === 'error';
                    return (
                      <div key={log.id} className="flex items-start space-x-2">
                        <span className="text-slate-600 flex-shrink-0 font-medium">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={`font-bold flex-shrink-0 ${
                          isWorker ? 'text-amber-400' : isError ? 'text-rose-400' : 'text-blue-400'
                        }`}>
                          {isWorker ? '[cron-timer]' : isError ? '[system-err]' : '[webhook-in]'}
                        </span>
                        <span className={isError ? 'text-rose-350' : 'text-slate-300'}>{log.message}</span>
                      </div>
                    );
                  })}
                  <div ref={terminalEndRef} />
                </div>
              </div>

            </motion.div>
          )}

          {/* ========================================================
              TAB: SOURCE CODE VIEWER
              ======================================================== */}
          {activeTab === 'code' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              key="code-panel"
              className="p-4 md:p-6 flex-1 flex flex-col gap-5 h-full"
              id="code_tab_view"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1">
                
                {/* File side selector */}
                <div className="lg:col-span-3 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
                    Project File Tree
                  </div>
                  
                  {Object.entries(phpFiles).map(([filename, data]) => {
                    const isSelected = activeCodeFile === filename;
                    return (
                      <button
                        key={filename}
                        onClick={() => {
                          setActiveCodeFile(filename as ActiveCodeFile);
                          setCopiedCode(false);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start space-x-2.5 ${
                          isSelected 
                            ? 'bg-blue-600/10 text-blue-400 border-blue-500/35 font-semibold shadow-xs' 
                            : 'bg-slate-900 text-slate-400 border-slate-800/80 hover:bg-slate-900/60 hover:text-white hover:border-slate-800'
                        }`}
                      >
                        <FileText className={`h-4.5 w-4.5 flex-shrink-0 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                        <div>
                          <div className="text-xs font-semibold font-mono">{filename}</div>
                          <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {data.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  <div className="pt-5 px-1 text-xs text-slate-500 space-y-2.5 border-t border-slate-800 mt-5">
                    <p className="flex items-center space-x-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span className="text-white font-medium">Production Approved</span>
                    </p>
                    <p className="leading-relaxed">
                      Every file compiles natively inside standard clean PHP 8.2 environments under traditional Apache/Nginx web hosting setups.
                    </p>
                  </div>
                </div>

                {/* Main Code presentation screen */}
                <div className="lg:col-span-9 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  
                  {/* Action row */}
                  <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="inline-block py-0.5 px-2.5 bg-blue-600/10 text-blue-400 font-mono text-[10px] rounded-full border border-blue-500/20 font-bold">
                        {phpFiles[activeCodeFile].lang.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono font-semibold text-white">/project-root/{activeCodeFile}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(phpFiles[activeCodeFile].val)}
                        className="flex items-center space-x-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] cursor-pointer"
                      >
                        {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
                      </button>

                      <button
                        onClick={() => downloadCodeFile(activeCodeFile, phpFiles[activeCodeFile].val)}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer font-bold"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Preloaded code container style */}
                  <div className="flex-1 p-5 bg-slate-950 overflow-auto select-text">
                    <pre className="font-mono text-xs leading-relaxed text-slate-300 whitespace-pre select-text">
                      <code className="select-text">{phpFiles[activeCodeFile].val}</code>
                    </pre>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* ========================================================
              TAB: HARDWARE SQL DATABASE TABLES
              ======================================================== */}
          {activeTab === 'database' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              key="database-panel"
              className="p-4 md:p-6 flex-1 flex flex-col gap-6"
              id="database_tab_view"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-md font-bold text-white flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-400" />
                    <span>Post-setup MySQL Regional Engine Sandbox</span>
                  </h2>
                  <p className="text-xs text-slate-400">Review active state tracking, indexes, callbacks, and cron action traces</p>
                </div>

                <div className="flex space-x-1 text-xs">
                  {[
                    { id: 'users', label: 'users table' },
                    { id: 'callback_logs', label: 'callback_logs' },
                    { id: 'worker_logs', label: 'worker_logs' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDbTable(tab.id as ActiveDbTable)}
                      className={`px-3.5 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
                        activeDbTable === tab.id 
                          ? 'bg-blue-600/10 text-blue-400 border-blue-500/25' 
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Database presentation screen table layout */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                
                {activeDbTable === 'users' && (
                  <div>
                    <div className="p-4 bg-slate-950 border-b border-slate-800">
                      <span className="font-mono text-xs text-slate-350 font-bold">SELECT * FROM users;</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-800 bg-slate-900/50 font-bold">
                            <th className="p-3">id</th>
                            <th className="p-3">user_id</th>
                            <th className="p-3">username</th>
                            <th className="p-3">first_name</th>
                            <th className="p-3">step</th>
                            <th className="p-3">action_timestamp</th>
                            <th className="p-3">is_blocked</th>
                            <th className="p-3">created_at</th>
                            <th className="p-3">updated_at</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                          {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-950/40">
                              <td className="p-3 text-slate-400">{u.id}</td>
                              <td className="p-3 text-blue-400 font-bold">{u.userId}</td>
                              <td className="p-3">@{u.username || 'NULL'}</td>
                              <td className="p-3 text-slate-200">{u.firstName}</td>
                              <td className="p-3 text-center">
                                <span className="text-slate-200 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                                  {u.step}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400">{new Date(u.actionTimestamp).toLocaleTimeString()}</td>
                              <td className="p-3 text-center">{u.isBlocked ? '1' : '0'}</td>
                              <td className="p-3 text-slate-500">{new Date(u.createdAt).toLocaleTimeString()}</td>
                              <td className="p-3 text-slate-500">{new Date(u.updatedAt).toLocaleTimeString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeDbTable === 'callback_logs' && (
                  <div>
                    <div className="p-4 bg-slate-950 border-b border-slate-800">
                      <span className="font-mono text-xs text-slate-350 font-bold">SELECT * FROM callback_logs;</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-800 bg-slate-900/50 font-bold">
                            <th className="p-3">id</th>
                            <th className="p-3">user_id</th>
                            <th className="p-3">callback_data</th>
                            <th className="p-3">created_at</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                          {callbackLogs.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-500 font-semibold bg-slate-950">
                                Empty set: Click 🎁 GET BONUS in the simulator to record callback queries.
                              </td>
                            </tr>
                          ) : (
                            callbackLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-950/40">
                                <td className="p-3 text-slate-400">{log.id}</td>
                                <td className="p-3 text-blue-400 font-bold">{log.userId}</td>
                                <td className="p-3 text-amber-400 font-bold">{log.callbackData}</td>
                                <td className="p-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeDbTable === 'worker_logs' && (
                  <div>
                    <div className="p-4 bg-slate-950 border-b border-slate-800">
                      <span className="font-mono text-xs text-slate-350 font-bold">SELECT * FROM worker_logs;</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-800 bg-slate-900/50 font-bold">
                            <th className="p-3">id</th>
                            <th className="p-3">user_id</th>
                            <th className="p-3">action_type</th>
                            <th className="p-3">created_at</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                          {workerLogs.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-500 font-semibold bg-slate-950">
                                Empty set: Wait for stagnant step-1/step-3 users to be processed by PHP timer_worker.
                              </td>
                            </tr>
                          ) : (
                            workerLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-950/40">
                                <td className="p-3 text-slate-400">{log.id}</td>
                                <td className="p-3 text-blue-400 font-bold">{log.userId}</td>
                                <td className="p-3 text-purple-400">{log.actionType}</td>
                                <td className="p-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* ========================================================
              TAB: DEDICATED LOGS SCREEN
              ======================================================== */}
          {activeTab === 'logs' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              key="logs-panel"
              className="p-4 md:p-6 flex-1 flex flex-col gap-5"
              id="logs_tab_view"
            >
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-md font-bold text-white mb-1 flex items-center space-x-2">
                  <Terminal className="h-5 w-5 text-blue-400" />
                  <span>Interactive System Daemon Logs File System</span>
                </h2>
                <p className="text-xs text-slate-400">Examine continuous file-level outputs in real-time as they write to <code>/logs/</code></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
                {/* webhook.log */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                  <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between animate-pulse">
                    <span className="text-xs font-mono font-bold text-white">logs/webhook.log</span>
                    <span className="text-[10px] font-bold text-blue-400 font-mono">APPEND_ONLY</span>
                  </div>
                  <div className="p-5 bg-slate-950 flex-1 font-mono text-[10.5px] leading-relaxed text-blue-300 min-h-[250px] max-h-[400px] overflow-y-auto">
                    {systemLogs.filter(l => l.type === 'webhook' || l.type === 'error').map((log, index) => (
                      <div key={index} className="mb-2">
                        <span className="text-slate-600 font-medium">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                      </div>
                    ))}
                  </div>
                </div>

                {/* worker.log */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                  <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white">logs/worker.log</span>
                    <span className="text-[10px] font-bold text-amber-400 font-mono">APPEND_ONLY</span>
                  </div>
                  <div className="p-5 bg-slate-950 flex-1 font-mono text-[10.5px] leading-relaxed text-amber-300 min-h-[250px] max-h-[400px] overflow-y-auto">
                    {systemLogs.filter(l => l.type === 'worker' || l.type === 'error').map((log, index) => (
                      <div key={index} className="mb-2">
                        <span className="text-slate-600 font-medium">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              TAB: TECHNICAL PROCESS FLOW INFORMATION
              ======================================================== */}
          {activeTab === 'architecture' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              key="architecture-panel"
              className="p-4 md:p-6 flex-1 flex flex-col gap-6"
              id="architecture_tab_view"
            >
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-md font-bold text-white mb-1">Architectural Integrity Blueprint</h2>
                <p className="text-xs text-slate-400">Ensuring absolute duplicate prevention and race-condition safety under thousands of concurrent users</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="architectural_grid">
                
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 shadow-md">
                  <div className="h-8 w-8 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center font-bold font-mono">
                    01
                  </div>
                  <h4 className="text-sm font-bold text-white">I. Complete Transaction Isolation</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Whenever an event status transition is checked (worker evaluating Step 1 stagnant records or Webhook catching callback clicks), the database initializes a hard <b className="text-slate-200">START TRANSACTION</b> mode.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 shadow-md">
                  <div className="h-8 w-8 bg-blue-500/10 text-blue-300 rounded-xl flex items-center justify-center font-bold font-mono">
                    02
                  </div>
                  <h4 className="text-sm font-bold text-white">II. SELECT ... FOR UPDATE Locking</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Before verifying anything or changing state step columns, the exact record rows inside the MySQL table are locked completely using PDO prepared <code>SELECT FROM users WHERE user_id=? FOR UPDATE</code>.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 shadow-md">
                  <div className="h-8 w-8 bg-violet-500/10 text-violet-400 rounded-xl flex items-center justify-center font-bold font-mono">
                    03
                  </div>
                  <h4 className="text-sm font-bold text-white">III. State Mutation BEFORE CURL</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The database shifts the state first (setting step column to 2, 3 or 4 & updated actions) and finishes the TRANSACTION with a <b className="text-slate-200">COMMIT</b>. Only *after* database persistence completes, does the system trigger Telegram API cURL.
                  </p>
                </div>

              </div>

              {/* State Transition Matrix display */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md" id="state_table_info">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                  System State Transition Matrix Referencing
                </h4>
                
                <div className="overflow-hidden border border-slate-800 rounded-xl text-xs leading-relaxed shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                        <th className="p-3">Current User Step State</th>
                        <th className="p-3">Arriving Update Event</th>
                        <th className="p-3">System Action Performed</th>
                        <th className="p-3">Resulting Step State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono bg-slate-950/40 text-[11px] text-slate-350">
                      <tr>
                        <td className="p-3 text-slate-500">NULL (Unassigned)</td>
                        <td className="p-3 text-blue-400 font-semibold">User Joins Telegram Channel</td>
                        <td className="p-3">SQL Row Insert + Send Welcomer [🎁 GET BONUS]</td>
                        <td className="p-3"><span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 text-[10px]">1</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 text-blue-400 font-semibold">1</td>
                        <td className="p-3 text-emerald-400 font-semibold">User Clicks GET BONUS Inline Button</td>
                        <td className="p-3">Mark Step 2 + cURL Send Photo 1 [READY BELOW]</td>
                        <td className="p-3"><span className="text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">2</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 text-blue-400 font-semibold">1</td>
                        <td className="p-3 text-amber-400 font-semibold">10 Seconds Passes (Cron Detection)</td>
                        <td className="p-3">Mark Step 3 + cURL Send Photo 2 (Salary Msg)</td>
                        <td className="p-3"><span className="text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/20 text-[10px]">3</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 text-amber-400 font-semibold">3</td>
                        <td className="p-3 text-indigo-400 font-semibold">5 Seconds Passes (Cron Detection)</td>
                        <td className="p-3">Mark Step 4 + cURL Send Media Group (4 Images)</td>
                        <td className="p-3"><span className="text-indigo-400 font-bold bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-500/20 text-[10px]">4</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 text-indigo-400 font-semibold">4</td>
                        <td className="p-3 text-stone-300 font-semibold">/START Command</td>
                        <td className="p-3">cURL Send Redirection message to @Anita_Desai_here</td>
                        <td className="p-3">4 (Closed Funnel)</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-emerald-400 font-semibold">2</td>
                        <td className="p-3 text-stone-300 font-semibold">/START Command</td>
                        <td className="p-3">cURL Send Redirection message to @Anita_Desai_here</td>
                        <td className="p-3">2 (Closed Funnel)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Persistent Footer and Setup Help banner wrapper */}
      <footer className="bg-slate-950 px-6 py-5 border-t border-slate-850 text-center text-[11px] text-slate-500 flex flex-wrap justify-between gap-3 items-center" id="global_footer">
        <div>
          <span>Designed with absolute state integrity for Telegram Channel Funneling &copy; 2026.</span>
        </div>
        
        <div className="flex space-x-4">
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveTab('code'); }}
            className="hover:text-slate-350 font-bold transition-all"
          >
            Study Codebase
          </a>
          <span>&middot;</span>
          <a 
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('simulator'); }}
            className="hover:text-slate-350 font-bold transition-all"
          >
            Launch Debug Simulator
          </a>
        </div>
      </footer>

    </div>
  );
}
