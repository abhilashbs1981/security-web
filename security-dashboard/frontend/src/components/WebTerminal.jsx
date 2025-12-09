import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send } from 'lucide-react';

export default function WebTerminal() {
    const [output, setOutput] = useState('');
    const [command, setCommand] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);
    const endRef = useRef(null);

    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/terminal/ws`;

        console.log("Connecting to Terminal WS:", wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            setOutput(prev => prev + "--- Terminal Connected ---\n");
        };

        ws.onmessage = (event) => {
            const message = event.data;
            setOutput(prev => prev + message);
        };

        ws.onclose = () => {
            setIsConnected(false);
            setOutput(prev => prev + "\n--- Terminal Disconnected ---\n");
        };

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [output]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!command.trim() || !wsRef.current) return;

        setOutput(prev => prev + `$ ${command}\n`);
        wsRef.current.send(command);
        setCommand('');
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-800 shadow-2xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-400" />
                <span className="text-sm font-mono text-gray-400">Web Terminal (kubectl ready)</span>
                <span className={`ml-auto w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </div>

            <div className="flex-1 p-4 overflow-auto bg-gray-950">
                <pre className="font-mono text-sm text-gray-300 whitespace-pre">
                    {output}
                </pre>
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSend} className="p-2 bg-gray-800 border-t border-gray-700 flex gap-2">
                <span className="text-green-500 font-mono py-2 pl-2">$</span>
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white font-mono placeholder-gray-500"
                    placeholder="Enter command (e.g., kubectl get pods)"
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={!isConnected}
                    className="p-2 text-blue-400 hover:text-white disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
