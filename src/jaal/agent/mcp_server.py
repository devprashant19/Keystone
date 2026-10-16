"""
jaal.agent.mcp_server - Standard Model Context Protocol (MCP) JSON-RPC stdio server.
Exposes Jaal's 5 typed tools for connected data analysis to MCP-compatible clients (Cursor, Claude Desktop, Antigravity).

Constraints:
- Read-only tools execute directly with Pydantic validation and output sanitization.
- The write tool (record_commander_decision) is strictly gated behind an explicit confirmation event.
"""

import sys
import json
from typing import Dict, Any, Optional

from jaal.tools.tools import (
    GetCorridorInventoryInput,
    EvaluateContingencyInput,
    GetCaseEvidenceInput,
    RecordCommanderDecisionInput,
    CheckSystemHealthInput,
    get_corridor_inventory,
    evaluate_contingency,
    get_case_evidence,
    record_commander_decision,
    check_system_health,
    sanitize_output,
)
from jaal.agent.agent import TOOL_DEFINITIONS

class JaalMCPServer:
    """Stdio-based MCP Server implementing JSON-RPC 2.0."""

    def __init__(self):
        self.tools = {t["name"]: t for t in TOOL_DEFINITIONS}

    def handle_request(self, req: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        msg_id = req.get("id")
        method = req.get("method")
        params = req.get("params", {})

        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "capabilities": {"tools": {}},
                    "serverInfo": {
                        "name": "jaal-mcp-server",
                        "version": "0.1.0-monsoon2026",
                        "description": "Jaal Pre-Mortem Network Contingency and Incident Command Tools"
                    }
                }
            }

        elif method == "tools/list":
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "tools": TOOL_DEFINITIONS
                }
            }

        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})

            try:
                result_data = self.execute_tool(tool_name, arguments)
                sanitized_text = sanitize_output(json.dumps(result_data, indent=2))
                return {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": sanitized_text
                            }
                        ]
                    }
                }
            except Exception as e:
                return {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "error": {
                        "code": -32603,
                        "message": f"Tool execution failed: {str(e)}"
                    }
                }

        elif method == "ping":
            return {"jsonrpc": "2.0", "id": msg_id, "result": "pong"}

        else:
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {
                    "code": -32601,
                    "message": f"Method '{method}' not found"
                }
            }

    def execute_tool(self, name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        if name == "get_corridor_inventory":
            inp = GetCorridorInventoryInput(**args)
            return get_corridor_inventory(inp)

        elif name == "evaluate_contingency":
            inp = EvaluateContingencyInput(**args)
            return evaluate_contingency(inp)

        elif name in ("inspect_causal_chain", "get_case_evidence"):
            inp = GetCaseEvidenceInput(**args)
            return get_case_evidence(inp)

        elif name == "check_system_health":
            inp = CheckSystemHealthInput(**args)
            return check_system_health(inp)

        elif name == "record_commander_decision":
            # AG-06: Human write-gating check
            if not args.get("confirmed"):
                raise PermissionError(
                    "Commander verdict recording is gated behind explicit human confirmation. "
                    "Must supply 'confirmed: true' from an authorized human commander event."
                )
            clean_args = {k: v for k, v in args.items() if k != "confirmed"}
            inp = RecordCommanderDecisionInput(**clean_args)
            return record_commander_decision(inp)

        else:
            raise ValueError(f"Unknown tool name: {name}")

    def run_stdio(self):
        """Run standard I/O JSON-RPC processing loop."""
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                req = json.loads(line)
                resp = self.handle_request(req)
                if resp:
                    sys.stdout.write(json.dumps(resp) + "\n")
                    sys.stdout.flush()
            except Exception as e:
                err_resp = {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {"code": -32700, "message": f"Parse error: {str(e)}"}
                }
                sys.stdout.write(json.dumps(err_resp) + "\n")
                sys.stdout.flush()

if __name__ == "__main__":
    server = JaalMCPServer()
    server.run_stdio()
