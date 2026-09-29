import { Severity, ScanType } from '@prisma/client'

export interface ScanRule {
  id: string
  severity: Severity
  category: string
  title: string
  description: string
  recommendation: string
  pattern: RegExp
  types?: ScanType[]
}

export interface ScanFinding {
  severity: Severity
  category: string
  title: string
  description: string
  recommendation: string
  line?: number
  source: 'RULE'
}

const rules: ScanRule[] = [
  {
    id: 'hardcoded-aws-key',
    severity: Severity.CRITICAL,
    category: 'Secrets',
    title: 'Hardcoded AWS Access Key',
    description: 'An AWS access key ID was found in the content. Exposing access keys in source code or configuration is a critical security risk.',
    recommendation: 'Remove the hardcoded key immediately, rotate it in the AWS console, and use environment variables or a secrets manager instead.',
    pattern: /AKIA[0-9A-Z]{16}/,
  },
  {
    id: 'hardcoded-private-key',
    severity: Severity.CRITICAL,
    category: 'Secrets',
    title: 'Private Key Detected',
    description: 'A private key (RSA, EC, or similar) was found in the content. Private keys must never be committed to source code.',
    recommendation: 'Remove the private key, add it to .gitignore, rotate the key pair, and use a secrets management solution.',
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |)PRIVATE KEY-----/,
  },
  {
    id: 'hardcoded-password',
    severity: Severity.HIGH,
    category: 'Secrets',
    title: 'Hardcoded Password',
    description: 'A potential hardcoded password was detected. Hardcoded credentials are a major attack vector.',
    recommendation: 'Use environment variables or a secrets manager for credentials. Never store passwords in source code.',
    pattern: /(?i)(password|passwd|pwd)\s*[:=]\s*["\']?[^\s"\']{4,}["\']?/,
  },
  {
    id: 'hardcoded-api-key',
    severity: Severity.HIGH,
    category: 'Secrets',
    title: 'Hardcoded API Key or Token',
    description: 'A potential API key or bearer token was found in the content.',
    recommendation: 'Move the API key to an environment variable or secrets manager and rotate the exposed key.',
    pattern: /(?i)(api[_-]?key|secret|token|auth)\s*[:=]\s*["\']?[a-zA-Z0-9_\-]{20,}["\']?/,
  },
  {
    id: 'debug-enabled',
    severity: Severity.HIGH,
    category: 'Configuration',
    title: 'Debug Mode Enabled',
    description: 'Debug mode is enabled, which can expose sensitive information and stack traces to end users.',
    recommendation: 'Disable debug mode in production: set DEBUG=false or NODE_ENV=production.',
    pattern: /(?i)(debug\s*[:=]\s*(true|1|yes)|NODE_ENV\s*[:=]\s*development)/,
  },
  {
    id: 'cors-wildcard',
    severity: Severity.HIGH,
    category: 'Network',
    title: 'CORS Wildcard Origin',
    description: 'CORS is configured to allow all origins (*), which permits any website to make cross-origin requests.',
    recommendation: 'Restrict CORS to specific trusted origins instead of using a wildcard.',
    pattern: /(?i)(access-control-allow-origin|cors|origins)\s*[:=]\s*["\']?\*["\']?/,
  },
  {
    id: 'http-not-https',
    severity: Severity.MEDIUM,
    category: 'Network',
    title: 'HTTP Used Instead of HTTPS',
    description: 'An HTTP URL was found where HTTPS should be used. Unencrypted traffic can be intercepted.',
    recommendation: 'Use HTTPS for all external URLs and API endpoints.',
    pattern: /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/,
  },
  {
    id: 'eval-usage',
    severity: Severity.HIGH,
    category: 'Code Quality',
    title: 'Use of eval()',
    description: 'The eval() function executes arbitrary code and is a common injection vector.',
    recommendation: 'Avoid eval(). Use JSON.parse() for data parsing or safer alternatives for dynamic code.',
    pattern: /\beval\s*\(/,
    types: [ScanType.CODE],
  },
  {
    id: 'sql-injection',
    severity: Severity.HIGH,
    category: 'Injection',
    title: 'Potential SQL Injection',
    description: 'String concatenation in SQL queries can lead to SQL injection attacks.',
    recommendation: 'Use parameterized queries or prepared statements instead of string concatenation.',
    pattern: /(?i)(query|execute|sql)\s*\(\s*["'`].*\$\{.*\}.*["'`]/,
    types: [ScanType.CODE],
  },
  {
    id: 'insecure-random',
    severity: Severity.MEDIUM,
    category: 'Cryptography',
    title: 'Insecure Random Number Generation',
    description: 'Math.random() is not cryptographically secure and should not be used for security-sensitive operations.',
    recommendation: 'Use crypto.randomBytes() or crypto.getRandomValues() for security-critical randomness.',
    pattern: /Math\.random\s*\(/,
    types: [ScanType.CODE],
  },
  {
    id: 'container-root',
    severity: Severity.HIGH,
    category: 'Container Security',
    title: 'Container Running as Root',
    description: 'The Dockerfile does not specify a non-root user, so the container runs as root by default.',
    recommendation: 'Add a non-root user and switch to it: RUN useradd -m appuser && USER appuser',
    pattern: /FROM\s+\S+/,
    types: [ScanType.DOCKERFILE],
  },
  {
    id: 'privileged-container',
    severity: Severity.HIGH,
    category: 'Container Security',
    title: 'Privileged Container Mode',
    description: 'The container is configured with --privileged, which grants near-host-level access.',
    recommendation: 'Remove --privileged and grant only the specific capabilities needed.',
    pattern: /--privileged/,
    types: [ScanType.DOCKERFILE],
  },
  {
    id: 'latest-tag',
    severity: Severity.MEDIUM,
    category: 'Container Security',
    title: 'Unpinned Image Tag (:latest)',
    description: 'Using :latest tag makes builds non-reproducible and can introduce unexpected vulnerabilities.',
    recommendation: 'Pin image tags to specific versions, e.g. node:22.11.0-slim instead of node:latest.',
    pattern: /:\s*latest(?!\S)/,
    types: [ScanType.DOCKERFILE, ScanType.MANIFEST],
  },
  {
    id: 'no-tls-version',
    severity: Severity.MEDIUM,
    category: 'Cryptography',
    title: 'TLS Version Not Specified',
    description: 'No minimum TLS version is enforced, potentially allowing weak protocols like TLS 1.0.',
    recommendation: 'Enforce TLS 1.2 or higher in your server configuration.',
    pattern: /(?i)(ssl|tls)/,
  },
  {
    id: 'admin-credentials',
    severity: Severity.CRITICAL,
    category: 'Secrets',
    title: 'Admin Credentials in Configuration',
    description: 'Administrative credentials were found in the content, which could allow unauthorized access.',
    recommendation: 'Remove admin credentials from the file and use a secrets manager or environment variables.',
    pattern: /(?i)(admin|root|sa)\s*[:=]\s*["\']?[^\s"\']{4,}["\']?/,
  },
]

export function runRuleScan(content: string, type: ScanType): ScanFinding[] {
  const findings: ScanFinding[] = []
  const lines = content.split('\n')

  for (const rule of rules) {
    if (rule.types && !rule.types.includes(type)) continue

    let match: RegExpExecArray | null
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g')
    while ((match = regex.exec(content)) !== null) {
      const offset = match.index
      const lineNum = content.substring(0, offset).split('\n').length
      findings.push({
        severity: rule.severity,
        category: rule.category,
        title: rule.title,
        description: rule.description,
        recommendation: rule.recommendation,
        line: lineNum,
        source: 'RULE',
      })
    }
  }

  return findings
}
