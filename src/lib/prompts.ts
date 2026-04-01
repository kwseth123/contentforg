import { ContentType, KnowledgeBase, ProspectInfo, ProductProfile, PersonaConfig } from './types';

export const CONTENT_RICHNESS_RULES = `

═══ CONTENT QUALITY RULES (APPLY TO EVERY DOCUMENT) ═══

SPECIFICITY: Use the prospect's company name at least 3 times throughout the document — not just in the header. Reference their specific industry at least twice using industry-specific terminology. Never write generic statements that could apply to any company — every sentence should feel written specifically for this prospect.

CLAIM STRENGTH: Every benefit statement must include either a specific metric, a timeframe, or a comparison. Never write "improve efficiency" — write "reduce pick times by 40% in the first 30 days." If no specific metric exists in the knowledge base, use a credible industry range and note it as "typical" or "industry benchmark."

FORWARD MOMENTUM: Every section must end with a statement that pulls the reader toward the next section or toward action. No section should feel like a dead end. Use transitional language that creates urgency.

PROOF: Every document must include at least one specific customer reference, result, or analogy — even if framed as "companies like yours typically..." Pull from the knowledge base customer wins. If none exist, use industry benchmark language like "organizations in [industry] typically see..."

VOICE: Write like a confident sales professional who knows this industry deeply — not like a marketing brochure. Short punchy sentences. Active voice. No passive constructions. No corporate jargon. No "leverage," "synergy," "holistic," or "cutting-edge."

SURPRISE: Include one unexpected insight, stat, or angle that the prospect probably hasn't heard before. This is the sentence that makes them forward the document to their boss.

`;

export function buildSystemPrompt(kb: KnowledgeBase, product?: ProductProfile): string {
  let prompt = `You are ContentForg, an expert B2B sales content generator for ${kb.companyName || 'the company'}.

## Company Information
- **Company:** ${kb.companyName}
- **Tagline:** ${kb.tagline}
- **Website:** ${kb.website}
- **About Us:** ${kb.aboutUs}

## Products & Services
${kb.products.map((p) => `### ${p.name}\n${p.description}\n**Key Features:** ${p.keyFeatures.join(', ')}\n**Pricing:** ${p.pricing}`).join('\n\n')}

## Key Differentiators
${kb.differentiators}

## Ideal Customer Profile
- **Industries:** ${kb.icp.industries.join(', ')}
- **Company Size:** ${kb.icp.companySize}
- **Personas:** ${kb.icp.personas.join(', ')}

## Competitive Landscape
${kb.competitors.map((c) => `### vs. ${c.name}\n${c.howWeBeatThem}`).join('\n\n')}

## Brand Voice
- **Tone:** ${kb.brandVoice.tone}
- **Words to Use:** ${kb.brandVoice.wordsToUse.join(', ')}
- **Words to Avoid:** ${kb.brandVoice.wordsToAvoid.join(', ')}

## Case Studies
${kb.caseStudies.map((cs) => `### ${cs.title}\n${cs.content}`).join('\n\n')}

## Uploaded Knowledge Base Documents
${kb.uploadedDocuments.map((doc) => `### ${doc.fileName}\n${doc.content}`).join('\n\n')}`;

  // Inject strict brand guidelines when available
  if (kb.brandGuidelines) {
    const bg = kb.brandGuidelines;
    const approvedTerms = bg.voice.approvedTerms || [];
    const bannedTerms = bg.voice.bannedTerms || [];
    const guidelinesText = bg.voice.guidelinesText || '';
    const documentContent = bg.voice.documentContent || '';
    const tagline = bg.voice.tagline || '';

    if (approvedTerms.length > 0 || bannedTerms.length > 0 || guidelinesText || documentContent || tagline) {
      prompt += `\n\n## STRICT BRAND GUIDELINES — YOU MUST FOLLOW THESE EXACTLY`;

      if (approvedTerms.length > 0) {
        prompt += `\n### Approved Terminology (use these words/phrases):\n${approvedTerms.join(', ')}`;
      }

      if (bannedTerms.length > 0) {
        prompt += `\n\n### BANNED Terminology (NEVER use these words):\n${bannedTerms.join(', ')}`;
      }

      if (guidelinesText || documentContent) {
        prompt += `\n\n### Brand Voice Guidelines:`;
        if (guidelinesText) prompt += `\n${guidelinesText}`;
        if (documentContent) prompt += `\n${documentContent}`;
      }

      if (tagline) {
        prompt += `\n\n### Tagline (include where appropriate):\n${tagline}`;
      }

      prompt += `\n\nCRITICAL: Never use any banned terms. Always follow the brand voice. Use approved terminology whenever possible.`;
    }
  }

  // Append product context if provided
  if (product) {
    prompt += buildProductContext(product);
  }

  prompt += `

IMPORTANT RULES:
- Always ground content in the company's real information above
- Follow the brand voice guidelines strictly
- Never make up statistics, customer names, or claims not supported by the knowledge base
- Be confident, ROI-focused, and professional — no fluff
- Write for B2B sales audiences

## VISUAL RENDERING RULES
When generating document content, always choose the best visual format for each section. Follow these rules strictly:

- Any comparison between two things → render as a comparison table with headers, never as prose
- Any list of 3+ metrics or results → render as stat callout cards (large number, label below)
- Any process with sequential steps → render as numbered steps, not bullet points
- Any before/after scenario → render as two columns: Before (with issues) and After (with improvements)
- Any timeline or phases → describe as phases with durations and milestones
- Any pricing information → present as structured pricing tiers
- Any list of 4+ features or benefits → render as a grid with an emoji icon, bold title, and one-sentence description per item
- Any competitive information → render as a comparison table with clear win/loss indicators (✅/❌)
- Testimonials or quotes → present in blockquote format with attribution
- Key statistics → present as large prominent numbers with labels

NEVER render important data as plain bullet points when a more visual format exists.
Vary the visual treatment across sections — no two consecutive sections should use the same format.`;

  return prompt + CONTENT_RICHNESS_RULES;
}

function toneInstruction(toneLevel: number): string {
  if (toneLevel <= 20) return 'Use a highly formal, executive-level tone. No contractions, no colloquialisms.';
  if (toneLevel <= 40) return 'Use a professional but approachable tone. Minimal contractions allowed.';
  if (toneLevel <= 60) return 'Use a balanced professional tone — confident and clear, occasional contractions OK.';
  if (toneLevel <= 80) return 'Use a conversational, friendly professional tone. Contractions welcome, be personable.';
  return 'Use a casual, conversational tone. Be direct, personable, and energetic — like talking to a colleague.';
}

const CONTENT_TEMPLATES: Record<ContentType, (prospect: ProspectInfo, toneLevel: number) => string> = {
  'competitive-analysis': (prospect, toneLevel) => `Generate a detailed competitive analysis for selling to ${prospect.companyName} in the ${prospect.industry} industry.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Executive Overview
Brief overview of the competitive landscape for this prospect. If competitor intelligence data is provided below, reference their actual positioning and market claims.

## SECTION: Side-by-Side Comparison Table
Create a detailed comparison table covering 8-10 dimensions (e.g., core capabilities, integration depth, implementation speed, pricing model, support quality, scalability, security/compliance, reporting, user experience, industry specialization).
For each dimension, use these indicators:
- Where we clearly win, mark with a checkmark
- Where the competitor wins, mark with an X
- Where roughly equal, mark with a warning/caution indicator
If competitor intelligence data is available, use their actual features and claims. Otherwise use knowledge base information.

## SECTION: Positioning & Messaging Comparison
Compare their positioning language vs. ours. What do they emphasize? What do we emphasize? Where do the messages diverge? If competitor taglines and positioning are available from research data, quote them directly.

## SECTION: Competitor Weaknesses & Vulnerabilities
Known weaknesses of competitors relevant to this deal. If G2 review data is available, cite actual negative themes and complaints from real users. These are powerful ammunition for reps.

## SECTION: Talk Tracks — 5 Scenarios
Provide 5 specific talk tracks for common prospect objections or comparisons to the competitor:
1. "We're already evaluating [Competitor]" — how to respond
2. "[Competitor] has feature X that you don't" — how to reframe
3. "[Competitor] is cheaper" — how to shift the conversation to value
4. "We saw [Competitor]'s demo and liked it" — how to differentiate
5. "[Competitor]'s customer reference was strong" — how to counter with our proof points
For each: the exact objection, what the prospect really means, and a word-for-word response script.

## SECTION: Verdict — When We Win, When They Win
Honest assessment:
- **When we win:** The deal profiles, use cases, and buyer priorities where we consistently beat this competitor
- **When they win:** Where the competitor has genuine advantages (so reps can qualify early)
- **How to disqualify early:** Red flags that suggest this deal favors the competitor — save the rep's time

## SECTION: Recommended Strategy
How to position and win this specific deal with ${prospect.companyName}. Include timing recommendations and key proof points to deploy.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'solution-one-pager': (prospect, toneLevel) => `Create a compelling solution one-pager for ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: The Challenge
What ${prospect.companyName} is facing — tied to their pain points: ${prospect.painPoints}

## SECTION: Our Solution
How our product/service directly solves their challenges.

## SECTION: Key Benefits
3-5 quantifiable benefits with ROI focus.

## SECTION: How It Works
Simple explanation of implementation/adoption.

## SECTION: Why Us
Differentiators that matter most to ${prospect.industry} companies of size ${prospect.companySize}.

## SECTION: Next Steps
Clear call to action.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'battle-card': (prospect, toneLevel) => `Create an internal sales battle card for selling against competitors to win ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Quick Facts
Key prospect details at a glance. Include competitor name, their positioning, and their key claims if competitor intelligence data is available.

## SECTION: Side-by-Side Comparison
Create a comparison table across 8-10 key dimensions (core features, integrations, pricing, implementation, support, scalability, security, UX, industry fit, innovation pace).
Use these indicators for each:
- Checkmark where we win
- X where they win
- Caution indicator where roughly equal
If real competitor data is provided, use their actual features and claims.

## SECTION: Our Strengths
Top reasons we win deals like this. Be specific with proof points and metrics.

## SECTION: Their Weaknesses (From Real Data)
Known weaknesses of this competitor. If G2 review data or website research is available, cite actual complaints and negative themes. These are the real vulnerabilities reps should exploit.

## SECTION: Their Positioning vs. Ours
What they say about themselves (quote their actual taglines and messaging if available) vs. what we say. Where does their message fall apart under scrutiny?

## SECTION: Landmines to Set
Questions to ask the prospect that expose competitor weaknesses. Frame each as a discovery question that naturally leads the prospect to see the gap.

## SECTION: Talk Tracks — 5 Objection Responses
5 specific talk tracks for when prospects bring up this competitor:
1. "We're also looking at [Competitor]" — response script
2. "[Competitor] seems to have more features" — reframe script
3. "[Competitor] is less expensive" — value-shift script
4. "Our team already knows [Competitor]" — migration/ease script
5. "[Competitor] showed us X capability" — counter with differentiation
For each: the exact words to say, not just talking points.

## SECTION: Proof Points
Relevant case studies, metrics, and customer wins — especially against this specific competitor.

## SECTION: Verdict — Win/Loss Profile
- **We win when:** Deal characteristics that favor us
- **They win when:** Deal characteristics that favor them
- **Disqualify early if:** Red flags that this deal is a poor fit

## SECTION: Closing Strategy
How to drive this deal to close against this specific competitor.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'outbound-email-sequence': (prospect, toneLevel) => `Create a 5-email outbound sequence targeting ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Email 1 — Cold Open
First touch — grab attention with a relevant hook tied to ${prospect.painPoints}.

## SECTION: Email 2 — Value Add
Provide value — share an insight or relevant case study.

## SECTION: Email 3 — Social Proof
Leverage customer wins and proof points.

## SECTION: Email 4 — Competitive Angle
Subtle competitive positioning if they're using ${prospect.techStack}.

## SECTION: Email 5 — Break Up
Final attempt with a clear CTA.

For each email include: Subject line, body, and CTA.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'executive-summary': (prospect, toneLevel) => `Create an executive summary document for ${prospect.companyName}'s leadership team.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Executive Overview
High-level summary of the opportunity and proposed partnership.

## SECTION: Business Challenges
Key challenges facing ${prospect.companyName} in ${prospect.industry}: ${prospect.painPoints}

## SECTION: Proposed Solution
Our recommended solution and approach.

## SECTION: Expected Outcomes
Projected ROI, efficiency gains, and business impact.

## SECTION: Investment Overview
High-level pricing and timeline.

## SECTION: Why Partner With Us
Differentiators and relevant experience.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'conference-leave-behind': (prospect, toneLevel) => `Create a conference leave-behind document for ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Who We Are
Brief, compelling company introduction.

## SECTION: The Problem We Solve
Industry challenges we address in ${prospect.industry}.

## SECTION: Our Approach
What makes our solution unique.

## SECTION: Results That Matter
Key metrics and success stories.

## SECTION: Getting Started
Simple next steps and contact information.

This should be scannable, visually oriented (suggest layout), and memorable. Think high-impact, low word count.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'case-study': (prospect, toneLevel) => `Create a detailed case study document tailored for ${prospect.companyName} in the ${prospect.industry} industry.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Headline Result
A bold, metric-driven headline that summarizes the outcome. Format: "[Company] achieved [result] with [our solution]". Make it specific and compelling.

## SECTION: The Challenge
What the customer was facing before our solution. Tie this to pain points similar to ${prospect.companyName}'s: ${prospect.painPoints}. Include context about industry, company size, and why the status quo was unsustainable.

## SECTION: The Solution
How our product/service was implemented. Describe the approach, timeline, and key features used. Be specific about what made our solution the right fit.

## SECTION: Key Metrics & Results
Present 3-5 quantifiable results in callout box format. Each metric should have:
- The number/percentage
- What it measures
- The timeframe
Format each as: **[METRIC]** — [description]

## SECTION: Customer Quote
[PLACEHOLDER: Insert customer testimonial here]
Provide a suggested quote that captures the transformation story. Note: "Replace with actual customer quote before distribution."

## SECTION: Why This Matters for ${prospect.companyName}
Connect the case study results directly to ${prospect.companyName}'s situation and pain points.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'roi-business-case': (prospect, toneLevel) => `Create a compelling ROI / Business Case document for ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: The Cost of the Problem
Quantify the dollar impact of ${prospect.companyName}'s current pain points: ${prospect.painPoints}. Break down costs by category: labor waste, error costs, opportunity costs, and competitive risk. Use realistic estimates for a ${prospect.companySize} ${prospect.industry} company.

## SECTION: Investment vs. Return
Present a clear comparison table:
| Category | Current Cost | With Our Solution | Savings |
Include: direct costs, indirect costs, and hidden costs. Show the total annual investment required vs. total annual return.

## SECTION: Payback Period Analysis
Calculate and present the expected payback period. Show month-by-month cumulative ROI. Include break-even point and time-to-value milestones.

## SECTION: Cost of Inaction
What happens if ${prospect.companyName} does nothing? Quantify the 1-year, 3-year, and 5-year cost of maintaining the status quo. Include competitive risk, market share erosion, and compounding inefficiency costs.

## SECTION: Three-Year Value Summary
Summarize the total 3-year financial impact: total investment, total return, net benefit, and ROI percentage. Present as an executive-ready summary.

## SECTION: Recommended Next Steps
Clear path forward with timeline and decision points.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'proposal-framework': (prospect, toneLevel) => `Create a comprehensive proposal framework for ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Cover Page
Company-to-company proposal title, date, prepared for [prospect name], prepared by [our company]. Professional, branded header.

## SECTION: Situation Summary
Demonstrate understanding of ${prospect.companyName}'s current state, challenges, and goals. Reference their industry (${prospect.industry}), size (${prospect.companySize}), tech stack (${prospect.techStack}), and pain points: ${prospect.painPoints}. Show you've done your homework.

## SECTION: Recommended Solution
Detail our proposed solution with clear alignment to their stated needs. Include solution components, features to deploy, and why this configuration is right for them.

## SECTION: Implementation Plan
Phased rollout plan with timeline, milestones, and resource requirements. Include:
- Phase 1: Discovery & Setup
- Phase 2: Configuration & Integration
- Phase 3: Training & Rollout
- Phase 4: Optimization & Support

## SECTION: Investment & ROI
Frame pricing as investment, not cost. Show the expected return. Include:
- Solution investment breakdown
- Expected annual savings
- ROI percentage
- Payback period
Position as "investment that pays for itself."

## SECTION: Next Steps
Specific, time-bound actions. Include decision timeline, key contacts, and immediate next action. Make it easy to say yes.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'implementation-timeline': (prospect, toneLevel) => `Create a detailed implementation timeline for ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Implementation Overview
High-level summary of the implementation approach, total duration, and key success criteria. Set expectations for ${prospect.companyName}.

## SECTION: Phase 1 — Discovery & Planning (Weeks 1-2)
Milestones: requirements gathering, stakeholder alignment, project plan finalization.
Responsibilities: who does what (our team vs. ${prospect.companyName}'s team).
Deliverables: project charter, requirements document, success criteria.

## SECTION: Phase 2 — Configuration & Integration (Weeks 3-6)
Milestones: system setup, integration with ${prospect.techStack}, data migration, custom configuration.
Responsibilities: technical leads, IT coordination, testing.
Deliverables: configured environment, integration documentation, test results.

## SECTION: Phase 3 — Training & User Acceptance (Weeks 7-8)
Milestones: admin training, end-user training, UAT sign-off.
Responsibilities: training leads, department champions, UAT team.
Deliverables: training materials, UAT sign-off document, go-live checklist.

## SECTION: Phase 4 — Go-Live & Optimization (Weeks 9-10)
Milestones: production launch, monitoring period, optimization review.
Go-live date: [TARGET DATE — 10 weeks from kickoff]
Responsibilities: support team, success manager, executive sponsor.
Deliverables: go-live confirmation, 30-day review, optimization plan.

## SECTION: Milestone Summary Table
| Phase | Milestone | Owner | Target Date | Status |
Present all milestones in a single visual table for executive tracking.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'renewal-upsell': (prospect, toneLevel) => `Create a renewal/upsell one-pager for existing customer ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Results Achieved Together
Summarize the key wins since ${prospect.companyName} became a customer. Include specific metrics, improvements, and value delivered. Make them feel good about the partnership.

## SECTION: ROI to Date
Quantify the return on investment. Show total value delivered vs. total investment. Include time saved, costs reduced, revenue impacted, and efficiency gains for a ${prospect.companySize} ${prospect.industry} company.

## SECTION: Expansion Opportunity
Present the natural next step. What additional capabilities would accelerate their results? Tie expansion to their evolving needs and pain points: ${prospect.painPoints}. Position as "unlocking the next level."

## SECTION: New Features & Capabilities
Highlight recently released features and upcoming roadmap items relevant to ${prospect.companyName}. Show continued innovation and investment in the platform.

## SECTION: Renewal & Growth Recommendation
Specific renewal terms and expansion package. Frame as continued partnership investment. Include what's included, what's new, and the business case for expansion.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'product-feature-sheet': (prospect, toneLevel) => `Create a comprehensive product feature sheet tailored for ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Product Overview
Single-paragraph elevator pitch of the product. What it does, who it's for, and the core value proposition. Tailored to ${prospect.industry}.

## SECTION: Key Features
Deep dive into 5-7 core features. For each feature:
- **Feature Name**
- What it does (1-2 sentences)
- Why it matters to ${prospect.companyName}

## SECTION: Benefits by Role
How different stakeholders benefit:
- **Executives:** strategic value
- **Managers:** operational value
- **End Users:** daily productivity value

## SECTION: Technical Specifications
Integration capabilities (especially with ${prospect.techStack}), security, scalability, deployment options, and compliance. Present as a clean spec table.

## SECTION: Use Cases
3-4 specific use cases relevant to ${prospect.industry} companies of ${prospect.companySize} size. Each with: scenario, solution, and outcome.

## SECTION: Getting Started
How to evaluate, trial, or purchase. Clear next step.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'comparison-guide': (prospect, toneLevel) => `Create an honest and confident comparison guide for ${prospect.companyName} evaluating solutions.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Why This Comparison Matters
Set the context: ${prospect.companyName} is evaluating solutions to address: ${prospect.painPoints}. Explain what matters most when choosing a solution in ${prospect.industry}.

## SECTION: Visual Comparison Table
Create a comprehensive comparison table:
| Capability | Us | Alternative A | Alternative B |
Cover: core features, integrations (especially ${prospect.techStack}), pricing model, implementation time, support quality, scalability, and security.
Use checkmarks, X marks, and "partial" indicators.

## SECTION: Where We Excel
Honest assessment of our strongest differentiators. Be specific and confident, not arrogant. Reference proof points and customer evidence.

## SECTION: Where We're Different
Address areas where competitors may appear to have advantages. Reframe honestly — explain our approach and why it serves ${prospect.companySize} ${prospect.industry} companies better.

## SECTION: What Customers Say
Include customer perspective comparing us to alternatives. Reference relevant case studies and testimonials.

## SECTION: Our Recommendation
Confident but not pushy. Summarize why we're the right choice for ${prospect.companyName}'s specific needs. Clear next step.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'reference-letter': (prospect, toneLevel) => `Create a professional reference letter template that a happy customer could sign, tailored for ${prospect.companyName}'s evaluation.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Letter Header
[CUSTOMER COMPANY LETTERHEAD]
Date: [DATE]
To: ${prospect.companyName} Evaluation Committee
Re: Reference for [Our Company Name]

## SECTION: Introduction & Relationship
Professional opening establishing who the reference is, their role, company, and how long they've been a customer. Include industry and company size context for credibility.

## SECTION: Challenge & Selection Process
What challenges they faced (similar to ${prospect.painPoints}), what alternatives they evaluated, and why they chose us. Be specific but customizable.

## SECTION: Results & Impact
Quantifiable results achieved. Include metrics on efficiency, ROI, time saved, and business impact. Make these realistic and editable with [PLACEHOLDER] markers for specific numbers.

## SECTION: Partnership Experience
Comment on implementation, support quality, responsiveness, and ongoing partnership. Address common concerns ${prospect.industry} companies have.

## SECTION: Recommendation & Closing
Strong recommendation with offer to discuss further. Professional signature block with [NAME], [TITLE], [COMPANY], [CONTACT INFO] placeholders.

NOTE: This is a pre-written template. All [BRACKETED] items should be customized by the reference customer before signing.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'partnership-one-pager': (prospect, toneLevel) => `Create a partnership one-pager for a potential channel/referral partner: ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Why Partner With Us
Compelling value proposition for ${prospect.companyName} as a partner. What's in it for them? Address their market (${prospect.industry}), their clients, and how partnering strengthens their offering.

## SECTION: Partner Economics
Clear economics of the partnership:
- Referral fees / revenue share structure
- Deal registration benefits
- Tiered partner levels and incentives
- Expected deal sizes and close rates
Make the financial opportunity tangible.

## SECTION: How It Works
Simple 3-5 step process:
1. Identify opportunity
2. Register deal
3. Joint selling support
4. Close and earn
Include what support we provide at each stage.

## SECTION: Joint Value Proposition
How our combined offering serves their clients better. The "1+1=3" story for ${prospect.industry} companies dealing with: ${prospect.painPoints}.

## SECTION: Partner Support & Resources
What partners receive: training, co-branded materials, dedicated partner manager, technical support, marketing funds, and lead sharing.

## SECTION: Next Steps
How to become a partner. Simple application process with clear timeline and contact.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'customer-success-story': (prospect, toneLevel) => `Create a one-page customer success story relevant to ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Spotlight Header
Customer name, industry, company size, and a one-line result statement. Keep it punchy. Format: "[CUSTOMER] — [ONE-LINE RESULT]"

## SECTION: The Situation
2-3 sentences on where the customer was before. Tie to challenges similar to what ${prospect.companyName} faces: ${prospect.painPoints}. Keep it brief and relatable.

## SECTION: The Result
Lead with the outcome, not the process. 3-4 key metrics in bold callout format. Make results tangible and specific.

## SECTION: In Their Words
"[CUSTOMER QUOTE PLACEHOLDER]" — A compelling pull quote that captures the transformation. 2-3 sentences max. Attribute to [Name, Title, Company].

## SECTION: Why It Matters for ${prospect.companyName}
One paragraph connecting this story to ${prospect.companyName}'s situation. Make the relevance obvious.

This is lighter than a full case study — one page, quote-driven, result-focused. Designed for quick consumption and sharing.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'thought-leadership-article': (prospect, toneLevel) => `Write a 600-800 word thought leadership article relevant to ${prospect.companyName} and the ${prospect.industry} industry.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Headline & Subhead
Compelling headline that addresses a trend or challenge in ${prospect.industry}. Subhead that promises value. No product mentions in the headline.

## SECTION: The Industry Shift
Opening 150-200 words setting the stage. What's changing in ${prospect.industry}? Why does it matter now? Use data points, trends, and market context. Hook the reader immediately.

## SECTION: The Hidden Challenge
200-250 words diving deeper into the specific challenge. Connect to pain points like: ${prospect.painPoints}. Provide original insight — not just restating the obvious. This is where thought leadership lives.

## SECTION: A Better Approach
200-250 words offering a framework, methodology, or perspective shift. Do NOT directly sell the product. Instead, describe the approach or philosophy that naturally aligns with our solution. Educate and inspire.

## SECTION: Looking Ahead
100-150 words on what leaders in ${prospect.industry} should do next. Actionable takeaways. End with a forward-looking statement that positions our company as a thought leader.

IMPORTANT: This is NOT a sales piece. No direct product pitches, no pricing, no CTAs to buy. The goal is to establish expertise and build trust. The only mention of our company should be a brief author bio at the end.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'discovery-call-prep': (prospect, toneLevel) => `Create an internal discovery call prep sheet for the upcoming call with ${prospect.companyName}. This is an internal document — dense and utilitarian, not client-facing.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Company Snapshot
Key facts at a glance:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Known Pain Points: ${prospect.painPoints}
- Recent news/triggers (if available from knowledge base)

## SECTION: Stakeholder Profiles
Likely attendees and their priorities:
- **Economic Buyer:** Role, what they care about (ROI, risk)
- **Champion:** Role, what they need from us (proof, ease)
- **Technical Evaluator:** Role, concerns (integration with ${prospect.techStack}, security)
- **End Users:** Role, daily impact expectations

## SECTION: Discovery Questions (7 Questions)
Seven strategic questions ordered from broad to specific:
1. Situation question (understand current state)
2. Problem question (uncover pain depth)
3. Implication question (quantify cost of inaction)
4. Need-payoff question (envision the solution)
5. Process question (understand decision process)
6. Timeline question (urgency and drivers)
7. Competition question (who else they're talking to)
For each: the question AND why you're asking it.

## SECTION: Likely Objections
Top 5 objections ${prospect.companyName} will raise based on their profile. For each:
- What they'll say
- What they actually mean
- How to respond

## SECTION: Landmines & Red Flags
Things to watch for during the call. Competitive traps, budget concerns, political dynamics, and warning signs this deal may stall.

## SECTION: Suggested Next Step
What to propose at the end of the call based on where they are in the buying process.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'objection-handling-guide': (prospect, toneLevel) => `Create a comprehensive objection handling guide for selling to ${prospect.companyName} and similar ${prospect.industry} companies.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: How to Use This Guide
Brief instruction: listen fully, acknowledge, reframe, respond with proof. Never argue. Two-column format: left = objection, right = response.

## SECTION: Price & Budget Objections
Objection 1: "It's too expensive" / "We don't have the budget"
- **Exact words they'll say:** [realistic phrasing]
- **Reframe:** Shift from cost to cost-of-inaction
- **Response:** [word-for-word script]
- **Proof Point:** [relevant case study or metric]

Objection 2: "We can build this internally"
- **Exact words they'll say:** [realistic phrasing]
- **Reframe:** Build vs. buy total cost
- **Response:** [word-for-word script]
- **Proof Point:** [relevant evidence]

## SECTION: Timing & Urgency Objections
Objection 3: "Not the right time" / "Maybe next quarter"
Objection 4: "We're locked into a contract with [competitor]"
Same format as above for each.

## SECTION: Competition & Alternative Objections
Objection 5: "We're also looking at [Competitor]"
Objection 6: "Our current solution works fine"
Same format as above for each.

## SECTION: Technical & Integration Objections
Objection 7: "Will it integrate with ${prospect.techStack}?"
Objection 8: "Our IT team has concerns about security/migration"
Same format as above for each.

## SECTION: Authority & Process Objections
Objection 9: "I need to get buy-in from [stakeholder]"
Objection 10: "Send me more information and I'll review"
Same format as above for each.

Present each objection in a clear two-column format optimized for quick reference during live conversations.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'post-demo-followup': (prospect, toneLevel) => `Create a post-demo follow-up email for ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Subject Line Options
Provide 3 subject line options:
1. Value-focused (references their specific pain point)
2. Personal (references something discussed in demo)
3. Action-oriented (drives toward next step)

## SECTION: Personalized Opening
2-3 sentences referencing the demo conversation. Mention something specific to ${prospect.companyName} — a question they asked, a feature they reacted to, or a pain point (${prospect.painPoints}) they emphasized. Show you listened.

## SECTION: Recap Bullets
3-5 bullet points summarizing:
- Key capabilities demonstrated relevant to their needs
- How each addresses their specific challenges
- Any questions raised and answers provided
- Integration points with ${prospect.techStack}
Format as clean, scannable bullets.

## SECTION: Call to Action
One clear next step. Be specific about what, when, and how. Suggest a concrete date/time. Make it easy to say yes.

## SECTION: P.S. — Proof Point
A brief P.S. line with one compelling proof point: customer result, metric, or case study relevant to ${prospect.industry}. This is the "leave-behind" that gets forwarded internally.

Each section should flow naturally as parts of a single email. The complete output should be ready to copy-paste into an email client.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'post-meeting-summary': (prospect, toneLevel) => `Create a post-meeting summary email for ${prospect.companyName}. This should feel like it was sent the same day — timely and organized.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Subject Line
"Following up: [Meeting Topic] — ${prospect.companyName} + [Our Company]" format. Professional and searchable in email.

## SECTION: What We Discussed
Organized summary of the meeting topics. Include:
- Key topics covered
- Questions raised by ${prospect.companyName}
- Insights shared about their challenges: ${prospect.painPoints}
- Areas of alignment identified
Written in a collaborative "we discussed" tone, not a lecture.

## SECTION: What We Agreed On
Specific agreements, decisions, or alignment points from the meeting. Present as clear bullet points. If pricing or terms were discussed, summarize understanding.

## SECTION: Next Steps
Action items with owners and dates:
- **[Our Company]:** What we'll do and by when
- **${prospect.companyName}:** What they'll do and by when
- **Joint:** Any shared next steps
Format as a clean action item list.

## SECTION: Closing
Brief, warm closing. Reiterate enthusiasm for the partnership. Offer to clarify anything. Include contact information.

This should read as a professional, organized follow-up sent within hours of the meeting.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'executive-sponsor-email': (prospect, toneLevel) => `Create a short, punchy executive-to-executive email from our leadership to ${prospect.companyName}'s executive team.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Subject Line
Short, executive-appropriate. No clickbait. Something a C-level would open. Examples: "Quick note on [shared priority]" or "${prospect.companyName} + [Our Company]"

## SECTION: Opening Line
One sentence. Personal, direct, no fluff. Reference a trigger: industry event, mutual connection, or business milestone. Executives scan — hook them immediately.

## SECTION: The Point
2-3 sentences max. Why this email matters. Connect our value to something ${prospect.companyName}'s leadership cares about. Reference ${prospect.painPoints} at a strategic level, not tactical. Think board-level language.

## SECTION: The Ask
One sentence. One clear ask. "Would you be open to a brief conversation?" or "I'd welcome 15 minutes to explore this." Nothing complicated.

## SECTION: Signature Block
[EXEC NAME]
[TITLE]
[COMPANY]
[PHONE]

The entire email should be under 100 words. Executives don't read long emails. Every word earns its place.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'linkedin-message-sequence': (prospect, toneLevel) => `Generate a complete LinkedIn outreach sequence of 5 messages over 4 weeks.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Message 1 — Connection Accepted (Day 1)
Thank them for connecting. Share one relevant insight about their industry. No ask. Under 500 characters.

## SECTION: Message 2 — Value Share (Day 7)
Share a relevant article, stat, or insight related to their role/industry. Brief comment on why it's relevant to them. Under 500 characters.

## SECTION: Message 3 — Soft Engage (Day 14)
Reference something from their recent LinkedIn activity (posts, comments, company news). Ask a genuine question. Under 500 characters.

## SECTION: Message 4 — Problem Hint (Day 21)
Mention a challenge you're hearing about from others in their role/industry. Ask if they're seeing the same. Under 500 characters.

## SECTION: Message 5 — Gentle Bridge (Day 28)
If they've engaged with any previous messages, suggest a brief call to exchange ideas. If no engagement, share one more piece of value and leave the door open. Under 500 characters.

Each message must be conversational, personalized, and under 500 characters. No corporate speak. No "I'd love to pick your brain."

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'cold-call-script': (prospect, toneLevel) => `Create a cold call script for calling ${prospect.companyName}. Include stage directions and branching paths.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Opening (First 10 Seconds)
[STAGE DIRECTION: Confident, unhurried pace. Smile — they can hear it.]
Script the opening: name, company, pattern interrupt or relevant trigger. Get permission to continue.
[IF THEY SAY "NOT INTERESTED"]: Quick pivot response.
[IF THEY SAY "WHO IS THIS?"]: Brief reintro.

## SECTION: Discovery Questions
[STAGE DIRECTION: Shift to curious, consultative tone. Listen more than talk.]
3-4 discovery questions specific to ${prospect.industry} and ${prospect.painPoints}:
1. Broad situation question
2. Pain-specific question
3. Impact/cost question
4. Vision question
[LISTEN for]: Key phrases that indicate buying signals.

## SECTION: Pivot to Pitch (30 Seconds Max)
[STAGE DIRECTION: Match their energy. If they're analytical, be data-driven. If they're high-level, stay strategic.]
Concise value statement connecting their answers to our solution. No feature dumping — connect to their specific pain.

## SECTION: Objection Responses
[STAGE DIRECTION: Never argue. Acknowledge, bridge, respond.]
Top 4 phone objections and exact responses:
1. "Send me an email" → [response]
2. "We already have something" → [response]
3. "Bad timing" → [response]
4. "What does it cost?" → [response]

## SECTION: Close for Meeting
[STAGE DIRECTION: Assumptive close, offer specific times.]
Script the meeting close. Offer two specific time slots. Confirm email for calendar invite. End positively whether they book or not.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'voicemail-script': (prospect, toneLevel) => `Create 3 voicemail scripts for ${prospect.companyName}. Each must be under 30 seconds when spoken aloud (approximately 75-80 words max).

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Voicemail 1 — The Trigger
Angle: Reference a specific industry trigger or company event relevant to ${prospect.industry}.
[WORD COUNT: ~75 words | ESTIMATED TIME: ~28 seconds]
Script: Name, company, trigger reference, one-sentence value hook tied to ${prospect.painPoints}, callback number (said twice), name again.

## SECTION: Voicemail 2 — The Proof Point
Angle: Lead with a customer result or metric relevant to ${prospect.companySize} ${prospect.industry} companies.
[WORD COUNT: ~75 words | ESTIMATED TIME: ~28 seconds]
Script: Name, company, proof point, relevance to their situation, callback number (said twice), name again.

## SECTION: Voicemail 3 — The Direct Ask
Angle: Straightforward, confident ask. No games.
[WORD COUNT: ~75 words | ESTIMATED TIME: ~28 seconds]
Script: Name, company, brief reason for calling, specific ask (15-minute conversation about [topic]), callback number (said twice), name again.

IMPORTANT: Each voicemail must be concise enough to hold attention. Phone numbers should be spoken slowly and repeated. End each with your name for easy callback.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'champion-enablement-kit': (prospect, toneLevel) => `Create a champion enablement kit for ${prospect.companyName}'s internal champion to sell this deal internally.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Executive Summary (For Internal Circulation)
A one-paragraph summary your champion can paste into an internal email or Slack message. Covers: what we do, why it matters to ${prospect.companyName}, and the expected outcome. Written from a neutral, third-party perspective — not a sales pitch.

## SECTION: ROI Snapshot
Quick-reference ROI numbers tailored to ${prospect.companySize} ${prospect.industry} company:
- Current cost of problem: ${prospect.painPoints}
- Expected savings / ROI
- Payback period
- Comparison to alternatives
Format as a clean, shareable table.

## SECTION: Objection Responses for Internal Stakeholders
The top 5 objections their colleagues will raise and exactly how your champion should respond:
1. CFO: "Why now? Why this budget?"
2. IT: "What about integration with ${prospect.techStack}?"
3. Operations: "What's the implementation burden?"
4. Legal: "Security and compliance concerns?"
5. End Users: "Another tool to learn?"
For each: the objection, the response, and supporting evidence.

## SECTION: Suggested Next Steps (For Champion)
A playbook for your champion:
- Who to loop in and when
- What meeting to request
- What materials to share
- How to frame the internal business case
- Timeline recommendation

## SECTION: Quick-Reference Talking Points
5-7 bullet points your champion can memorize for hallway conversations and impromptu questions. Short, memorable, and impactful.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'mutual-action-plan': (prospect, toneLevel) => `Create a mutual action plan (MAP) for the deal with ${prospect.companyName}. This is a shared document between both teams.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Shared Objective
One paragraph defining the mutual goal: what ${prospect.companyName} wants to achieve and how we'll get there together. Frame as a partnership, not a sale.

## SECTION: Key Milestones
| # | Milestone | Owner | Target Date | Status |
|---|-----------|-------|-------------|--------|
Include 8-12 milestones covering:
- Discovery and requirements
- Technical evaluation / POC
- Security and compliance review
- Stakeholder alignment
- Business case approval
- Contract and legal review
- Implementation kickoff
- Go-live target
Each with realistic timelines and clear ownership (${prospect.companyName} team or Our team).

## SECTION: Decision Criteria
What ${prospect.companyName} needs to see to move forward:
- Technical requirements
- Integration needs (${prospect.techStack})
- ROI thresholds
- Security/compliance requirements
- Reference checks

## SECTION: Stakeholders & Roles
| Name/Role | Organization | Responsibility | Engagement |
Map both sides: our team and ${prospect.companyName}'s team. Include executive sponsors, project leads, technical contacts, and legal/procurement.

## SECTION: Risks & Mitigations
Proactively identify 3-5 potential risks to the timeline and how both teams will mitigate them. Show maturity and partnership mindset.

## SECTION: Path to Decision
Clear summary: what happens next, who does what, and target decision date. Respectful but specific.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'stakeholder-map': (prospect, toneLevel) => `Create an internal stakeholder map for the ${prospect.companyName} deal. This is an internal strategy document — not shared with the prospect.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Stakeholder Overview
Brief context on ${prospect.companyName}'s likely decision-making structure for a ${prospect.companySize} ${prospect.industry} company evaluating our solution.

## SECTION: Stakeholder Map
| Stakeholder | Likely Title | Role in Decision | Priority | Likely Stance | What They Need |
|-------------|-------------|------------------|----------|---------------|----------------|
Identify 5-7 likely stakeholders:
- **Economic Buyer:** Who controls budget? Priority: HIGH. What they need to say yes.
- **Champion:** Who's advocating for us internally? Priority: HIGH. How to enable them.
- **Technical Evaluator:** Who assesses integration with ${prospect.techStack}? Priority: HIGH. What proof they need.
- **End User(s):** Who will use it daily? Priority: MEDIUM. What they care about.
- **Blocker/Skeptic:** Who might resist? Priority: HIGH. How to neutralize.
- **Legal/Procurement:** Who handles contracts? Priority: MEDIUM. What they'll require.
- **Executive Sponsor:** Who signs off? Priority: HIGH. What moves them.

For "Likely Stance" use: Supportive, Neutral, Skeptical, Unknown.

## SECTION: Engagement Strategy
For each stakeholder, a specific engagement action:
- Who on our team engages them
- What message resonates with them
- What content/proof to share
- When to engage them in the process

## SECTION: Power Dynamics & Politics
Analysis of likely internal dynamics: who influences whom, potential alliances, and political considerations.

## SECTION: Gaps & Next Steps
What we don't know yet and how to find out. Information gaps to fill during discovery.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'qbr-review-deck': (prospect, toneLevel) => `Create a Quarterly Business Review (QBR) deck outline for existing customer ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Quarter in Review — Executive Summary
High-level summary of the quarter: key wins, metrics, and partnership highlights. Set a positive, results-driven tone for the meeting.

## SECTION: Results & KPIs
Performance metrics for the quarter:
| KPI | Target | Actual | Trend |
Include: adoption rate, usage metrics, ROI delivered, support tickets resolved, time saved, and any custom KPIs relevant to ${prospect.industry}.

## SECTION: Success Highlights
3-5 specific wins from the quarter. For each: what happened, the impact, and why it matters. Celebrate the partnership.

## SECTION: Challenges & Resolutions
Honest review of any issues encountered and how they were resolved. Shows transparency and accountability. Include: what happened, root cause, resolution, and prevention steps.

## SECTION: Product Roadmap & Upcoming Features
Relevant upcoming features and enhancements. Tie each to ${prospect.companyName}'s use case and pain points: ${prospect.painPoints}. Show continued investment in their success.

## SECTION: Expansion Conversation
Natural bridge to growth opportunities. Based on their usage patterns and results, recommend next-level capabilities. Frame as "unlocking more value" not "buying more stuff."

## SECTION: Next Quarter Goals
Collaborative goal-setting for the upcoming quarter. Mutual commitments and success criteria.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'win-loss-analysis': (prospect, toneLevel) => `Create a structured win/loss analysis debrief for the ${prospect.companyName} deal. This is an internal document for sales leadership.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Deal Summary
Quick facts:
- Prospect: ${prospect.companyName} (${prospect.industry}, ${prospect.companySize})
- Deal outcome: [WIN/LOSS — to be filled in]
- Deal size: [AMOUNT]
- Sales cycle length: [DURATION]
- Key competitors: [LIST]
- Decision maker(s): [NAMES/ROLES]

## SECTION: What Worked
Identify 3-5 things that went well in this sales process:
- Messaging and positioning effectiveness
- Discovery and qualification quality
- Demo and proof-of-concept execution
- Stakeholder engagement
- Competitive strategy
For each: what we did, why it worked, and whether it's repeatable.

## SECTION: What Didn't Work
Honest assessment of 3-5 areas that fell short:
- Where we lost ground
- Objections we couldn't overcome
- Stakeholders we didn't reach
- Timeline or process issues
- Competitive gaps exposed
For each: what happened, root cause, and what we should have done differently.

## SECTION: Competitive Insights
What we learned about the competition:
- Their pitch and positioning
- Their pricing strategy
- Their strengths that resonated
- Their weaknesses we could exploit next time

## SECTION: What to Do Differently
Actionable recommendations for future deals with similar ${prospect.industry} companies:
1. Process improvements
2. Messaging adjustments
3. Resource allocation changes
4. Competitive counter-strategies
5. Training needs identified

## SECTION: Key Takeaways
3 bullet-point summary for the sales team standup. What everyone should know from this deal.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'linkedin-post': (prospect, toneLevel) => `Generate a LinkedIn thought leadership post. Structure:

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Post
Write the complete LinkedIn post with this structure:
- Hook line: Pattern-interrupting opening that stops the scroll. Start with a bold statement, surprising stat, or contrarian take. NO "I'm excited to announce" or "Thrilled to share".
- 3-5 short insight paragraphs: One idea per paragraph. Short sentences. Use line breaks between paragraphs for readability. Write in first person — the rep's voice, not corporate voice.
- Subtle company connection: Weave in relevance to what the company does without being salesy. Never say "our product" or "check out our solution."
- Call to action: End with a question to drive comments, or mention a relevant resource.
- Add 5 relevant hashtags at the end.

CRITICAL: LinkedIn optimal length is 1,200-1,500 characters. Stay within this range. Every paragraph should be 1-2 sentences max. White space matters on LinkedIn — keep paragraphs SHORT.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'email-newsletter-blurb': (prospect, toneLevel) => `Create a 150-word email newsletter blurb about a company update, relevant to ${prospect.industry} audiences.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Headline
Concise, benefit-driven newsletter headline. Under 10 words. Grab attention in a crowded inbox.

## SECTION: Body (150 Words Max)
The complete newsletter blurb in exactly 150 words or less:
- Opening sentence: news hook or announcement
- 2-3 sentences: what's new and why it matters to ${prospect.industry} companies
- Connect to solving challenges like: ${prospect.painPoints}
- Closing sentence with clear CTA (learn more, register, read the full story)

## SECTION: CTA Button Text
Short CTA button text (3-5 words). Action-oriented. Examples: "Read the Full Story" / "See What's New" / "Get the Details"

This should be scannable, concise, and formatted for email. No long paragraphs. Every word earns its place.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'webinar-invitation': (prospect, toneLevel) => `Create a webinar invitation email promoting an event relevant to ${prospect.companyName} and ${prospect.industry} professionals.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Subject Line Options
3 subject line options:
1. Curiosity-driven
2. Value-driven (what they'll learn)
3. Urgency-driven (limited spots, upcoming date)

## SECTION: Event Header
Webinar title, date, time (with timezone), and duration. Format as a visual event block. Make the title compelling — focus on what attendees will learn, not what you'll present.

## SECTION: Why Attend
3-4 bullet points of specific takeaways. What will attendees walk away with? Tie to challenges in ${prospect.industry}: ${prospect.painPoints}. Focus on value, not features.

## SECTION: Agenda Preview
Timed agenda (e.g., "10 min: Topic A, 15 min: Topic B"):
- Opening: Industry context
- Main content: Actionable insights
- Case study or demo: Proof
- Q&A: Live interaction
Keep it concise — enough to intrigue, not enough to skip attending.

## SECTION: Speaker Spotlight
[SPEAKER NAME] — [TITLE], [COMPANY]
2-3 sentences of credibility. Why should ${prospect.industry} professionals listen to this person?

## SECTION: Registration CTA
Clear registration call-to-action. Create urgency (limited spots, replay not guaranteed). Include: "Register Now" button text and a one-line reinforcement.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'press-release': (prospect, toneLevel) => `Create a professional press release announcing a new product, partnership, or milestone relevant to ${prospect.industry}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Headline & Subheadline
Bold, newsworthy headline following AP style. Subheadline that adds context. Format:
**[COMPANY] Announces [NEWS]**
*[Subheadline with context and impact]*

## SECTION: Dateline & Lead Paragraph
[CITY, STATE — DATE] — Opening paragraph covering the 5 W's: Who, What, When, Where, Why. Most important information first. One paragraph, 2-3 sentences.

## SECTION: Body — The Details
2-3 paragraphs expanding on the announcement:
- What this means for ${prospect.industry} companies
- How it addresses challenges like ${prospect.painPoints}
- Key features, terms, or milestones
- Market context and significance

## SECTION: Executive Quote
"[QUOTE]" — [Name], [Title], [Company]
A polished executive quote that adds perspective beyond the facts. Forward-looking, confident, and quotable by media.

## SECTION: Customer/Partner Quote
"[QUOTE]" — [Name], [Title], [Partner/Customer Company]
A supporting quote from a customer, partner, or industry voice that validates the announcement.

## SECTION: About [Company Name]
Standard boilerplate: what the company does, who it serves, key stats, and mission. 3-4 sentences.

## SECTION: Media Contact
[NAME]
[TITLE]
[EMAIL]
[PHONE]

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'blog-post-outline': (prospect, toneLevel) => `Create a structured blog post outline targeting ${prospect.industry} professionals at companies like ${prospect.companyName}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Title & SEO Strategy
Primary title (H1): compelling, keyword-rich, under 60 characters.
Alternative titles: 2 options.
Target keyword: primary SEO keyword.
Secondary keywords: 3-5 related terms.
Search intent: what the reader is trying to learn/solve.

## SECTION: Introduction (H2)
Key points to cover in the opening:
- Hook: surprising stat, bold claim, or relatable problem about ${prospect.painPoints}
- Context: why this matters now in ${prospect.industry}
- Promise: what the reader will learn
- Estimated word count: 100-150 words

## SECTION: Main Content — H2 Sections
3-5 H2 sections, each with:
- **H2 Title:** keyword-optimized section header
- **Key Points:** 3-4 bullet points to cover
- **Supporting Evidence:** data, examples, or case studies to include
- **Estimated Length:** word count target
Structure should flow logically from problem to solution to action.

## SECTION: Conclusion & CTA
Key points for the closing:
- Summary of main takeaways
- Forward-looking statement
- CTA: what the reader should do next (not a hard sell — offer a resource, invite to learn more)
Estimated word count: 100-150 words

## SECTION: SEO Checklist
- Meta description (under 160 characters)
- Internal linking opportunities
- External linking targets
- Image/graphic suggestions
- Social sharing snippet

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'event-leave-behind': (prospect, toneLevel) => `Create a trade show / conference event leave-behind piece for ${prospect.companyName} and ${prospect.industry} audiences.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Front — Hero Statement
A bold, visual-first front side. Include:
- Company logo [LOGO PLACEHOLDER]
- One powerful headline (under 10 words)
- One subheadline connecting to ${prospect.industry} challenges
- Visual suggestion (image, graphic, or icon concept)
Designed for booth visitors who grab and go.

## SECTION: The Problem We Solve
3-4 bullet points of challenges facing ${prospect.industry} companies like ${prospect.companyName}. Specifically: ${prospect.painPoints}. Short, scannable, relatable.

## SECTION: Our Solution at a Glance
Visual-friendly feature highlights:
- 3-4 key capabilities with one-line descriptions
- Integration callout: works with ${prospect.techStack}
- Format as icons + short text (suggest icon concepts)

## SECTION: Proof in Numbers
3-4 bold metric callouts:
- **[XX]%** improvement in [area]
- **[XX]x** faster [process]
- **$[XX]K** saved annually
Use real metrics from case studies where possible.

## SECTION: QR Code & Next Step
[QR CODE PLACEHOLDER — links to landing page / demo booking]
"Scan to see it in action" or "Scan to book a personalized demo"
Include URL as text backup: [URL PLACEHOLDER]

This should be designed for a physical handout: scannable, visual, and memorable. Minimal text, maximum impact.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'video-script': (prospect, toneLevel) => `Create a 60-90 second video script (explainer or testimonial style) relevant to ${prospect.companyName} and ${prospect.industry}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Opening Hook (0:00 - 0:10)
[SCENE DIRECTION: Close-up of speaker / animated text / b-roll of ${prospect.industry} workplace]
Script: A bold opening question or statement that grabs attention. Connect to ${prospect.painPoints}. 2-3 sentences max.
[VISUAL NOTE: Describe what's on screen]

## SECTION: The Problem (0:10 - 0:25)
[SCENE DIRECTION: Transition to problem visualization / speaker on camera]
Script: Paint the problem vividly. What does life look like today for ${prospect.industry} teams? Use specific, relatable scenarios. Make the viewer nod along.
[VISUAL NOTE: Suggest supporting visuals or graphics]

## SECTION: The Solution (0:25 - 0:45)
[SCENE DIRECTION: Product demo clips / animated workflow / speaker with screen share]
Script: Introduce the solution. Show, don't tell. Focus on the transformation — before vs. after. Highlight 2-3 key capabilities relevant to ${prospect.painPoints}.
[VISUAL NOTE: Suggest product shots or animations]

## SECTION: The Proof (0:45 - 1:05)
[SCENE DIRECTION: Customer testimonial clip / metrics on screen / case study visuals]
Script: Social proof — customer quote, key metrics, or results story. Make it credible and specific. Reference results relevant to ${prospect.companySize} ${prospect.industry} companies.
[VISUAL NOTE: Suggest metric callout graphics]

## SECTION: Call to Action (1:05 - 1:20)
[SCENE DIRECTION: Speaker on camera / end card with logo and CTA]
Script: Clear, specific next step. "Visit [URL]" / "Book a demo" / "See how it works." Repeat the key value proposition in one sentence. End with confidence.
[VISUAL NOTE: End card design suggestion — logo, URL, CTA button]

## SECTION: Production Notes
- Total estimated runtime: [XX] seconds
- Tone and pacing guidance
- Music/soundtrack suggestions
- Key visual assets needed
- Accessibility: include closed caption notes

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Current Stack: ${prospect.techStack}
- Pain Points: ${prospect.painPoints}`,

  'linkedin-connection-request': (prospect, toneLevel) => `Generate 3 LinkedIn connection request message variations for ${prospect.companyName}. Each MUST be under 300 characters (LinkedIn's limit).

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Variation 1 — Shared Interest
A connection request based on a shared industry interest or mutual connection. No pitch. Just a genuine reason to connect. Personalized for someone in ${prospect.industry}.

## SECTION: Variation 2 — Content Appreciation
A connection request referencing something the prospect likely posts about or cares about in their role at a ${prospect.companySize} ${prospect.industry} company.

## SECTION: Variation 3 — Industry Peer
A connection request positioned as wanting to learn from them as an industry peer in ${prospect.industry}.

CRITICAL: Each variation MUST be under 300 characters total. No sales pitch. No mention of your product.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Pain Points: ${prospect.painPoints}`,

  'linkedin-comment-strategy': (prospect, toneLevel) => `Generate a LinkedIn commenting strategy for engaging with prospects at ${prospect.companyName} in ${prospect.industry}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Target Posts to Comment On
5 types of posts the rep should look for from this prospect or their company. For each, explain why it's a good opportunity to comment and engage.

## SECTION: Comment Templates
5 comment templates for different post types. Each should add genuine value or insight (not just "Great post!"), reference expertise subtly, ask a follow-up question, and be 2-3 sentences max.

## SECTION: Engagement Cadence
Recommended frequency and timing for engaging with this prospect's content. How to build visibility without being annoying.

## SECTION: Conversation Transition
How to transition from being a regular commenter to initiating a DM conversation naturally. Step-by-step approach.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Pain Points: ${prospect.painPoints}`,

  'linkedin-carousel-outline': (prospect, toneLevel) => `Generate a LinkedIn carousel post outline (slide-by-slide) relevant to ${prospect.companyName} in ${prospect.industry}.

${toneInstruction(toneLevel)}

Structure your response with these exact sections (use "## SECTION: Title" format for each):

## SECTION: Carousel Outline
Create an 8-10 slide carousel outline:

Slide 1 — Cover: Bold hook headline that makes people swipe. One line, large text feel.
Slides 2-7 — Content: One key point per slide. Short headline + 1-2 supporting sentences. Each slide should make the reader want to see the next one.
Slide 8 — Summary: Quick recap of key takeaways.
Slide 9 — CTA: What to do next — follow, comment, link to resource.

For each slide include: headline text, body text, suggested visual element, and background color recommendation.

## SECTION: Design Notes
Overall color scheme, font pairing, and visual style recommendations. Topic should connect to ${prospect.industry} and the company's expertise.

## SECTION: Caption
The LinkedIn post caption to accompany the carousel. Include a hook, brief description, and 5 hashtags. Keep under 1,300 characters.

Prospect Details:
- Company: ${prospect.companyName}
- Industry: ${prospect.industry}
- Size: ${prospect.companySize}
- Pain Points: ${prospect.painPoints}`,
};

export function buildUserPrompt(
  contentType: ContentType,
  prospect: ProspectInfo,
  toneLevel: number,
  additionalContext: string,
  sessionDocuments: string[],
  productContext?: string,
  visualMode?: boolean
): string {
  let prompt = '';

  if (productContext) {
    prompt += productContext + '\n\n';
  }

  prompt += CONTENT_TEMPLATES[contentType](prospect, toneLevel);

  if (additionalContext) {
    prompt += `\n\n## Additional Context\n${additionalContext}`;
  }

  if (sessionDocuments.length > 0) {
    prompt += `\n\n## Session Documents\n${sessionDocuments.join('\n\n---\n\n')}`;
  }

  if (visualMode) {
    prompt += `

## SECTION LAYOUT ROTATION
Ensure visual variety by following this section layout pattern:
- Section 1: Present as a highlighted insight or key finding (colored callout box)
- Section 2: Present as a grid or card layout (features, benefits, or comparisons)
- Section 3: Present as a table, timeline, or visual comparison (data-heavy)
- Section 4: Present as stat cards or metric callouts (numbers prominent)
- Section 5: Present as a testimonial, quote, or proof point
- Final section: Present as a clear call-to-action with specific next steps

Vary every section — never use the same visual treatment for consecutive sections.

IMPORTANT VISUAL FORMATTING: Structure your content so each section can be rendered as a distinct visual component. Use varied formats:
- Use bullet points with "✅" and "❌" for comparison items
- Use "**bold numbers**" followed by labels for statistics
- Use "Step 1:", "Step 2:" prefixes for processes
- Use "> quote text" format for testimonials
- Use "| Column 1 | Column 2 |" format for tables
- Start key metrics with the number: "342% ROI increase in 14 months"

This helps the rendering engine choose the best visual treatment for each section.`;
  }

  return prompt;
}

export function buildSectionRegeneratePrompt(
  sectionTitle: string,
  originalContent: string,
  contentType: ContentType,
  prospect: ProspectInfo,
  toneLevel: number
): string {
  return `Regenerate ONLY the following section of a ${contentType.replace(/-/g, ' ')} document.

Section: "${sectionTitle}"

Original content for reference:
${originalContent}

${toneInstruction(toneLevel)}

Prospect: ${prospect.companyName} (${prospect.industry}, ${prospect.companySize})
Pain Points: ${prospect.painPoints}

Provide ONLY the regenerated section content — no section header, no other sections.`;
}

export function buildProductContext(product: ProductProfile): string {
  let context = `\n\n## PRODUCT CONTEXT — ${product.name}\n`;
  context += `**Product:** ${product.name}\n`;
  context += `**Description:** ${product.fullDescription || product.shortDescription}\n`;

  if (product.features.length > 0) {
    context += `\n### Features\n`;
    product.features.forEach((f) => {
      context += `- **${f.name}:** ${f.description}\n`;
    });
  }

  if (product.benefits.length > 0) {
    context += `\n### Benefits\n`;
    product.benefits.forEach((b) => {
      context += `- ${b}\n`;
    });
  }

  if (product.differentiators.length > 0) {
    context += `\n### Differentiators\n`;
    product.differentiators.forEach((d) => {
      context += `- ${d}\n`;
    });
  }

  if (product.proofPoints.length > 0) {
    context += `\n### Proof Points\n`;
    product.proofPoints.forEach((p) => {
      context += `- ${p}\n`;
    });
  }

  if (product.objections.length > 0) {
    context += `\n### Objection Responses\n`;
    product.objections.forEach((o) => {
      context += `- **Objection:** ${o.objection}\n  **Response:** ${o.response}\n`;
    });
  }

  if (product.idealUseCase) {
    context += `\n### Ideal Use Case\n${product.idealUseCase}\n`;
  }

  if (product.pricingNotes) {
    context += `\n### Pricing Notes\n${product.pricingNotes}\n`;
  }

  // Related products handling
  if (product.relatedProducts.length > 0) {
    const complementary = product.relatedProducts.filter((r) => r.type === 'complementary');
    const upgradePath = product.relatedProducts.filter((r) => r.type === 'upgrade-path');
    const alternative = product.relatedProducts.filter((r) => r.type === 'alternative');

    if (complementary.length > 0) {
      context += `\n### Complementary Products (mention as add-ons)\n`;
      complementary.forEach((r) => {
        context += `- Product ID: ${r.productId}\n`;
      });
    }

    if (upgradePath.length > 0) {
      context += `\n### Upgrade Path Products (mention in renewal docs only)\n`;
      upgradePath.forEach((r) => {
        context += `- Product ID: ${r.productId}\n`;
      });
    }

    if (alternative.length > 0) {
      context += `\n### Alternative Products — NEVER mention in prospect-facing content\n`;
      alternative.forEach((r) => {
        context += `- Product ID: ${r.productId}\n`;
      });
    }
  }

  context += `\nCRITICAL: Build this document specifically around this product. Never contradict the product profile information.`;

  return context;
}

// ═══════════════════════════════════════════════
// Persona-Aware Generation
// ═══════════════════════════════════════════════

export function buildPersonaContext(personas: PersonaConfig[], mode: 'combined' | 'separate'): string {
  if (personas.length === 0) return '';

  const lines: string[] = [];
  lines.push('## TARGET AUDIENCE');
  lines.push(`This document is written for: ${personas.map(p => p.label).join(', ')}`);
  lines.push('');

  for (const persona of personas) {
    lines.push(`### ${persona.title}`);
    lines.push(`- They care about: ${persona.cares.join(', ')}`);
    lines.push(`- Language style: ${persona.languageStyle}`);
    lines.push(`- Lead with: ${persona.documentLead}`);
    lines.push(`- Highlight these metrics: ${persona.metricsToHighlight.join(', ')}`);
    lines.push('');
  }

  if (mode === 'combined' && personas.length > 1) {
    lines.push('Structure the document with clear sections addressing each audience. Use headers like "For [Title]:" to delineate persona-specific sections.');
  } else if (mode === 'separate' || personas.length === 1) {
    lines.push('Write the entire document in the style and language appropriate for this audience.');
    // When in separate mode with a single persona, inject persona-specific structure instructions
    if (personas.length === 1) {
      const structureInstructions = getPersonaStructureInstructions(personas[0].id);
      if (structureInstructions) {
        lines.push('');
        lines.push(structureInstructions);
      }
    }
  }

  return lines.join('\n');
}

// ═══════════════════════════════════════════════
// Persona-Specific Structure Instructions
// ═══════════════════════════════════════════════

function getPersonaStructureInstructions(personaId: string): string {
  const instructions: Record<string, string> = {
    'cfo': `IMPORTANT: Override the default section structure. Generate the document with these EXACT sections in this order:

## SECTION: Executive ROI Summary
Start with a large summary: Annual Investment, Annual Savings, Net Benefit, ROI %, Payback Period, 3-Year Value. Use exact numbers. Present each metric with its value prominently.

## SECTION: Financial Impact Analysis
Year-by-year breakdown table: Year 1, Year 2, Year 3 showing investment, savings, cumulative value. Include totals row.

## SECTION: Cost Comparison
Current cost vs proposed cost. Show the math clearly. Break down by category: labor, tools, opportunity cost, error cost.

## SECTION: Risk Assessment
Financial risks of action vs inaction. Quantify the cost of delay per month. Include best-case and worst-case scenarios with dollar amounts.

## SECTION: Recommendation
One paragraph. Clear financial recommendation with specific next step. Include the single most compelling ROI number.

Keep it to ONE PAGE. CFOs don't read long documents. Every sentence must contain a number.`,

    'ceo': `IMPORTANT: Override the default section structure. Generate the document with these EXACT sections in this order:

## SECTION: Strategic Impact Statement
ONE bold sentence about what this means for the business. Then 2-3 sentences expanding on the strategic implications.

## SECTION: Competitive Positioning
Where we sit vs competitors. Include a 2x2 matrix description: describe two axes with relevant metrics (e.g., Innovation Speed vs Market Coverage). Place us in the top-right quadrant. Name 2-3 competitors in other quadrants.

## SECTION: Three Big Outcomes
Three major outcomes: growth impact, efficiency gain, competitive advantage. Present each as a distinct callout with a bold title and 2 sentences max explaining the outcome.

## SECTION: 12-Month Vision
What does the business look like in 12 months with this solution? Paint the picture in concrete terms. Reference specific metrics, market position changes, and operational improvements.

## SECTION: Next Step
One clear next step. Make it easy to say yes. One sentence with a specific action and timeline.`,

    'vp-ops': `IMPORTANT: Override the default section structure. Generate the document with these EXACT sections in this order:

## SECTION: Current State vs Future State
Two clear perspectives: "Today" and "With Solution". Compare current processes, metrics, and pain points against future improvements. Use specific before/after metrics.

## SECTION: Implementation Timeline
Phase 1 (weeks 1-2): Discovery and setup steps. Phase 2 (weeks 3-4): Configuration and integration steps. Phase 3 (weeks 5-8): Training and go-live steps. Include specific deliverables for each phase.

## SECTION: Efficiency Metrics
Present key stats: Hours saved per week, Error reduction %, Throughput improvement %, Team adoption timeline. Use specific numbers based on company size and industry.

## SECTION: Process Workflow
Describe the new workflow step by step: Step 1, Step 2, Step 3, Step 4. Each step should have a clear action and brief description of what happens.

## SECTION: Change Management
How to get the team on board. Include: training plan with timeline, quick wins in first 30 days, adoption milestones, and escalation path for issues.`,

    'it-director': `IMPORTANT: Override the default section structure. Generate the document with these EXACT sections in this order:

## SECTION: Technical Architecture
Integration diagram description: describe how the solution connects to existing systems. List each integration: system name, connection type (API, webhook, native connector), and data flow direction. Be specific about protocols and formats.

## SECTION: Security & Compliance
List certifications (SOC 2, ISO 27001, etc.), encryption standards (at rest and in transit), data residency options, access controls (RBAC, SSO, MFA), and audit logging capabilities.

## SECTION: Technical Specifications
Present as a detailed table: requirement vs our capability. Include API rate limits, supported data formats, authentication methods (OAuth 2.0, SAML, API keys), uptime SLA, and backup/disaster recovery.

## SECTION: Implementation Complexity
Scorecard format: Integration effort (Low/Med/High with explanation), Data migration (Low/Med/High with explanation), Training (Low/Med/High with explanation), Total timeline estimate.

## SECTION: Support & SLA
Uptime SLA percentage, response times by severity (P1/P2/P3/P4), escalation path, dedicated support options, and documentation/API reference availability.`,

    'end-user': `IMPORTANT: Override the default section structure. Generate the document with these EXACT sections in this order:

## SECTION: What This Means For You
Simple explanation in plain language. No jargon. What changes in your daily work? Focus on the personal impact. Use "you" and "your" language.

## SECTION: How It Works — Step by Step
Step 1: [specific action]. Step 2: [specific action]. Step 3: [specific action]. Step 4: [specific action]. Keep each step to one simple sentence. Number them clearly.

## SECTION: Your Day Before vs After
Morning routine before: describe 2-3 pain points in daily work. Morning routine after: describe the improvements. Afternoon: same pattern. Make it relatable and specific.

## SECTION: Time You Get Back
Present one big number: X hours per week saved. Then describe what you could do with that time: focus on meaningful work, professional development, or reduced stress.

## SECTION: What Others Say
Include a quote from a similar user at a similar company about their experience. Make it authentic and conversational. Include their role and how long they have been using the solution.`,

    'procurement': `IMPORTANT: Override the default section structure. Generate the document with these EXACT sections in this order:

## SECTION: Vendor Scorecard
Evaluation criteria table with ratings: Company Stability (rate 1-5 with justification), Product Maturity (rate 1-5), Support Quality (rate 1-5), Implementation Track Record (rate 1-5), Financial Health (rate 1-5). Include brief evidence for each rating.

## SECTION: Total Cost of Ownership
Detailed breakdown: Implementation cost ($X), Annual License ($X), Annual Support ($X), Training ($X one-time), Total Year 1 ($X), Total 3-Year ($X). Include any volume discounts or multi-year savings.

## SECTION: Contract Highlights
Key terms: flexible contract lengths, cancellation policy and notice period, SLA guarantees with penalties, payment terms (net 30/60/90), volume discounts and growth pricing, data portability clause.

## SECTION: Reference Customers
3 reference customers: for each include company name, company size, industry, tenure as customer, and note that contact is available for reference call.

## SECTION: Risk Assessment
Vendor risk factors and mitigations: single-vendor dependency risk, business continuity plan, data portability and exit strategy, financial stability indicators, regulatory compliance status. Use green/yellow/red risk levels.`,
  };

  return instructions[personaId] || '';
}
