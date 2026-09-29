import { Severity, ScanType } from '@prisma/client'

export interface AIFinding {
  severity: Severity
  category: string
  title: string
  description: string
  recommendation: string
  line?: number
  source: 'AI'
}

const typeLabels: Record<ScanType, string> = {
  CONFIG: 'configuration file',
  CODE: 'source code',
  DOCKERFILE: 'Dockerfile',
  MANIFEST: 'manifest/deployment file',
  GENERAL: 'text content',
}

export function isAIEnabled(): boolean {
  const key = process.env.OPENAI_API_KEY
  return !!key && key.length > 10 && !key.startsWith('placeholder')
}

export async function analyzeWithAI(content: string, type: ScanType): Promise<{ findings: AIFinding[]; summary: string }> {
  if (!isAIEnabled()) {
    return { findings: [], summary: 'AI analysis skipped — no valid OpenAI API key configured.' }
  }

  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const systemPrompt = `You are an expert cybersecurity analyst. Analyze the provided ${typeLabels[type]} for security vulnerabilities, misconfigurations, and risks. Return a JSON object with this exact structure:
{
  "summary": "brief overall risk assessment in 1-2 sentences",
  "findings": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "category": "e.g. Secrets, Injection, Network, Cryptography, Configuration, Container Security",
      "title": "short title",
      "description": "what the issue is and why it matters",
      "recommendation": "how to fix it",
      "line": null
    }
  ]
}
Only include real, actionable findings. Do not invent issues that are not present in the content.`

  const userPrompt = `Analyze this ${typeLabels[type]}:\n\n${content.slice(0, 12000)}`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const raw = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(raw)

    const findings: AIFinding[] = (parsed.findings || []).map((f: any) => ({
      severity: (f.severity?.toUpperCase() || 'INFO') as Severity,
      category: f.category || 'General',
      title: f.title || 'Untitled finding',
      description: f.description || '',
      recommendation: f.recommendation || '',
      line: f.line ? Number(f.line) : undefined,
      source: 'AI' as const,
    }))

    return { findings, summary: parsed.summary || 'AI analysis complete.' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { findings: [], summary: `AI analysis failed: ${message}` }
  }
}
