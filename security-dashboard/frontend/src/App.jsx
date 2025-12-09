import React, { useState, useRef, useEffect } from 'react';
import ScanControl from './components/ScanControl';
import LogViewer from './components/LogViewer';
import ReportViewer from './components/ReportViewer';
import { ShieldAlert, LayoutDashboard, FileText } from 'lucide-react';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [currentScanId, setCurrentScanId] = useState(null);
    const wsRef = useRef(null);

    // Safe ID generator that works in all contexts (http/https/older browsers)
    const generateScanId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'scan-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    };

    const startScan = async (type) => {
        setIsScanning(true);
        setLogs([]); // Clear logs for new scan

        // Generate ID client-side to coordinate WS connection before trigger
        const scanId = generateScanId();
        setCurrentScanId(scanId);

        try {
            // 1. Connect WebSocket FIRST (with timeout)
            setLogs(prev => [...prev, "Initializing connection..."]);
            await connectWebSocket(scanId);

            // 2. TRIGGER the scan once connected
            setLogs(prev => [...prev, "Starting scan process..."]);
            const response = await fetch('/api/scans/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ scan_type: type, scan_id: scanId }),
            });

            if (!response.ok) {
                throw new Error(`Failed to start scan: ${response.statusText}`);
            }

        } catch (error) {
            console.error("Error starting scan:", error);
            setLogs(prev => [...prev, `Error: ${error.message}`]);
            setIsScanning(false);
            if (wsRef.current) wsRef.current.close();
        }
    };

    const connectWebSocket = (scanId) => {
        return new Promise((resolve, reject) => {
            // Close existing if open
            if (wsRef.current) {
                wsRef.current.close();
            }

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/api/scans/ws/${scanId}`;

            console.log("Connecting to WS:", wsUrl);
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            // Connection timeout safety
            const timeoutId = setTimeout(() => {
                if (ws.readyState !== WebSocket.OPEN) {
                    ws.close();
                    reject(new Error("Connection timed out (5s). Check network/backend."));
                }
            }, 5000);

            ws.onopen = () => {
                clearTimeout(timeoutId);
                setLogs(prev => [...prev, "--- Connection Established ---"]);
                resolve(ws);
            };

            ws.onmessage = (event) => {
                const message = event.data;
                if (message === "__EOF__") {
                    setLogs(prev => [...prev, "--- Scan Session Ended ---"]);
                    ws.close();
                    setIsScanning(false);
                } else {
                    // Smart Appending Logic for "Vertical Dots"
                    setLogs(prev => {
                        if (prev.length === 0) return [message];
                        const lastIndex = prev.length - 1;
                        const lastLog = prev[lastIndex];

                        // If message is just dots or continuation chars, append to last line
                        if (message.startsWith('.') || (lastLog && !lastLog.endsWith('\n') && message.length < 50)) {
                            // Simple heuristic: if short message starting with dot, append
                            // Or simply always append if it looks like a progress chunk
                            if (message.match(/^\.+$/)) {
                                const newLogs = [...prev];
                                newLogs[lastIndex] = lastLog + message;
                                return newLogs;
                            }
                        }
                        return [...prev, message];
                    });
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocket Error:", error);
                // Only reject if we haven't resolved yet
                // Use readyState to check if we are still connecting
                if (ws.readyState === WebSocket.CONNECTING) {
                    clearTimeout(timeoutId);
                    reject(new Error("WebSocket connection failed"));
                } else {
                    setLogs(prev => [...prev, "--- Connection Error ---"]);
                }
            };

            ws.onclose = () => {
                console.log("WebSocket Disconnected");
            };
        });
    };

    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 p-4 shadow-md">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-blue-500" />
                        <h1 className="text-2xl font-bold tracking-tight">SecurityOps Dashboard</h1>
                    </div>
                    <nav className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Reports
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto p-6">
                {activeTab === 'dashboard' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <ScanControl onStartScan={startScan} isScanning={isScanning} />

                            <div className="mt-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                                <h3 className="text-lg font-semibold mb-2 text-gray-300">System Status</h3>
                                <div className="flex items-center gap-2 text-green-400">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    Operational
                                </div>
                                <p className="text-sm text-gray-500 mt-2">Backend connected</p>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <LogViewer logs={logs} />
                        </div>
                    </div>
                ) : (
                    <ReportViewer />
                )}
            </main>
        </div>
    );
}

export default App;
