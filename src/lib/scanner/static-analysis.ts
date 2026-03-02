import type { Finding } from "../database.types";

type CheckFn = (content: string, frontmatter: Record<string, unknown>) => Finding;

// --- Individual checks ---

const checkBashExecution: CheckFn = (content) => {
  const dangerousPatterns = [
    { pattern: /rm\s+-rf\s+/gi, label: "rm -rf" },
    { pattern: /curl\s+.*\|\s*bash/gi, label: "curl | bash" },
    { pattern: /wget\s+.*\|\s*bash/gi, label: "wget | bash" },
    { pattern: /\beval\s*\(/gi, label: "eval()" },
    { pattern: /~\/\.ssh/gi, label: "~/.ssh access" },
    { pattern: /~\/\.env/gi, label: "~/.env access" },
    { pattern: /\/etc\/passwd/gi, label: "/etc/passwd access" },
    { pattern: /\/etc\/shadow/gi, label: "/etc/shadow access" },
    { pattern: /chmod\s+777/gi, label: "chmod 777" },
    { pattern: /mkfifo|nc\s+-/gi, label: "reverse shell pattern" },
    { pattern: /sudo\s+/gi, label: "sudo usage" },
    { pattern: />\s*\/dev\/tcp/gi, label: "/dev/tcp redirect" },
  ];

  const found = dangerousPatterns.filter((p) => p.pattern.test(content));

  if (found.length === 0) {
    return {
      name: "Dangerous Bash Commands",
      severity: "critical",
      passed: true,
      details: "No dangerous bash execution patterns detected.",
    };
  }

  return {
    name: "Dangerous Bash Commands",
    severity: "critical",
    passed: false,
    details: `Found dangerous patterns: ${found.map((f) => f.label).join(", ")}`,
  };
};

const checkExfiltration: CheckFn = (content) => {
  const patterns = [
    { pattern: /fetch\s*\(\s*['"`]https?:\/\//gi, label: "fetch() to external URL" },
    { pattern: /XMLHttpRequest/gi, label: "XMLHttpRequest" },
    { pattern: /\.sendBeacon\s*\(/gi, label: "sendBeacon()" },
    { pattern: /new\s+WebSocket\s*\(/gi, label: "WebSocket connection" },
    { pattern: /https?:\/\/[^\s'"`)]+\.(ru|cn|tk|ml|ga|cf)\b/gi, label: "suspicious TLD" },
    { pattern: /curl\s+.*-X\s*POST/gi, label: "curl POST" },
    { pattern: /curl\s+.*--data/gi, label: "curl with data" },
    { pattern: /webhook\.site|requestbin|pipedream/gi, label: "known exfil service" },
    { pattern: /ngrok\.io|localtunnel/gi, label: "tunneling service" },
  ];

  const found = patterns.filter((p) => p.pattern.test(content));

  if (found.length === 0) {
    return {
      name: "Data Exfiltration",
      severity: "high",
      passed: true,
      details: "No data exfiltration patterns detected.",
    };
  }

  return {
    name: "Data Exfiltration",
    severity: "high",
    passed: false,
    details: `Potential exfiltration vectors: ${found.map((f) => f.label).join(", ")}`,
  };
};

const checkPromptInjection: CheckFn = (content) => {
  const patterns = [
    { pattern: /ignore\s+(all\s+)?previous\s+(instructions|context)/gi, label: "ignore previous instructions" },
    { pattern: /override\s+(system|previous)\s+prompt/gi, label: "override system prompt" },
    { pattern: /you\s+are\s+now\s+/gi, label: "identity override" },
    { pattern: /disregard\s+(all|any)\s+(prior|previous)/gi, label: "disregard prior instructions" },
    { pattern: /forget\s+(everything|all|your\s+instructions)/gi, label: "forget instructions" },
    { pattern: /new\s+instructions?\s*:/gi, label: "new instructions block" },
    { pattern: /system\s*prompt\s*:/gi, label: "system prompt override" },
    { pattern: /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/gi, label: "chat template injection" },
    { pattern: /<<SYS>>|<\/SYS>/gi, label: "Llama system tag injection" },
  ];

  const found = patterns.filter((p) => p.pattern.test(content));

  if (found.length === 0) {
    return {
      name: "Prompt Injection",
      severity: "critical",
      passed: true,
      details: "No prompt injection patterns detected.",
    };
  }

  return {
    name: "Prompt Injection",
    severity: "critical",
    passed: false,
    details: `Prompt injection indicators: ${found.map((f) => f.label).join(", ")}`,
  };
};

const checkPermissionScope: CheckFn = (content, frontmatter) => {
  const riskyTools = ["Bash", "Write", "Edit", "NotebookEdit"];
  const requestedTools: string[] = [];

  // Check frontmatter for tool declarations
  const tools = frontmatter.tools as string[] | undefined;
  if (Array.isArray(tools)) {
    for (const tool of tools) {
      if (riskyTools.some((r) => tool.toLowerCase().includes(r.toLowerCase()))) {
        requestedTools.push(tool);
      }
    }
  }

  // Check content for tool usage patterns
  for (const tool of riskyTools) {
    const toolPattern = new RegExp(`\\b${tool}\\b`, "g");
    if (toolPattern.test(content)) {
      if (!requestedTools.includes(tool)) {
        requestedTools.push(tool);
      }
    }
  }

  if (requestedTools.length === 0) {
    return {
      name: "Permission Scope",
      severity: "medium",
      passed: true,
      details: "No high-risk tool access requested.",
    };
  }

  const severity = requestedTools.includes("Bash") ? "high" as const : "medium" as const;

  return {
    name: "Permission Scope",
    severity,
    passed: false,
    details: `Requests access to risky tools: ${requestedTools.join(", ")}`,
  };
};

const checkDependencyRisk: CheckFn = (content) => {
  const patterns = [
    { pattern: /npm\s+install\b/gi, label: "npm install" },
    { pattern: /pip\s+install\b/gi, label: "pip install" },
    { pattern: /cargo\s+install\b/gi, label: "cargo install" },
    { pattern: /go\s+install\b/gi, label: "go install" },
    { pattern: /curl\s+.*\|\s*(sh|bash|zsh)/gi, label: "piped download execution" },
    { pattern: /wget\s+-O\s*-\s*.*\|\s*(sh|bash)/gi, label: "wget piped execution" },
    { pattern: /git\s+clone\b/gi, label: "git clone" },
    { pattern: /npx\s+[^\s]+/gi, label: "npx execution" },
  ];

  const found = patterns.filter((p) => p.pattern.test(content));

  if (found.length === 0) {
    return {
      name: "Dependency Risk",
      severity: "medium",
      passed: true,
      details: "No external dependency installation detected.",
    };
  }

  return {
    name: "Dependency Risk",
    severity: "medium",
    passed: false,
    details: `External dependency patterns: ${found.map((f) => f.label).join(", ")}`,
  };
};

const checkObfuscation: CheckFn = (content) => {
  const patterns = [
    { pattern: /\\x[0-9a-f]{2}/gi, label: "hex escape sequences" },
    { pattern: /\\u[0-9a-f]{4}/gi, label: "unicode escape sequences" },
    { pattern: /atob\s*\(/gi, label: "base64 decode (atob)" },
    { pattern: /btoa\s*\(/gi, label: "base64 encode (btoa)" },
    { pattern: /Buffer\.from\s*\([^)]+,\s*['"]base64['"]\)/gi, label: "Buffer.from base64" },
    { pattern: /String\.fromCharCode/gi, label: "String.fromCharCode" },
    { pattern: /\bcharCodeAt\b/gi, label: "charCodeAt" },
  ];

  const found = patterns.filter((p) => p.pattern.test(content));

  if (found.length === 0) {
    return {
      name: "Code Obfuscation",
      severity: "high",
      passed: true,
      details: "No obfuscation patterns detected.",
    };
  }

  return {
    name: "Code Obfuscation",
    severity: "high",
    passed: false,
    details: `Obfuscation indicators: ${found.map((f) => f.label).join(", ")}`,
  };
};

const checkFileSystemAccess: CheckFn = (content) => {
  const patterns = [
    { pattern: /~\/\./g, label: "dotfile access" },
    { pattern: /\/etc\//g, label: "/etc/ access" },
    { pattern: /\/root\//g, label: "/root/ access" },
    { pattern: /\.env\b/g, label: ".env file" },
    { pattern: /credentials|secrets?\b/gi, label: "credentials/secrets reference" },
    { pattern: /private[_-]?key/gi, label: "private key reference" },
    { pattern: /api[_-]?key/gi, label: "API key reference" },
    { pattern: /token\s*[:=]/gi, label: "token assignment" },
  ];

  const found = patterns.filter((p) => p.pattern.test(content));

  if (found.length === 0) {
    return {
      name: "Sensitive File Access",
      severity: "high",
      passed: true,
      details: "No sensitive file access patterns detected.",
    };
  }

  return {
    name: "Sensitive File Access",
    severity: "high",
    passed: false,
    details: `Sensitive access patterns: ${found.map((f) => f.label).join(", ")}`,
  };
};

const checkHardcodedSecrets: CheckFn = (content) => {
  const patterns = [
    { pattern: /sk-ant-[a-zA-Z0-9_-]{20,}/g, label: "Anthropic API key" },
    { pattern: /sk-[a-zA-Z0-9]{20,}/g, label: "OpenAI-style API key" },
    { pattern: /ghp_[a-zA-Z0-9]{36}/g, label: "GitHub personal access token" },
    { pattern: /gho_[a-zA-Z0-9]{36}/g, label: "GitHub OAuth token" },
    { pattern: /glpat-[a-zA-Z0-9_-]{20}/g, label: "GitLab personal access token" },
    { pattern: /xoxb-[0-9]{10,}-[a-zA-Z0-9]{20,}/g, label: "Slack bot token" },
    { pattern: /AKIA[0-9A-Z]{16}/g, label: "AWS access key" },
    { pattern: /0x[a-fA-F0-9]{64}\b/g, label: "Ethereum private key (64 hex chars)" },
    { pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g, label: "PEM private key" },
    { pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, label: "JWT token" },
  ];

  const found = patterns.filter((p) => p.pattern.test(content));

  if (found.length === 0) {
    return {
      name: "Hardcoded Secrets",
      severity: "critical",
      passed: true,
      details: "No hardcoded secrets or API keys detected.",
    };
  }

  return {
    name: "Hardcoded Secrets",
    severity: "critical",
    passed: false,
    details: `Potential hardcoded secrets: ${found.map((f) => f.label).join(", ")}`,
  };
};

const checkCryptoMining: CheckFn = (content) => {
  const patterns = [
    { pattern: /coinhive|cryptonight|monero.*miner/gi, label: "known crypto miner" },
    { pattern: /stratum\+tcp:\/\//gi, label: "mining pool connection" },
    { pattern: /crypto\.subtle\.digest|WebAssembly\.instantiate/gi, label: "crypto/WASM computation" },
    { pattern: /setInterval\s*\([^)]*\d{3,}\s*\)/gi, label: "suspicious interval loop" },
    { pattern: /worker.*new\s+Worker/gi, label: "Web Worker spawning" },
  ];

  const found = patterns.filter((p) => p.pattern.test(content));

  if (found.length === 0) {
    return {
      name: "Crypto Mining",
      severity: "high",
      passed: true,
      details: "No cryptomining patterns detected.",
    };
  }

  return {
    name: "Crypto Mining",
    severity: "high",
    passed: false,
    details: `Potential cryptomining indicators: ${found.map((f) => f.label).join(", ")}`,
  };
};

const checkNetworkManipulation: CheckFn = (content) => {
  const patterns = [
    { pattern: /dns.*lookup|resolve.*dns/gi, label: "DNS manipulation" },
    { pattern: /iptables|firewall|ufw/gi, label: "firewall modification" },
    { pattern: /\/etc\/hosts/gi, label: "/etc/hosts modification" },
    { pattern: /proxy.*SOCKS|SOCKS.*proxy/gi, label: "SOCKS proxy setup" },
    { pattern: /port\s*(forward|scan)/gi, label: "port forwarding/scanning" },
    { pattern: /nmap|masscan|zmap/gi, label: "network scanning tool" },
  ];

  const found = patterns.filter((p) => p.pattern.test(content));

  if (found.length === 0) {
    return {
      name: "Network Manipulation",
      severity: "high",
      passed: true,
      details: "No network manipulation patterns detected.",
    };
  }

  return {
    name: "Network Manipulation",
    severity: "high",
    passed: false,
    details: `Network manipulation patterns: ${found.map((f) => f.label).join(", ")}`,
  };
};

const checkPrivilegeEscalation: CheckFn = (content) => {
  const patterns = [
    { pattern: /setuid|setgid|chown\s+root/gi, label: "privilege escalation" },
    { pattern: /\/etc\/sudoers/gi, label: "sudoers modification" },
    { pattern: /passwd\s*-d|usermod|useradd/gi, label: "user account manipulation" },
    { pattern: /crontab\s+-e|\/etc\/cron/gi, label: "cron job manipulation" },
    { pattern: /systemctl\s+(enable|start|restart)/gi, label: "service manipulation" },
    { pattern: /launchctl\s+load|LaunchAgent/gi, label: "macOS persistence" },
    { pattern: /reg\s+add.*\\Run/gi, label: "Windows registry autorun" },
  ];

  const found = patterns.filter((p) => p.pattern.test(content));

  if (found.length === 0) {
    return {
      name: "Privilege Escalation",
      severity: "critical",
      passed: true,
      details: "No privilege escalation patterns detected.",
    };
  }

  return {
    name: "Privilege Escalation",
    severity: "critical",
    passed: false,
    details: `Privilege escalation patterns: ${found.map((f) => f.label).join(", ")}`,
  };
};

const checkHiddenContent: CheckFn = (content) => {
  const patterns = [
    { pattern: /\u200b|\u200c|\u200d|\ufeff/g, label: "zero-width characters" },
    { pattern: /<!--[\s\S]{100,}?-->/g, label: "large HTML comment (possible hidden code)" },
    { pattern: /data:text\/javascript;base64/gi, label: "base64 data URI (JavaScript)" },
    { pattern: /data:application\/octet-stream/gi, label: "binary data URI" },
    { pattern: /\\\d{3}\\\d{3}\\\d{3}/g, label: "octal escape sequences" },
  ];

  const found = patterns.filter((p) => p.pattern.test(content));

  if (found.length === 0) {
    return {
      name: "Hidden Content",
      severity: "medium",
      passed: true,
      details: "No hidden or steganographic content detected.",
    };
  }

  return {
    name: "Hidden Content",
    severity: "medium",
    passed: false,
    details: `Hidden content patterns: ${found.map((f) => f.label).join(", ")}`,
  };
};

// --- Run all checks ---

const ALL_CHECKS: CheckFn[] = [
  checkBashExecution,
  checkExfiltration,
  checkPromptInjection,
  checkPermissionScope,
  checkDependencyRisk,
  checkObfuscation,
  checkFileSystemAccess,
  checkHardcodedSecrets,
  checkCryptoMining,
  checkNetworkManipulation,
  checkPrivilegeEscalation,
  checkHiddenContent,
];

export function runStaticAnalysis(
  content: string,
  frontmatter: Record<string, unknown>
): Finding[] {
  return ALL_CHECKS.map((check) => check(content, frontmatter));
}
