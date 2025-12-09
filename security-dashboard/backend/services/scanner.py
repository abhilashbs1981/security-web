import asyncio
import json
import os
from datetime import datetime
from fastapi import WebSocket
from models import ScanRequest, ScanType, ScanStatus, ScanResult
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

REPORTS_DIR = "security-dashboard/backend/reports"
os.makedirs(REPORTS_DIR, exist_ok=True)

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, scan_id: str):
        await websocket.accept()
        logger.info(f"WS Connected: {scan_id}")
        if scan_id not in self.active_connections:
            self.active_connections[scan_id] = []
        self.active_connections[scan_id].append(websocket)

    def disconnect(self, websocket: WebSocket, scan_id: str):
        logger.info(f"WS Disconnected: {scan_id}")
        if scan_id in self.active_connections:
            if websocket in self.active_connections[scan_id]:
                self.active_connections[scan_id].remove(websocket)
            if not self.active_connections[scan_id]:
                del self.active_connections[scan_id]

    async def broadcast(self, message: str, scan_id: str):
        if scan_id in self.active_connections:
            for connection in self.active_connections[scan_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {scan_id}: {e}")

manager = ConnectionManager()

async def handle_websocket(websocket: WebSocket, scan_id: str):
    logger.info(f"Handling WS connection for {scan_id}")
    await manager.connect(websocket, scan_id)
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received WS data from {scan_id}: {data}")
    except Exception as e:
        logger.error(f"WS Error {scan_id}: {e}")
    finally:
        manager.disconnect(websocket, scan_id)

async def _run_command(command: list, scan_id: str, accum_output: list, cwd: str = None):
    cmd_str = " ".join(command)
    # await manager.broadcast(f"\n$ {cmd_str}\n", scan_id)
    
    try:
        process = await asyncio.create_subprocess_exec(
            *command,
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT
        )

        while True:
            # Read chunks instead of lines to support incremental progress dots
            data = await process.stdout.read(4096)
            if not data:
                break
            text = data.decode('utf-8', errors='replace')
            await manager.broadcast(text, scan_id)
            accum_output.append(text)

        await process.wait()
        return process.returncode
    except FileNotFoundError:
        err = f"Error: Command not found: {command[0]}\n"
        await manager.broadcast(err, scan_id)
        accum_output.append(err)
        return 1
    except Exception as e:
        err = f"Error executing command: {str(e)}\n"
        await manager.broadcast(err, scan_id)
        accum_output.append(err)
        return 1

async def run_single_scan(scan_type: ScanType, scan_id: str, request: ScanRequest) -> dict:
    command = []
    # Mocking commands for demonstration if tools aren't installed, 
    # but implementing as if they are.
    # User /app in container, or fallback to current dir
    cwd = os.getenv("APP_HOME", "/app") 
    
    if scan_type == ScanType.KUBE_BENCH:
        command = ["bash", f"{cwd}/4_run_kube_bench.sh"]

    elif scan_type == ScanType.KYVERNO:
        command = ["bash", f"{cwd}/6_run_kyverno.sh"]
    
    elif scan_type == ScanType.TRIVY_IMAGE:
        command = ["bash", f"{cwd}/2_run_trivy_image.sh"]

    elif scan_type == ScanType.TRIVY_SBOM:
        command = ["bash", f"{cwd}/1_run_trivy_sbom.sh"]
    
    elif scan_type == ScanType.TRIVY_CLUSTER:
        command = ["bash", f"{cwd}/5_run_trivy_cluster.sh"]

    elif scan_type == ScanType.NMAP:
        command = ["bash", f"{cwd}/3_run_nmap.sh"]

    accum_output = []
    
    await manager.broadcast(f"--- Starting {scan_type.value} scan ---\n", scan_id)
    ret_code = await _run_command(command, scan_id, accum_output, cwd=cwd)
    
    status = ScanStatus.COMPLETED if ret_code == 0 else ScanStatus.FAILED
    await manager.broadcast(f"--- {scan_type.value} scan finished with status: {status.value} ---\n", scan_id)
    
    return {
        "scan_type": scan_type,
        "status": status,
        "output": "".join(accum_output),
        "timestamp": datetime.now().isoformat()
    }

async def run_scan_task(scan_id: str, request: ScanRequest):
    results = []
    
    if request.scan_type == ScanType.ALL:

        scans_to_run = [ScanType.TRIVY_SBOM, ScanType.KYVERNO, ScanType.KUBE_BENCH, ScanType.TRIVY_IMAGE, ScanType.NMAP, ScanType.TRIVY_CLUSTER]
        for s_type in scans_to_run:
            res = await run_single_scan(s_type, scan_id, request)
            results.append(res)
    else:
        res = await run_single_scan(request.scan_type, scan_id, request)
        results.append(res)

    # Save Report
    report_file = os.path.join(REPORTS_DIR, f"{scan_id}.json")
    final_report = {
        "id": scan_id,
        "request": request.dict(),
        "timestamp": datetime.now().isoformat(),
        "results": results
    }
    
    with open(report_file, "w") as f:
        json.dump(final_report, f, indent=2)
    
    await manager.broadcast(f"Report saved to {report_file}", scan_id)
    await manager.broadcast("__EOF__", scan_id)
