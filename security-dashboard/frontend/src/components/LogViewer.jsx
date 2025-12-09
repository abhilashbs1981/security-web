import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

export default function LogViewer({ logs }) {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-2xl flex flex-col h-full">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-mono text-gray-400">Live Logs</span>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1"
            >
                {logs.length === 0 ? (
                    <div className="text-gray-500 italic">Waiting for scan to start...</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="break-words whitespace-pre-wrap">
                            {log.startsWith('$') ? (
                                <span className="text-yellow-400 font-bold">{log}</span>
                            ) : log.startsWith('Error') ? (
                                <span className="text-red-400">{log}</span>
                            ) : log.includes('---') ? (
                                <span className="text-blue-400 font-bold">{log}</span>
                            ) : (
                                <span className="text-gray-300">{log}</span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
