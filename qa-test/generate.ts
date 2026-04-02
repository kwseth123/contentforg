/**
 * QA Test Runner — Generates one document per content type using its default template,
 * checks for issues, and produces a qa-report.html with a 2-column grid.
 *
 * Run:  npx tsx qa-test/generate.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { DOCUMENT_STYLES, getDefaultStyleForContentType, getStyle } from '../src/lib/documentStyles/registry';
import { StyleInput } from '../src/lib/documentStyles/types';

// ════════════════════════════════════════════════════════
// Test content for each content type
// ════════════════════════════════════════════════════════

const COMPANY_NAME = 'Acme Solutions';
const COMPANY_DESC = 'Enterprise workflow automation platform';
const ACCENT = '#4F46E5';
const PROSPECT = { companyName: 'GlobalTech Industries', industry: 'Manufacturing', companySize: '2,500 employees' };

type TestSpec = {
  contentType: string;
  label: string;
  sections: { id: string; title: string; content: string }[];
};

const testSpecs: TestSpec[] = [
  // ─── 1. Solution One-Pager ───
  {
    contentType: 'solution-one-pager',
    label: 'Solution One-Pager',
    sections: [
      { id: 's1', title: 'Hero', content: '**Automate Your Manufacturing Workflows in 90 Days**\nEliminate manual data entry, reduce errors by 73%, and free your team to focus on what matters.' },
      { id: 's2', title: 'Key Metrics', content: '- **73%** | Error Reduction\n- **4.2x** | ROI in Year One\n- **90 Days** | Full Deployment' },
      { id: 's3', title: 'The Challenge', content: '- Manual data entry across 12+ disconnected systems\n- Average 14 hours per week spent on reconciliation\n- Compliance gaps from inconsistent reporting\n- No real-time visibility into production metrics' },
      { id: 's4', title: 'Our Solution', content: '- **Unified Data Layer** connects ERP, MES, and CRM in real-time\n- **Smart Automation** eliminates 85% of manual touchpoints\n- **Live Dashboards** give leadership instant visibility\n- **Compliance Engine** auto-generates audit-ready reports' },
      { id: 's5', title: 'Why Us', content: '- **12 years** in manufacturing automation\n- **340+ enterprise deployments** globally\n- **99.97% uptime** SLA guarantee\n- **Dedicated CSM** for every account\n- Named Leader in Gartner MQ 2025' },
      { id: 's6', title: 'Proof', content: '"Acme Solutions cut our month-end close from 5 days to 8 hours. The ROI was undeniable within the first quarter." — Sarah Chen, VP Operations, Meridian Manufacturing' },
    ],
  },

  // ─── 2. Battle Card ───
  {
    contentType: 'battle-card',
    label: 'Battle Card',
    sections: [
      { id: 's1', title: 'Quick Facts', content: '**Target Buyer:** VP of Operations, CIO\n**Deal Size:** $150K-$500K ARR\n**Sales Cycle:** 60-90 days\n**Win Rate vs. Competitors:** 68%' },
      { id: 's2', title: 'Key Differentiators', content: '- **Real-time integration** — competitors require batch sync (24hr delay)\n- **No-code workflow builder** — competitors need professional services\n- **Manufacturing-specific** — purpose-built vs. generic platform\n- **Embedded compliance** — SOX, ISO 9001, ITAR out of the box' },
      { id: 's3', title: 'Competitive Landscape', content: '| Feature | Acme Solutions | Competitor A | Competitor B |\n|---|---|---|---|\n| Real-Time Sync | Yes | No (24hr batch) | Partial |\n| No-Code Builder | Yes | No | Limited |\n| MFG Templates | 50+ | 5 | 12 |\n| Compliance | Built-in | Add-on ($) | None |\n| Avg. Deploy Time | 90 days | 9 months | 6 months |' },
      { id: 's4', title: 'Landmine Questions', content: '- "How does your platform handle real-time shop floor data?" (They batch — we stream)\n- "Can a business user build workflows without IT?" (They require PS — we don\'t)\n- "What compliance frameworks are included out of the box?" (They charge extra)\n- "What is your guaranteed uptime SLA?" (They cap at 99.5% — we guarantee 99.97%)' },
      { id: 's5', title: 'Objection Handling', content: '**"We already use Competitor A"**\nAsk: "How much time does your team spend waiting for batch data to sync?" Their 24-hour delay means decisions are always based on yesterday\'s data.\n\n**"Your price is higher"**\nAsk: "When you factor in the professional services cost for Competitor B, what is the true 3-year TCO?" Our all-inclusive pricing is 30% lower over 3 years.\n\n**"We need to involve IT"**\nLeverage: Our no-code builder means Operations owns the workflow. IT stays focused on infrastructure.' },
      { id: 's6', title: 'Recent Wins', content: '- **Meridian Manufacturing** ($320K ARR) — Won against Competitor A; real-time sync was decisive\n- **Atlas Industrial** ($180K ARR) — Displaced Competitor B; compliance gap was the driver\n- **Nexus Precision** ($475K ARR) — Greenfield; deployed in 78 days' },
    ],
  },

  // ─── 3. Competitive Analysis ───
  {
    contentType: 'competitive-analysis',
    label: 'Competitive Analysis',
    sections: [
      { id: 's1', title: 'Market Overview', content: 'The manufacturing automation market is projected to reach $14.2B by 2027, growing at 12.3% CAGR. Key drivers include digital transformation mandates, labor shortages, and increasing compliance requirements. Three vendors dominate the mid-market: Acme Solutions, AutoFlow, and ManuTech.' },
      { id: 's2', title: 'Feature Comparison', content: '| Capability | Acme Solutions | AutoFlow | ManuTech |\n|---|---|---|---|\n| Real-Time Integration | Native streaming | Batch (24hr) | Near real-time (15min) |\n| Workflow Builder | No-code visual | Code-required | Low-code |\n| Compliance Frameworks | SOX, ISO, ITAR | SOX only | ISO only |\n| Mobile Access | Full parity | Read-only | Basic |\n| AI/ML Analytics | Production-ready | Beta | Roadmap |\n| API Ecosystem | 200+ connectors | 45 connectors | 80 connectors |' },
      { id: 's3', title: 'Pricing Analysis', content: '**Acme Solutions:** $5.50/user/month all-inclusive\n**AutoFlow:** $3.80/user/month + $50K implementation + $12K/yr compliance add-on\n**ManuTech:** $6.20/user/month + $25K onboarding\n\n**3-Year TCO (500 users):**\n- Acme: $99,000\n- AutoFlow: $176,000\n- ManuTech: $136,000' },
      { id: 's4', title: 'Strengths & Weaknesses', content: '**AutoFlow Strengths:** Strong brand recognition, large installed base, good ERP connectors\n**AutoFlow Weaknesses:** No real-time sync, requires PS for customization, aging UI, compliance is paid add-on\n\n**ManuTech Strengths:** Modern UI, good mobile experience, competitive mid-market pricing\n**ManuTech Weaknesses:** Limited compliance, no AI analytics, smaller connector ecosystem, newer company (risk)' },
      { id: 's5', title: 'Win/Loss Summary', content: '**Win Rate:** 68% overall (72% when real-time is a requirement)\n\n**Top Win Reasons:**\n1. Real-time data integration (cited in 81% of wins)\n2. No-code workflow builder (cited in 67% of wins)\n3. Built-in compliance (cited in 54% of wins)\n\n**Top Loss Reasons:**\n1. Existing vendor relationship (41% of losses)\n2. Price perception — initial sticker price (28% of losses)\n3. Geographic coverage concerns (15% of losses)' },
    ],
  },

  // ─── 4. Executive Summary ───
  {
    contentType: 'executive-summary',
    label: 'Executive Summary',
    sections: [
      { id: 's1', title: 'Executive Overview', content: 'GlobalTech Industries is experiencing significant operational inefficiency driven by disconnected systems and manual processes. Our analysis identifies $2.4M in annual waste that can be eliminated through workflow automation, with a projected 4.2x ROI in the first year.' },
      { id: 's2', title: 'Key Findings', content: '- **$2.4M annual waste** from manual data reconciliation across 12 systems\n- **14 hours/week** per manager spent on reporting tasks that should be automated\n- **23% error rate** in cross-system data transfers leading to compliance exposure\n- **6.2 day average** for month-end close vs. industry benchmark of 2 days\n- **Zero real-time visibility** into production metrics for leadership' },
      { id: 's3', title: 'Recommended Solution', content: 'We recommend a phased deployment of the Acme Solutions platform:\n\n**Phase 1 (Weeks 1-4):** Connect ERP and MES for real-time production data\n**Phase 2 (Weeks 5-8):** Deploy automated reporting and compliance engine\n**Phase 3 (Weeks 9-12):** Roll out no-code workflow builder to operations team\n\nTotal investment: $285,000 | Expected annual savings: $1,200,000' },
      { id: 's4', title: 'Strategic Impact', content: '| Metric | Current State | Future State | Improvement |\n|---|---|---|---|\n| Month-End Close | 6.2 days | 1.5 days | 76% faster |\n| Data Accuracy | 77% | 99.2% | +22 points |\n| Manual Tasks | 840 hrs/mo | 126 hrs/mo | 85% reduction |\n| Compliance Readiness | Manual | Automated | 100% coverage |' },
      { id: 's5', title: 'Next Steps', content: '1. **Executive alignment session** with CIO and VP Operations (Week 1)\n2. **Technical deep dive** with IT architecture team (Week 2)\n3. **Pilot scope definition** for production line #3 (Week 3)\n4. **Business case presentation** to leadership team (Week 4)\n5. **Contract and timeline finalization** (Week 5)' },
    ],
  },

  // ─── 5. Discovery Call Prep ───
  {
    contentType: 'discovery-call-prep',
    label: 'Discovery Call Prep',
    sections: [
      { id: 's1', title: 'Company Background', content: '**GlobalTech Industries** is a mid-market manufacturer ($340M revenue, 2,500 employees) headquartered in Detroit, MI. They produce precision components for automotive and aerospace sectors. Recently acquired a smaller competitor (Atlas Precision) and are now integrating two separate ERP systems.' },
      { id: 's2', title: 'Key Attendees', content: '**Sarah Chen** — VP Operations (Decision Maker)\n- 8 years at GlobalTech, promoted to VP 2 years ago\n- LinkedIn: Posted about "digital transformation fatigue" last month\n- Known pain: Manual reporting consuming her team\'s bandwidth\n\n**James Park** — Director of IT (Technical Evaluator)\n- Background in SAP and Oracle ERP implementations\n- Likely concerned about integration complexity and timeline\n- Will want to see API documentation and security certifications' },
      { id: 's3', title: 'Discovery Questions', content: '**Pain Discovery:**\n- "Walk me through what happens when a production order comes in — how many systems does it touch?"\n- "How much time does your team spend on month-end reconciliation?"\n- "What keeps you up at night about the Atlas integration?"\n\n**Impact Quantification:**\n- "If you could reclaim those 14 hours/week per manager, what would that team focus on?"\n- "What does a compliance gap cost you in audit remediation?"\n\n**Decision Process:**\n- "Beyond you and James, who else needs to weigh in?"\n- "What does your evaluation timeline look like?"' },
      { id: 's4', title: 'Competitive Intelligence', content: '- GlobalTech evaluated AutoFlow 18 months ago but did not move forward (unknown reason)\n- Their SAP environment suggests they may be considering SAP\'s native automation tools\n- Atlas Precision was using ManuTech — likely under contract through Q3\n- Key differentiator to emphasize: Our dual-ERP integration capability is unique' },
      { id: 's5', title: 'Meeting Agenda', content: '1. **Introductions & Context** (5 min) — Confirm attendees and objectives\n2. **Current State Discovery** (15 min) — Systems landscape, pain points, manual processes\n3. **Impact Quantification** (10 min) — Tie pains to dollars and time\n4. **Solution Preview** (10 min) — Brief demo of real-time integration\n5. **Evaluation Process** (5 min) — Timeline, stakeholders, next steps\n6. **Action Items** (5 min) — Confirm follow-up commitments' },
    ],
  },

  // ─── 6. ROI Business Case ───
  {
    contentType: 'roi-business-case',
    label: 'ROI Business Case',
    sections: [
      { id: 's1', title: 'Investment Summary', content: '**Total 3-Year Investment:** $685,000\n- Year 1: $285,000 (platform + implementation)\n- Year 2: $200,000 (license renewal + expansion)\n- Year 3: $200,000 (license renewal)\n\n**Total 3-Year Return:** $3,600,000\n**Net Present Value:** $2,340,000\n**Payback Period:** 4.8 months\n**3-Year ROI:** 425%' },
      { id: 's2', title: 'Cost Savings Breakdown', content: '| Category | Annual Savings | Calculation Basis |\n|---|---|---|\n| Labor Efficiency | $720,000 | 840 hrs/mo × $71/hr avg fully loaded |\n| Error Reduction | $340,000 | 23% error rate → 1.2%, $1,480 avg error cost |\n| Compliance | $180,000 | 3 audit findings/yr × $60K remediation |\n| Faster Close | $120,000 | 4.7 days saved × $25.5K/day opportunity cost |\n| Reduced Overtime | $95,000 | 280 OT hrs/mo eliminated |\n| **Total Annual** | **$1,455,000** | |' },
      { id: 's3', title: 'Revenue Impact', content: '**Faster Quote-to-Order:** Reducing cycle from 72hrs to 4hrs enables capturing 12% more orders\n- Estimated revenue uplift: $2.1M annually\n- Contribution margin impact: $630,000\n\n**Customer Retention:** Real-time order tracking reduces churn by an estimated 8%\n- Retained revenue: $1.8M annually\n\n**New Market Enablement:** Automated compliance unlocks aerospace Tier 1 contracts\n- Pipeline value: $4.5M over 3 years' },
      { id: 's4', title: 'Risk Analysis', content: '**Implementation Risk:** LOW\n- 340+ successful deployments in manufacturing\n- 92% on-time delivery rate\n- Dedicated implementation team with MFG expertise\n\n**Adoption Risk:** LOW-MEDIUM\n- No-code interface reduces training burden\n- Average user proficiency reached in 2.3 weeks\n- Change management support included\n\n**Technology Risk:** LOW\n- SOC 2 Type II certified\n- 99.97% uptime SLA with financial penalties\n- Data residency options for regulated industries' },
      { id: 's5', title: 'Sensitivity Analysis', content: '| Scenario | ROI | Payback |\n|---|---|---|\n| Conservative (50% of projected savings) | 212% | 9.6 months |\n| Base Case (100%) | 425% | 4.8 months |\n| Optimistic (130%) | 553% | 3.7 months |\n\nEven at 50% realization, the investment delivers 2.1x return with sub-10-month payback.' },
    ],
  },

  // ─── 7. Case Study ───
  {
    contentType: 'case-study',
    label: 'Case Study',
    sections: [
      { id: 's1', title: 'Client Profile', content: '**Meridian Manufacturing** is a $520M precision parts manufacturer with 3,800 employees across 6 facilities. They serve automotive OEMs and Tier 1 suppliers, processing over 2 million orders annually.' },
      { id: 's2', title: 'The Challenge', content: 'Meridian was struggling with:\n- **12 disconnected systems** requiring manual data entry at each handoff\n- **Month-end close taking 5+ days** with 3 full-time staff dedicated to reconciliation\n- **18% defect rate** in cross-system data transfers causing production delays\n- **$1.8M annual compliance remediation costs** from inconsistent reporting\n- **No visibility** into real-time production metrics for executive team' },
      { id: 's3', title: 'The Solution', content: 'Acme Solutions deployed a comprehensive automation platform in 78 days:\n\n**Phase 1:** Connected SAP ERP and Siemens MES for real-time production data streaming\n**Phase 2:** Deployed 23 automated workflows replacing manual data entry\n**Phase 3:** Launched executive dashboards with live KPIs across all 6 facilities\n**Phase 4:** Implemented automated compliance reporting for ISO 9001 and IATF 16949' },
      { id: 's4', title: 'The Results', content: '| Metric | Before | After | Impact |\n|---|---|---|---|\n| Month-End Close | 5 days | 8 hours | 80% faster |\n| Data Errors | 18% | 0.3% | 98% reduction |\n| Manual Data Entry | 1,200 hrs/mo | 180 hrs/mo | 85% reduction |\n| Compliance Costs | $1.8M/yr | $120K/yr | 93% savings |\n| Executive Visibility | None | Real-time | Complete |\n\n**Total Year 1 ROI: 4.8x**\n**Payback Period: 3.2 months**' },
      { id: 's5', title: 'Client Testimonial', content: '"Acme Solutions transformed how we operate. What used to take 5 days at month-end now takes 8 hours, and our executives have real-time visibility for the first time ever. The ROI was undeniable within the first quarter."\n\n— **Sarah Chen**, VP of Operations, Meridian Manufacturing' },
    ],
  },

  // ─── 8. Email Sequence ───
  {
    contentType: 'outbound-email-sequence',
    label: 'Email Sequence',
    sections: [
      { id: 's1', title: 'Email 1: Initial Outreach', content: '**Subject:** Quick question about GlobalTech\'s data reconciliation\n\n**Body:**\nHi Sarah,\n\nI noticed GlobalTech recently acquired Atlas Precision — congratulations. Integrating two ERP systems is one of the most operationally complex challenges in manufacturing.\n\nWe helped Meridian Manufacturing reduce their month-end close from 5 days to 8 hours after a similar acquisition. Their VP of Operations called it "the single highest-ROI project we\'ve done in a decade."\n\nWould a 15-minute call to share what worked for them be valuable?\n\nBest,\nAlex' },
      { id: 's2', title: 'Email 2: Value-Add Follow Up (Day 3)', content: '**Subject:** Re: Quick question about GlobalTech\'s data reconciliation\n\n**Body:**\nHi Sarah,\n\nFollowing up on my earlier note. I put together a quick benchmark comparing manufacturers who automated their ERP integration vs. those who did it manually:\n\n- **Manual integration:** Average 14 months, $2.1M total cost, 23% data error rate\n- **Automated integration:** Average 90 days, $285K total cost, 0.3% data error rate\n\nThe gap is significant. Happy to walk through the methodology if helpful.\n\nBest,\nAlex' },
      { id: 's3', title: 'Email 3: Social Proof (Day 7)', content: '**Subject:** How Atlas + GlobalTech could close the books in 8 hours\n\n**Body:**\nHi Sarah,\n\nThree manufacturers in your space deployed our platform this quarter:\n\n1. **Meridian Manufacturing** — 80% faster month-end close\n2. **Atlas Industrial** — Eliminated compliance gaps entirely\n3. **Nexus Precision** — $1.2M savings in Year 1\n\nAll three went live in under 90 days. I\'d love to share specifics on how they did it.\n\nWorth 15 minutes this week?\n\nBest,\nAlex' },
      { id: 's4', title: 'Email 4: Breakup (Day 14)', content: '**Subject:** Should I close the file?\n\n**Body:**\nHi Sarah,\n\nI\'ve reached out a few times about streamlining GlobalTech\'s ERP integration. I understand timing may not be right.\n\nIf this isn\'t a priority right now, no worries — I\'ll close the file on my end. But if the Atlas integration is keeping your team up at night, I\'m here to help.\n\nEither way, wishing you and the team the best.\n\nBest,\nAlex' },
    ],
  },

  // ─── 9. Proposal ───
  {
    contentType: 'proposal',
    label: 'Proposal',
    sections: [
      { id: 's1', title: 'Engagement Overview', content: 'This proposal outlines a comprehensive workflow automation engagement for GlobalTech Industries. The objective is to connect 12 disconnected systems, automate 85% of manual data entry, and deliver real-time operational visibility within 90 days.\n\n**Engagement Value:** $285,000\n**Timeline:** 12 weeks\n**Team:** 4 dedicated consultants + 1 project manager' },
      { id: 's2', title: 'Scope of Work', content: '**Phase 1: Foundation (Weeks 1-4)**\n- System audit and integration architecture design\n- SAP ERP and Siemens MES connector deployment\n- Real-time data streaming pipeline configuration\n- Initial dashboard framework setup\n\n**Phase 2: Automation (Weeks 5-8)**\n- Deploy 23 automated workflows across production, quality, and finance\n- Compliance engine configuration (SOX, ISO 9001)\n- User acceptance testing with operations team\n- Change management and training program\n\n**Phase 3: Optimization (Weeks 9-12)**\n- Executive dashboard rollout across all facilities\n- No-code workflow builder training for power users\n- Performance tuning and optimization\n- Go-live support and hypercare period' },
      { id: 's3', title: 'Investment Breakdown', content: '| Component | Cost |\n|---|---|\n| Platform License (Year 1) | $132,000 |\n| Implementation Services | $98,000 |\n| Integration Connectors | $30,000 |\n| Training & Change Mgmt | $15,000 |\n| Project Management | $10,000 |\n| **Total** | **$285,000** |\n\n**Year 2+ Renewal:** $200,000/year (license + support)\n**Payment Terms:** 50% at signing, 25% at Phase 2, 25% at go-live' },
      { id: 's4', title: 'Success Criteria', content: '- Month-end close reduced from 6.2 days to under 2 days\n- Manual data entry reduced by 85% or greater\n- Data accuracy improved from 77% to 99%+\n- Real-time dashboards live for all 6 facilities\n- Zero critical compliance gaps in next audit cycle\n- User adoption rate of 90%+ within 60 days of go-live' },
      { id: 's5', title: 'Terms & Conditions', content: '**Contract Duration:** 36 months\n**SLA Guarantee:** 99.97% uptime with financial penalties\n**Data Security:** SOC 2 Type II, ISO 27001, ITAR-compliant\n**Termination:** 90-day notice period after initial 12 months\n**Warranty:** 12-month defect warranty on all custom configurations\n**Support:** 24/7 enterprise support with 2-hour critical response SLA' },
    ],
  },

  // ─── 10. Implementation Timeline ───
  {
    contentType: 'implementation-timeline',
    label: 'Implementation Timeline',
    sections: [
      { id: 's1', title: 'Phase 1: Discovery & Architecture (Weeks 1-2)', content: '- **Week 1:** Kickoff meeting, stakeholder interviews, system inventory\n- **Week 2:** Integration architecture design, security review, environment provisioning\n- **Milestone:** Architecture approved by IT and Operations\n- **Owner:** Joint team — Acme Solutions + GlobalTech IT\n- **Risk:** ERP access provisioning may take 5-7 business days' },
      { id: 's2', title: 'Phase 2: Core Integration (Weeks 3-6)', content: '- **Week 3:** SAP ERP connector deployment and configuration\n- **Week 4:** Siemens MES connector deployment and real-time streaming setup\n- **Week 5:** Data mapping, transformation rules, and validation testing\n- **Week 6:** End-to-end integration testing and data reconciliation\n- **Milestone:** All core systems connected with validated data flow\n- **Owner:** Acme Solutions integration team\n- **Risk:** Custom field mappings may require additional SAP configuration' },
      { id: 's3', title: 'Phase 3: Workflow Automation (Weeks 7-9)', content: '- **Week 7:** Deploy production order workflows (8 workflows)\n- **Week 8:** Deploy quality and compliance workflows (9 workflows)\n- **Week 9:** Deploy finance and reporting workflows (6 workflows)\n- **Milestone:** All 23 workflows live and processing in parallel\n- **Owner:** Acme Solutions automation team + GlobalTech process owners\n- **Risk:** Process owner availability for UAT sessions' },
      { id: 's4', title: 'Phase 4: Dashboards & Training (Weeks 10-11)', content: '- **Week 10:** Executive dashboard deployment across all 6 facilities\n- **Week 11:** Power user training (no-code builder), admin training, end-user training\n- **Milestone:** All users trained and self-sufficient\n- **Owner:** Acme Solutions customer success team\n- **Deliverable:** Training documentation, video library, quick-reference cards' },
      { id: 's5', title: 'Phase 5: Go-Live & Hypercare (Week 12)', content: '- **Go-Live:** Full production cutover with Acme Solutions on-site support\n- **Hypercare:** 2-week dedicated support window (24/7 coverage)\n- **Milestone:** System operating independently with no critical issues\n- **Escalation Path:** Dedicated Slack channel, 2-hour critical SLA\n- **Post Go-Live:** Monthly business reviews for first 6 months' },
    ],
  },

  // ─── 11. Mutual Action Plan ───
  {
    contentType: 'mutual-action-plan',
    label: 'Mutual Action Plan',
    sections: [
      { id: 's1', title: 'Objective', content: 'Jointly execute the steps required to deploy Acme Solutions at GlobalTech Industries by **September 15, 2026**, enabling automated workflows across all 6 manufacturing facilities.\n\n**Shared Success Criteria:**\n- 85% reduction in manual data entry\n- Month-end close under 2 days\n- Real-time dashboards for executive team' },
      { id: 's2', title: 'Week 1-2: Evaluation & Alignment', content: '| Task | Owner | Due Date | Status |\n|---|---|---|---|\n| Technical deep dive with IT team | Acme (Alex) | Apr 7 | Scheduled |\n| Security questionnaire completion | GlobalTech (James) | Apr 10 | Pending |\n| Executive sponsor meeting | Acme (VP Sales) + GlobalTech (Sarah) | Apr 14 | Pending |\n| Reference call with Meridian Mfg | Acme (CSM) | Apr 11 | Pending |\n| ROI business case review | Both teams | Apr 14 | Pending |' },
      { id: 's3', title: 'Week 3-4: Decision & Procurement', content: '| Task | Owner | Due Date | Status |\n|---|---|---|---|\n| Final pricing proposal delivery | Acme (Alex) | Apr 18 | Pending |\n| Legal/procurement review | GlobalTech (Legal) | Apr 25 | Pending |\n| InfoSec review and approval | GlobalTech (James) | Apr 23 | Pending |\n| Contract negotiation | Both Legal teams | Apr 28 | Pending |\n| Contract signature | GlobalTech (Sarah) | Apr 30 | Pending |' },
      { id: 's4', title: 'Week 5-6: Kickoff & Planning', content: '| Task | Owner | Due Date | Status |\n|---|---|---|---|\n| Project kickoff meeting | Acme PM | May 5 | Pending |\n| System access provisioning | GlobalTech IT | May 7 | Pending |\n| Stakeholder interview scheduling | Acme PM | May 5 | Pending |\n| Architecture design workshop | Acme Architect + James | May 12 | Pending |\n| Implementation plan sign-off | Both teams | May 14 | Pending |' },
      { id: 's5', title: 'Risks & Mitigations', content: '| Risk | Impact | Mitigation | Owner |\n|---|---|---|---|\n| SAP access delayed | 1-week slip | Pre-submit access request at signing | James |\n| Legal review extends | 2-week slip | Engage legal in Week 2, not Week 3 | Sarah |\n| Key stakeholder unavailable | Scope gaps | Identify backups for all critical roles | Both |\n| Atlas integration complexity | Budget risk | Include Atlas scope in architecture phase | Acme |\n| Change resistance | Adoption risk | Executive comms plan + champion network | Sarah |' },
    ],
  },

  // ─── 12. LinkedIn Post ───
  {
    contentType: 'linkedin-post',
    label: 'LinkedIn Post',
    sections: [
      { id: 's1', title: 'Hook', content: 'Manufacturing leaders are spending $2.4M per year on a problem they don\'t even know they have.' },
      { id: 's2', title: 'Body', content: 'I just wrapped a project with a $340M manufacturer. Here\'s what we found:\n\n- 12 disconnected systems requiring manual data entry at every handoff\n- 14 hours per week per manager spent reconciling spreadsheets\n- A 23% error rate that was costing them $340K annually in rework\n\nThe kicker? They thought this was normal.\n\nWe deployed automated workflows in 90 days. The results:\n- Month-end close went from 5 days to 8 hours\n- Data errors dropped to 0.3%\n- They reclaimed 1,020 hours of labor per month\n\nThe ROI paid for the entire platform in 3.2 months.' },
      { id: 's3', title: 'Call to Action', content: 'If your manufacturing team is still reconciling data manually across multiple systems, you\'re leaving money on the table.\n\nDrop "AUTOMATE" in the comments and I\'ll share the playbook we used.' },
    ],
  },

  // ─── 13. Conference Leave-Behind ───
  {
    contentType: 'conference-leave-behind',
    label: 'Conference Leave-Behind',
    sections: [
      { id: 's1', title: 'The Manufacturing Automation Gap', content: '**87% of manufacturers** say digital transformation is critical. Only **12% have automated** their core workflows.\n\nThe gap is costing the industry **$847B annually** in operational inefficiency.' },
      { id: 's2', title: 'What We Do', content: 'Acme Solutions connects your manufacturing systems — ERP, MES, QMS, CRM — into a single real-time platform. No batch delays. No manual data entry. No compliance gaps.\n\n**200+ connectors** | **50+ manufacturing templates** | **90-day deployment**' },
      { id: 's3', title: 'By the Numbers', content: '- **340+ enterprise deployments** in manufacturing\n- **4.2x average ROI** in Year 1\n- **73% reduction** in manual processes\n- **99.97% uptime** SLA guarantee\n- **< 90 days** average go-live' },
      { id: 's4', title: 'Customer Results', content: '**Meridian Manufacturing:** Month-end close from 5 days to 8 hours\n**Atlas Industrial:** Eliminated 100% of compliance gaps\n**Nexus Precision:** $1.2M savings in Year 1\n**Sterling Dynamics:** 85% reduction in data entry errors' },
      { id: 's5', title: 'Next Steps', content: 'Scan the QR code or visit **acmesolutions.com/manufacturing** to:\n- Get a free workflow assessment\n- See a live demo with your data\n- Access our manufacturing automation playbook\n\n**Contact:** Alex Rivera | alex@acmesolutions.com | (555) 123-4567' },
    ],
  },

  // ─── 14. Objection Handling Guide ───
  {
    contentType: 'objection-handling-guide',
    label: 'Objection Handling Guide',
    sections: [
      { id: 's1', title: 'Price Objections', content: '**"Your solution is too expensive"**\n\n**Acknowledge:** "I understand budget is a key consideration."\n\n**Reframe:** "When you factor in the 14 hours/week per manager currently spent on manual reconciliation, plus the $340K in annual rework from data errors, the status quo is actually costing more than our platform."\n\n**Proof Point:** "Meridian Manufacturing\'s CFO told us the platform paid for itself in 3.2 months. Would it be helpful to walk through the math together?"' },
      { id: 's2', title: 'Timing Objections', content: '**"We\'re not ready to make a change right now"**\n\n**Acknowledge:** "Totally fair — timing matters."\n\n**Explore:** "Help me understand what would need to be true for this to become a priority. Is it the Atlas integration timeline? Budget cycle? Something else?"\n\n**Create Urgency:** "The manufacturers who automated before their next compliance audit saved an average of $180K in remediation. When is your next audit cycle?"' },
      { id: 's3', title: 'Competitor Objections', content: '**"We\'re already evaluating Competitor A"**\n\n**Acknowledge:** "Great — evaluating options thoroughly is smart."\n\n**Differentiate:** "One question worth asking them: Can their platform stream real-time data from your shop floor, or does it batch every 24 hours? That distinction is the difference between making decisions on today\'s data vs. yesterday\'s."\n\n**Landmine:** "Also ask about their compliance coverage — SOX and ISO are included with us, but they charge an add-on for compliance modules."' },
      { id: 's4', title: 'Authority Objections', content: '**"I need to get my CIO/CFO involved"**\n\n**Acknowledge:** "Absolutely — this is a cross-functional decision."\n\n**Enable:** "We put together executive-ready materials for exactly this scenario. I can prepare a 2-page ROI summary customized for GlobalTech that Sarah can present to the leadership team."\n\n**Offer:** "Would it also help if our VP of Customer Success joined the next call? She led the Meridian deployment and can speak to the technical and financial outcomes."' },
      { id: 's5', title: 'Risk Objections', content: '**"What if the implementation fails?"**\n\n**Acknowledge:** "That\'s the right question to ask."\n\n**De-risk:** "A few things that separate us:\n- 340+ successful deployments with a 92% on-time delivery rate\n- 99.97% uptime SLA with financial penalties — we put our money behind it\n- A dedicated implementation team that has done this 50+ times in manufacturing specifically\n- 2-week hypercare period after go-live with 24/7 support"\n\n**Proof:** "I can connect you with James Park at Nexus Precision — they were in a similar position and went live in 78 days."' },
    ],
  },

  // ─── 15. Post Demo Follow Up ───
  {
    contentType: 'post-demo-follow-up',
    label: 'Post Demo Follow Up',
    sections: [
      { id: 's1', title: 'Meeting Summary', content: 'Thank you, Sarah and James, for a productive demo session today. Here is a summary of what we covered:\n\n- **Real-time integration demo:** Showed live SAP-to-MES data streaming with < 2 second latency\n- **No-code workflow builder:** Built a sample QC workflow together in 8 minutes\n- **Executive dashboard:** Previewed live KPI dashboard with multi-facility roll-up\n- **Compliance automation:** Demonstrated automated ISO 9001 audit trail generation' },
      { id: 's2', title: 'Key Questions Raised', content: '| Question | Answer | Status |\n|---|---|---|\n| Can you support dual-ERP (SAP + Oracle)? | Yes — we have native connectors for both | Confirmed |\n| What is the data migration approach? | Phased migration with parallel run period | Follow-up doc coming |\n| How do you handle ITAR compliance? | Built-in ITAR module with access controls | Demo scheduled |\n| Can we pilot on one production line first? | Yes — recommended approach | Included in proposal |\n| What does the training program look like? | 3-tier: admin, power user, end user | Details in proposal |' },
      { id: 's3', title: 'Agreed Next Steps', content: '1. **Acme Solutions** to deliver customized proposal by **Friday, April 10**\n2. **James** to complete security questionnaire by **April 14**\n3. **Acme Solutions** to schedule ITAR compliance deep-dive by **April 11**\n4. **Sarah** to schedule executive sponsor meeting with CFO for **week of April 14**\n5. **Acme Solutions** to arrange reference call with Meridian Manufacturing by **April 11**' },
      { id: 's4', title: 'Relevant Resources', content: '- **Meridian Manufacturing Case Study:** How they reduced month-end close from 5 days to 8 hours\n- **Manufacturing Automation ROI Calculator:** Customized for GlobalTech\'s data\n- **Security & Compliance Whitepaper:** SOC 2, ISO 27001, and ITAR coverage details\n- **Integration Architecture Guide:** Technical reference for SAP and MES connectors\n- **No-Code Builder Documentation:** Self-service workflow creation guide' },
      { id: 's5', title: 'Your Dedicated Team', content: '**Alex Rivera** — Account Executive | alex@acmesolutions.com | (555) 123-4567\n**Maria Santos** — Solutions Architect | maria@acmesolutions.com\n**David Kim** — Customer Success Manager | david@acmesolutions.com\n\nWe are excited about the opportunity to partner with GlobalTech Industries. Please don\'t hesitate to reach out with any questions before our next meeting.' },
    ],
  },
];

// ════════════════════════════════════════════════════════
// QA Check Functions
// ════════════════════════════════════════════════════════

interface QAResult {
  contentType: string;
  label: string;
  styleName: string;
  styleId: string;
  fileName: string;
  pass: boolean;
  issues: string[];
}

function checkDocument(html: string, spec: TestSpec): string[] {
  const issues: string[] = [];

  // 1. Empty sections — look for section containers with no real content
  const sectionBodies = html.match(/class="section-body"[^>]*>([\s\S]*?)<\/div>/gi) || [];
  const emptySections = sectionBodies.filter(s => {
    const inner = s.replace(/<[^>]+>/g, '').trim();
    return inner.length < 10;
  });
  if (emptySections.length > 0) {
    issues.push(`${emptySections.length} empty/near-empty section(s) detected`);
  }

  // Also check generic patterns for empty content
  if (html.includes('>{}</') || html.includes('>undefined</') || html.includes('>null</')) {
    issues.push('Contains raw undefined/null/empty object in output');
  }

  // 2. Raw markdown — look for unrendered markdown syntax
  // Check for markdown outside of code/pre blocks
  const bodyContent = html.replace(/<code[\s\S]*?<\/code>/gi, '').replace(/<pre[\s\S]*?<\/pre>/gi, '');
  const rawMdPatterns = [
    { pattern: /(?:^|\n)\s*#{1,4}\s+\w/m, name: 'unrendered heading (#)' },
    { pattern: /\*\*[^*<]{3,}\*\*/m, name: 'unrendered bold (**text**)' },
    { pattern: /(?:^|\n)\s*[-*]\s+\w/m, name: 'possible unrendered bullet list' },
  ];

  // Only flag raw markdown if it appears in the final rendered HTML (not inside tags)
  const textOnly = bodyContent.replace(/<[^>]+>/g, ' ');
  if (/\*\*[^*]{3,}\*\*/.test(textOnly)) {
    issues.push('Raw markdown bold (**text**) visible in rendered output');
  }

  // 3. Broken layout — check for essential CSS/structure
  if (!html.includes('max-width') && !html.includes('max-height')) {
    issues.push('No max-width constraint found — potential layout overflow');
  }

  if (!html.includes('<!DOCTYPE html>') && !html.includes('<!doctype html>')) {
    issues.push('Missing DOCTYPE declaration');
  }

  if (!html.includes('<style>') && !html.includes('<style ')) {
    issues.push('No embedded styles found — layout likely broken');
  }

  // 4. Missing logo — check for logo/wordmark presence
  if (!html.includes(COMPANY_NAME) && !html.includes('logo')) {
    issues.push('Company name/logo not found in document');
  }

  // 5. Missing stats/metrics — for types that should have them
  const statsTypes = ['solution-one-pager', 'roi-business-case', 'case-study', 'executive-summary', 'conference-leave-behind'];
  if (statsTypes.includes(spec.contentType)) {
    // Check that numbers/stats appear in the output
    const numbers = textOnly.match(/\d+[%x$KMB]/g) || [];
    if (numbers.length < 2) {
      issues.push('Few or no statistics/metrics visible in a stats-heavy document type');
    }
  }

  // 6. Check for table rendering (types with tables)
  const tableTypes = ['competitive-analysis', 'battle-card', 'roi-business-case', 'case-study', 'mutual-action-plan', 'post-demo-follow-up', 'executive-summary'];
  if (tableTypes.includes(spec.contentType)) {
    if (!html.includes('<table') && !html.includes('<tr')) {
      // Tables might be in the content — check if pipe characters are raw
      if (textOnly.includes(' | ') && !html.includes('<table')) {
        issues.push('Raw markdown table (pipe characters) visible — table not rendered as HTML');
      }
    }
  }

  // 7. Check for reasonable document size
  if (html.length < 500) {
    issues.push('Document suspiciously short — possible rendering failure');
  }

  // 8. Check for section title rendering
  const titleCount = spec.sections.length;
  let titlesFound = 0;
  for (const sec of spec.sections) {
    if (html.includes(sec.title)) titlesFound++;
  }
  if (titlesFound < titleCount * 0.5) {
    issues.push(`Only ${titlesFound}/${titleCount} section titles found in output`);
  }

  return issues;
}

// ════════════════════════════════════════════════════════
// Generate Documents & Report
// ════════════════════════════════════════════════════════

function run() {
  const outDir = path.resolve(__dirname);
  const results: QAResult[] = [];

  for (const spec of testSpecs) {
    const styleId = getDefaultStyleForContentType(spec.contentType);
    const style = getStyle(styleId);

    if (!style) {
      results.push({
        contentType: spec.contentType,
        label: spec.label,
        styleName: 'MISSING',
        styleId,
        fileName: '',
        pass: false,
        issues: [`Style ${styleId} not found in registry`],
      });
      continue;
    }

    const input: StyleInput = {
      sections: spec.sections,
      contentType: spec.contentType,
      prospect: PROSPECT,
      companyName: COMPANY_NAME,
      companyDescription: COMPANY_DESC,
      accentColor: ACCENT,
      date: 'April 1, 2026',
    };

    let html: string;
    try {
      html = style.render(input);
    } catch (err: any) {
      results.push({
        contentType: spec.contentType,
        label: spec.label,
        styleName: style.name,
        styleId,
        fileName: '',
        pass: false,
        issues: [`Render threw an error: ${err.message}`],
      });
      continue;
    }

    const fileName = `${spec.contentType}.html`;
    const filePath = path.join(outDir, fileName);
    fs.writeFileSync(filePath, html, 'utf-8');

    const issues = checkDocument(html, spec);

    results.push({
      contentType: spec.contentType,
      label: spec.label,
      styleName: style.name,
      styleId,
      fileName,
      pass: issues.length === 0,
      issues,
    });

    console.log(`${issues.length === 0 ? 'PASS' : 'FAIL'} | ${spec.label} (${style.name} / ${styleId}) ${issues.length > 0 ? '— ' + issues.join('; ') : ''}`);
  }

  // ── Build the QA Report ──
  const passCount = results.filter(r => r.pass).length;
  const failCount = results.filter(r => !r.pass).length;

  const cards = results.map(r => {
    const statusColor = r.pass ? '#22c55e' : '#ef4444';
    const statusLabel = r.pass ? 'PASS' : 'FAIL';
    const issueList = r.issues.length > 0
      ? `<ul style="margin:4px 0 0 16px;font-size:11px;color:#dc2626;">${r.issues.map(i => `<li>${i}</li>`).join('')}</ul>`
      : '';

    const iframeSrc = r.fileName || 'about:blank';

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <span class="status" style="background:${statusColor};">${statusLabel}</span>
            <strong>${r.label}</strong>
          </div>
          <div class="card-meta">${r.styleName} (${r.styleId})</div>
        </div>
        ${issueList}
        <div class="card-preview">
          <iframe src="${iframeSrc}" sandbox="allow-same-origin" loading="lazy"></iframe>
        </div>
      </div>
    `;
  }).join('\n');

  const report = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ContentForg QA Report — ${new Date().toISOString().split('T')[0]}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 32px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header .summary {
      font-size: 16px;
      color: #94a3b8;
    }
    .header .summary .pass-count { color: #22c55e; font-weight: 700; }
    .header .summary .fail-count { color: #ef4444; font-weight: 700; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .card {
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
    }
    .card-header {
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #334155;
    }
    .card-header strong {
      font-size: 14px;
      margin-left: 8px;
    }
    .card-meta {
      font-size: 12px;
      color: #64748b;
    }
    .status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card-preview {
      position: relative;
      width: 100%;
      height: 480px;
      overflow: hidden;
      background: #fff;
    }
    .card-preview iframe {
      width: 250%;
      height: 250%;
      border: none;
      transform: scale(0.4);
      transform-origin: top left;
      pointer-events: none;
    }
    ul {
      padding: 8px 18px 8px 32px;
      background: #1a1a2e;
      border-bottom: 1px solid #334155;
    }
    ul li {
      margin-bottom: 2px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ContentForg QA Test Report</h1>
    <div class="summary">
      ${results.length} documents tested &mdash;
      <span class="pass-count">${passCount} passed</span> /
      <span class="fail-count">${failCount} failed</span>
      &mdash; ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>
  <div class="grid">
    ${cards}
  </div>
</body>
</html>`;

  const reportPath = path.join(outDir, 'qa-report.html');
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log(`\n══════════════════════════════════════`);
  console.log(`QA Report: ${passCount} PASS / ${failCount} FAIL`);
  console.log(`Report saved to: ${reportPath}`);
  console.log(`══════════════════════════════════════`);
}

run();
