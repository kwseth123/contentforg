'use client';

import { useState } from 'react';
import Logo from '@/components/Logo';

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div style={{ background: '#FFFFFF', color: '#0A0A0A', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* ─── TOP NAV ─── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#FFFFFF',
          borderBottom: '1px solid #EEEEEE',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
          }}
        >
          <Logo size={32} showText={true} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/login" style={{ color: '#666', fontSize: 14, textDecoration: 'none' }}>
              Log In
            </a>
            <a
              href="/onboarding"
              style={{
                background: '#6366F1',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                padding: '8px 18px',
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-block',
              background: '#F0EFFF',
              color: '#6366F1',
              fontSize: 13,
              fontWeight: 600,
              padding: '6px 16px',
              borderRadius: 999,
              marginBottom: 24,
            }}
          >
            Built by a sales leader, for sales teams
          </div>
          <h1
            style={{
              fontSize: 52,
              fontWeight: 900,
              letterSpacing: -2,
              lineHeight: 1.05,
              color: '#0A0A0A',
              margin: 0,
            }}
          >
            Your sales team can&apos;t wait 3&nbsp;weeks for a one-pager.
          </h1>
          <p
            style={{
              fontSize: 18,
              color: '#666',
              lineHeight: 1.7,
              marginTop: 20,
              maxWidth: 580,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            ContentForg gives every rep on-brand, up-to-date sales content in 60 seconds. No marketing
            requests. No approvals. No outdated decks.
          </p>
          <p style={{ fontSize: 14, fontStyle: 'italic', color: '#999', marginTop: 8 }}>
            Built by a VP of Sales who got tired of waiting on marketing.
          </p>

          {/* Email row */}
          <div
            style={{
              marginTop: 32,
              maxWidth: 480,
              marginLeft: 'auto',
              marginRight: 'auto',
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              type="email"
              placeholder="Enter your work email"
              style={{
                flex: 1,
                background: '#F8F8F8',
                border: '1px solid #E5E5E5',
                borderRadius: 8,
                padding: '12px 16px',
                fontSize: 14,
                outline: 'none',
                color: '#333',
              }}
            />
            <a
              href="/onboarding"
              style={{
                background: '#6366F1',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 14,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Start Free Trial →
            </a>
          </div>
          <p style={{ fontSize: 11, color: '#AAAAAA', marginTop: 10 }}>
            Free 14-day trial · No credit card required · Cancel anytime
          </p>

          {/* App mockup */}
          <div
            style={{
              marginTop: 48,
              maxWidth: 800,
              marginLeft: 'auto',
              marginRight: 'auto',
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid #E5E5E5',
              boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
              display: 'flex',
              minHeight: 400,
            }}
          >
            {/* Sidebar */}
            <div
              style={{
                width: 160,
                background: '#111111',
                padding: '20px 12px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ marginBottom: 24 }}>
                <Logo size={24} variant="dark" showText={true} />
              </div>
              {['Dashboard', 'Generate', 'History', 'Library', 'Products', 'Knowledge Base'].map(
                (item, i) => (
                  <div
                    key={item}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      color: i === 0 ? '#fff' : '#777',
                      background: i === 0 ? '#1A1A1A' : 'transparent',
                    }}
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
            {/* Content area */}
            <div style={{ flex: 1, background: '#FAFAFA', padding: 24 }}>
              {/* Prompt box */}
              <div
                style={{
                  background: '#1A1A1A',
                  borderRadius: 10,
                  padding: 20,
                  marginBottom: 16,
                }}
              >
                <div style={{ color: '#6366F1', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                  What do you need today?
                </div>
                <div
                  style={{
                    background: '#2A2A2A',
                    borderRadius: 6,
                    padding: '10px 14px',
                    color: '#666',
                    fontSize: 13,
                  }}
                >
                  Battle card vs Salesforce for a distribution company...
                </div>
              </div>
              {/* Stat cards */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Generated this week', value: '24' },
                  { label: 'Content types used', value: '8' },
                  { label: 'Time saved', value: '12h' },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      background: '#fff',
                      border: '1px solid #E5E5E5',
                      borderRadius: 8,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#6366F1' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Recent generations */}
              <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                Recent Generations
              </div>
              {[
                'Battle Card — vs Salesforce',
                'Solution One-Pager — Acme Corp',
                'ROI Business Case — LogiTech',
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#fff',
                    border: '1px solid #EEEEEE',
                    borderRadius: 6,
                    marginBottom: 6,
                    fontSize: 12,
                    color: '#444',
                  }}
                >
                  <span>{item}</span>
                  <span style={{ color: '#aaa', fontSize: 11 }}>Just now</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PAIN POINTS ─── */}
      <section style={{ background: '#F8F8F8', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0A0A0A', marginBottom: 8 }}>
          Sound familiar?
        </h2>
        <p style={{ fontSize: 16, color: '#888', marginBottom: 40 }}>
          Every sales leader has felt this. ContentForg fixes all three.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 16,
            maxWidth: 960,
            margin: '0 auto',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {[
            {
              icon: '🕐',
              title: 'Marketing is always backlogged',
              body: "Your rep needs a battle card for tomorrow's demo. Marketing says two weeks. The deal can't wait two weeks.",
            },
            {
              icon: '⚠️',
              title: 'Your content is always outdated',
              body: 'The one-pager has last quarter\'s pricing and a product you renamed six months ago. Nobody has time to update it.',
            },
            {
              icon: '🙋',
              title: 'Your content person is slammed',
              body: "You hired someone to handle this but they're buried in requests. Every rep is waiting. Nobody is selling.",
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                flex: '1 1 280px',
                maxWidth: 320,
                background: '#fff',
                border: '1px solid #EEEEEE',
                borderRadius: 10,
                padding: 24,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: '#F5F4FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  marginBottom: 14,
                }}
              >
                {card.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{card.title}</div>
              <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{card.body}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#6366F1' }}>
            ContentForg fixes all three.
          </div>
          <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
            Every rep. Every document. Always on-brand. Always current.
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 48 }}>
          From prompt to polished document in 60 seconds
        </h2>
        <div
          style={{
            display: 'flex',
            maxWidth: 900,
            margin: '0 auto',
            position: 'relative',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 32,
          }}
        >
          {/* Dotted connector line (desktop only) */}
          <div
            className="steps-line"
            style={{
              position: 'absolute',
              top: 28,
              left: '20%',
              right: '20%',
              borderTop: '2px dashed #E5E5E5',
              zIndex: 0,
            }}
          />
          {[
            {
              num: '1',
              title: 'Load your knowledge base',
              desc: 'Add your products, brand voice, competitors, and customer wins. Set up once in under 5 minutes. Every document uses it automatically.',
            },
            {
              num: '2',
              title: 'Type what you need',
              desc: "Write in plain English — 'Battle card vs Salesforce for a distribution company in Ohio.' No forms. No dropdowns. Just type.",
            },
            {
              num: '3',
              title: 'Export and send',
              desc: 'Get a polished on-brand PDF or PowerPoint in under 60 seconds. Send it directly from the app or download and go.',
            },
          ].map((step) => (
            <div
              key={step.num}
              style={{ flex: '1 1 240px', maxWidth: 280, position: 'relative', zIndex: 1 }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#6366F1',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                {step.num}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CONTENT TYPES ─── */}
      <section style={{ background: '#F8F8F8', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
          40 content types. One platform.
        </h2>
        <p style={{ fontSize: 16, color: '#888', marginBottom: 40 }}>
          Everything your sales team needs — generated in seconds, always on-brand.
        </p>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'left' }}>
          {[
            {
              label: 'Prospect Documents',
              items: [
                'Solution One-Pager',
                'Case Study',
                'Executive Summary',
                'Proposal',
                'ROI Business Case',
                'Implementation Timeline',
                'Conference Leave-Behind',
                'Product Feature Sheet',
                'Comparison Guide',
                'Customer Success Story',
              ],
            },
            {
              label: 'Internal Sales Tools',
              items: [
                'Battle Card',
                'Competitive Analysis',
                'Discovery Call Prep',
                'Objection Handling Guide',
                'Champion Enablement Kit',
                'Mutual Action Plan',
                'Stakeholder Map',
                'Win/Loss Analysis',
                'Cold Call Script',
                'Voicemail Script',
              ],
            },
            {
              label: 'Email and Outreach',
              items: [
                'Outbound Email Sequence',
                'Post-Demo Follow Up',
                'Post-Meeting Summary',
                'Executive Sponsor Email',
                'LinkedIn Sequence',
                'Webinar Invitation',
              ],
            },
            {
              label: 'Marketing Support',
              items: [
                'LinkedIn Post',
                'Blog Post Outline',
                'Press Release',
                'Event Leave-Behind',
                'Video Script',
                'Thought Leadership Article',
              ],
            },
          ].map((group) => (
            <div key={group.label} style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#333', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {group.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {group.items.map((item) => (
                  <span
                    key={item}
                    style={{
                      background: '#fff',
                      border: '1px solid #E5E5E5',
                      borderRadius: 20,
                      padding: '4px 12px',
                      fontSize: 12,
                      color: '#444',
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <section style={{ padding: '80px 24px' }}>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'flex',
            gap: 48,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Quote */}
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ fontSize: 80, lineHeight: 1, color: '#6366F1', fontWeight: 700 }}>&ldquo;</div>
            <p
              style={{
                fontSize: 20,
                fontStyle: 'italic',
                color: '#1A1A1A',
                lineHeight: 1.6,
                marginTop: -16,
              }}
            >
              For the first time my reps can generate a personalized one-pager for any prospect in the
              time it takes to get a coffee. Our marketing team actually thanked us.
            </p>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A', marginTop: 16 }}>
              VP of Sales, Mid-Market Manufacturing Company
            </div>
            <div style={{ fontStyle: 'italic', fontSize: 12, color: '#AAAAAA', marginTop: 4 }}>
              Early ContentForg customer
            </div>
          </div>
          {/* Stats */}
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { num: '60s', label: 'Average time to generate a document' },
              { num: '40+', label: 'Content types available' },
              { num: '100%', label: 'On-brand every time' },
            ].map((stat) => (
              <div
                key={stat.num}
                style={{
                  background: '#F8F8F8',
                  border: '1px solid #EEEEEE',
                  borderRadius: 10,
                  padding: '20px 24px',
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 800, color: '#6366F1' }}>{stat.num}</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section style={{ background: '#F8F8F8', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
          Simple pricing. No surprises.
        </h2>
        <p style={{ fontSize: 16, color: '#888', marginBottom: 28 }}>
          Start free. Upgrade when your team is ready.
        </p>

        {/* Toggle */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: annual ? 400 : 600, color: annual ? '#888' : '#0A0A0A' }}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            style={{
              width: 48,
              height: 26,
              borderRadius: 999,
              background: annual ? '#6366F1' : '#D1D5DB',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 3,
                left: annual ? 25 : 3,
                transition: 'left 0.2s',
              }}
            />
          </button>
          <span style={{ fontSize: 14, fontWeight: annual ? 600 : 400, color: annual ? '#0A0A0A' : '#888' }}>
            Annual
          </span>
          {annual && (
            <span
              style={{
                background: '#DCFCE7',
                color: '#16A34A',
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 999,
              }}
            >
              Save 17%
            </span>
          )}
        </div>

        {/* Pricing cards */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            maxWidth: 1100,
            margin: '0 auto',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'stretch',
          }}
        >
          {/* Starter */}
          <PricingCard
            name="Starter"
            price="$0"
            period="/month"
            desc="For individuals getting started"
            features={[
              '5 generations per month',
              'All 40 content types',
              'PDF export',
              '1 user',
              'Knowledge base',
            ]}
            buttonText="Start Free"
            buttonStyle="outlined"
            href="/onboarding"
          />
          {/* Team */}
          <PricingCard
            name="Team"
            price={annual ? '$207' : '$249'}
            period="/month"
            desc="For sales teams who need to move fast"
            features={[
              'Unlimited generations',
              'Up to 10 users',
              'PDF and PPTX export',
              'Brand settings and logo',
              'File upload for knowledge base',
              'Email support',
              '14-day free trial',
            ]}
            buttonText="Start Free Trial"
            buttonStyle="solid"
            href="/onboarding"
            highlighted
            badge="Most Popular"
          />
          {/* Business */}
          <PricingCard
            name="Business"
            price={annual ? '$581' : '$699'}
            period="/month"
            desc="For larger teams with advanced needs"
            features={[
              'Everything in Team',
              'Up to 50 users',
              'Multiple knowledge bases',
              'Priority support',
              'Custom onboarding call',
              'Advanced analytics',
              '14-day free trial',
            ]}
            buttonText="Start Free Trial"
            buttonStyle="outlined"
            href="/onboarding"
          />
          {/* Enterprise */}
          <PricingCard
            name="Enterprise"
            price="Custom"
            period=""
            desc="For organizations that need it all"
            features={[
              'Unlimited users',
              'White label — your logo and colors',
              'Dedicated customer success manager',
              'SLA guarantee',
              'Custom integrations',
              'API access',
            ]}
            buttonText="Contact Sales"
            buttonStyle="dark"
            href="mailto:hello@contentforg.com"
          />
        </div>

        <div style={{ marginTop: 28, fontSize: 12, color: '#888' }}>
          <p style={{ margin: '4px 0' }}>
            Annual billing saves 17% — pay yearly and get 2 months free
          </p>
          <p style={{ margin: '4px 0' }}>
            All paid plans include a 14-day free trial · Cancel anytime · No setup fees
          </p>
        </div>
        <p style={{ fontSize: 13, color: '#6366F1', fontWeight: 500, marginTop: 16 }}>
          🎉 Founding Member offer: First 10 customers get Team plan for $149/month — locked in
          forever.{' '}
          <a href="/onboarding" style={{ color: '#6366F1', textDecoration: 'underline' }}>
            Claim yours →
          </a>
        </p>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ background: '#0A0A0A', padding: '80px 24px', textAlign: 'center' }}>
        <h2
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: -1,
            margin: 0,
          }}
        >
          Your reps deserve better content.
        </h2>
        <p style={{ fontSize: 16, color: '#888', marginTop: 12 }}>
          Set up in 5 minutes. Generate your first document in 60 seconds. No credit card required.
        </p>
        <a
          href="/onboarding"
          style={{
            display: 'inline-block',
            background: '#6366F1',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            padding: '14px 32px',
            borderRadius: 8,
            textDecoration: 'none',
            marginTop: 28,
          }}
        >
          Start Free Trial →
        </a>
        <p style={{ fontSize: 11, color: '#555', marginTop: 12 }}>
          Join sales teams already generating better content faster
        </p>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: '#0A0A0A', borderTop: '1px solid #1A1A1A', padding: '32px 24px' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 24,
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div style={{ marginBottom: 8 }}>
              <Logo size={28} variant="dark" showText={true} />
            </div>
            <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
              AI-powered sales content for B2B teams.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Privacy Policy', href: '#' },
              { label: 'Terms of Service', href: '#' },
              { label: 'Contact Us', href: 'mailto:hello@contentforg.com' },
              { label: 'hello@contentforg.com', href: 'mailto:hello@contentforg.com' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <p
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#555',
            marginTop: 24,
            marginBottom: 0,
          }}
        >
          © 2026 ContentForg. All rights reserved.
        </p>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .steps-line { display: none !important; }
        }
        @media (max-width: 480px) {
          h1 { font-size: 32px !important; letter-spacing: -1px !important; }
          h2 { font-size: 28px !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Pricing Card Component ─── */

function PricingCard({
  name,
  price,
  period,
  desc,
  features,
  buttonText,
  buttonStyle,
  href,
  highlighted,
  badge,
}: {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  buttonText: string;
  buttonStyle: 'solid' | 'outlined' | 'dark';
  href: string;
  highlighted?: boolean;
  badge?: string;
}) {
  const btnStyles: Record<string, React.CSSProperties> = {
    solid: { background: '#6366F1', color: '#fff', border: 'none' },
    outlined: { background: 'transparent', color: '#6366F1', border: '2px solid #6366F1' },
    dark: { background: '#1A1A1A', color: '#fff', border: 'none' },
  };

  return (
    <div
      style={{
        flex: '1 1 230px',
        maxWidth: 260,
        background: '#fff',
        border: highlighted ? '2px solid #6366F1' : '1px solid #EEEEEE',
        borderRadius: 12,
        padding: 28,
        textAlign: 'left',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#6366F1',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          {badge}
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{name}</div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: '#0A0A0A' }}>{price}</span>
        <span style={{ fontSize: 14, color: '#888' }}>{period}</span>
      </div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>{desc}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
        {features.map((f) => (
          <li
            key={f}
            style={{
              fontSize: 13,
              color: '#444',
              padding: '4px 0',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0, marginTop: 1 }}
            >
              <path
                d="M4 8.5L6.5 11L12 5"
                stroke="#6366F1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <a
        href={href}
        style={{
          display: 'block',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 14,
          padding: '10px 0',
          borderRadius: 8,
          textDecoration: 'none',
          marginTop: 20,
          ...btnStyles[buttonStyle],
        }}
      >
        {buttonText}
      </a>
    </div>
  );
}
