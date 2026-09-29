import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { runRuleScan } from '@/lib/scanner'
import { analyzeWithAI, isAIEnabled } from '@/lib/ai'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Viewers cannot run scans' }, { status: 403 })
  }

  const { id } = await context.params
  const scan = await prisma.scan.findFirst({ where: { id, workspaceId: user.workspaceId } })
  if (!scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  await prisma.scan.update({ where: { id }, data: { status: 'RUNNING' } })
  await prisma.finding.deleteMany({ where: { scanId: id } })

  try {
    // 1. Rule-based scan (always runs)
    const ruleFindings = runRuleScan(scan.content, scan.type)

    await prisma.finding.createMany({
      data: ruleFindings.map((f) => ({
        scanId: id,
        severity: f.severity,
        category: f.category,
        title: f.title,
        description: f.description,
        recommendation: f.recommendation,
        line: f.line,
        source: 'RULE',
      })),
    })

    // 2. AI analysis (optional)
    let summary = `Rule-based scan found ${ruleFindings.length} finding${ruleFindings.length !== 1 ? 's' : ''}.`
    if (isAIEnabled()) {
      const aiResult = await analyzeWithAI(scan.content, scan.type)
      if (aiResult.findings.length > 0) {
        await prisma.finding.createMany({
          data: aiResult.findings.map((f) => ({
            scanId: id,
            severity: f.severity,
            category: f.category,
            title: f.title,
            description: f.description,
            recommendation: f.recommendation,
            line: f.line,
            source: 'AI',
          })),
        })
        summary = `${aiResult.summary} (AI found ${aiResult.findings.length} additional finding${aiResult.findings.length !== 1 ? 's' : ''}.)`
      } else {
        summary = `${summary} ${aiResult.summary}`
      }
    } else {
      summary = `${summary} AI analysis unavailable — configure OPENAI_API_KEY to enable AI-powered assessment.`
    }

    await prisma.scan.update({ where: { id }, data: { status: 'COMPLETED', summary } })

    const updated = await prisma.scan.findFirst({
      where: { id },
      include: { findings: { orderBy: { severity: 'asc' } } },
    })
    return NextResponse.json({ scan: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await prisma.scan.update({ where: { id }, data: { status: 'FAILED', summary: `Scan failed: ${message}` } })
    return NextResponse.json({ error: 'Scan failed', detail: message }, { status: 500 })
  }
}
