import React, { useState } from 'react';
import { Play, Shield, Activity, Layers, Terminal } from 'lucide-react';

const SCAN_TYPES = [
    { id: 'kube-bench', label: 'Kube-Bench', icon: <Shield className="w-4 h-4" /> },
    { id: 'kyverno', label: 'Kyverno', icon: <Activity className="w-4 h-4" /> },
    { id: 'trivy-image', label: 'Trivy Image', icon: <Layers className="w-4 h-4" /> },
    { id: 'trivy-sbom', label: 'Trivy SBOM', icon: <Layers className="w-4 h-4" /> },
    { id: 'trivy-cluster', label: 'Trivy Cluster', icon: <Layers className="w-4 h-4" /> },
    { id: 'nmap', label: 'Nmap', icon: <Terminal className="w-4 h-4" /> },
];

export default function ScanControl({ onStartScan, isScanning }) {
    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Scan Controls
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {SCAN_TYPES.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => onStartScan(type.id)}
                        disabled={isScanning}
                        className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${isScanning
                            ? 'opacity-50 cursor-not-allowed bg-gray-700 border-gray-600'
                            : 'bg-gray-700/50 border-gray-600 hover:bg-blue-600/20 hover:border-blue-500'
                            }`}
                    >
                        <div className="p-2 bg-gray-700 rounded-md text-blue-400">
                            {type.icon}
                        </div>
                        <span className="font-medium">{type.label}</span>
                    </button>
                ))}
            </div>

            <button
                onClick={() => onStartScan('all')}
                disabled={isScanning}
                className={`w-full py-4 text-lg font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${isScanning
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20'
                    }`}
            >
                <Play className="w-5 h-5 fill-current" />
                Run All Scans
            </button>
        </div>
    );
}
