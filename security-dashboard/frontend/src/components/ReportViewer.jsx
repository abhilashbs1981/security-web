import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, XCircle, Clock, ChevronDown, Download } from 'lucide-react';

export default function ReportViewer() {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/reports/');
            const data = await res.json();
            setReports(data);
        } catch (err) {
            console.error("Failed to fetch reports:", err);
        }
    };

    const loadReportDetails = async (id) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/${id}`);
            const data = await res.json();
            setSelectedReport(data);
        } catch (err) {
            console.error("Failed to load report:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl overflow-hidden min-h-[500px]">
            <div className="grid grid-cols-3 h-full">
                {/* Sidebar List */}
                <div className="col-span-1 border-r border-gray-700 bg-gray-800/50">
                    <div className="p-4 border-b border-gray-700">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Scan History
                        </h3>
                    </div>
                    <div className="overflow-y-auto max-h-[600px]">
                        {reports.map((report) => (
                            <button
                                key={report.id}
                                onClick={() => loadReportDetails(report.id)}
                                className={`w-full text-left p-4 border-b border-gray-700 hover:bg-gray-700 transition-colors ${selectedReport?.id === report.id ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                                    }`}
                            >
                                <div className="font-medium text-blue-400 capitalize mb-1">
                                    {report.scan_type || 'Unknown Scan'}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(report.timestamp).toLocaleString()}
                                </div>
                            </button>
                        ))}
                        {reports.length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-sm">No reports found</div>
                        )}
                    </div>
                </div>

                {/* Report Detail View */}
                <div className="col-span-2 bg-gray-900 overflow-y-auto max-h-[600px] p-6">
                    {selectedReport ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2 capitalize">
                                        {selectedReport.request.scan_type} Scan Report
                                    </h2>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {new Date(selectedReport.timestamp).toLocaleString()}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 font-mono text-xs">
                                            ID: {selectedReport.id.slice(0, 8)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const blob = new Blob([JSON.stringify(selectedReport, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `report-${selectedReport.id}.json`;
                                        a.click();
                                    }}
                                    className="p-2 hover:bg-gray-800 rounded text-blue-400" title="Download JSON">
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>

                            {selectedReport.results.map((res, idx) => (
                                <div key={idx} className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
                                    <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                                        <div className="font-semibold flex items-center gap-2">
                                            {res.status === 'completed' ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-500" />
                                            )}
                                            {res.scan_type}
                                        </div>
                                    </div>
                                    <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
                                        {res.output || "No output captured."}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <FileText className="w-12 h-12 mb-4 opacity-50" />
                            <p>Select a report to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
