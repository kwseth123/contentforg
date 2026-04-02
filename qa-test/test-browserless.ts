/**
 * Test Browserless.io PDF generation with a one-pager document.
 * Run: npx tsx qa-test/test-browserless.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { getStyle, getDefaultStyleForContentType } from '../src/lib/documentStyles/registry';
import { StyleInput } from '../src/lib/documentStyles/types';

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY || '2UG6GRhiStTfV0B0aca57c9f36329f032e3d692bf5b35754e';

async function testBrowserlessPdf() {
  // 1. Generate a one-pager HTML
  const styleId = getDefaultStyleForContentType('solution-one-pager');
  const style = getStyle(styleId);
  if (!style) {
    console.error('Style not found:', styleId);
    process.exit(1);
  }

  const input: StyleInput = {
    sections: [
      { id: 's1', title: 'Hero', content: '**Automate Your Manufacturing Workflows in 90 Days**\nEliminate manual data entry, reduce errors by 73%, and free your team to focus on what matters.' },
      { id: 's2', title: 'Key Metrics', content: '- **73%** | Error Reduction\n- **4.2x** | ROI in Year One\n- **90 Days** | Full Deployment' },
      { id: 's3', title: 'The Challenge', content: '- Manual data entry across 12+ disconnected systems\n- Average 14 hours per week spent on reconciliation\n- Compliance gaps from inconsistent reporting\n- No real-time visibility into production metrics' },
      { id: 's4', title: 'Our Solution', content: '- **Unified Data Layer** connects ERP, MES, and CRM in real-time\n- **Smart Automation** eliminates 85% of manual touchpoints\n- **Live Dashboards** give leadership instant visibility\n- **Compliance Engine** auto-generates audit-ready reports' },
      { id: 's5', title: 'Why Us', content: '- **12 years** in manufacturing automation\n- **340+ enterprise deployments** globally\n- **99.97% uptime** SLA guarantee\n- **Dedicated CSM** for every account' },
      { id: 's6', title: 'Proof', content: '"Acme Solutions cut our month-end close from 5 days to 8 hours. The ROI was undeniable within the first quarter." — Sarah Chen, VP Operations, Meridian Manufacturing' },
    ],
    contentType: 'solution-one-pager',
    prospect: { companyName: 'GlobalTech Industries', industry: 'Manufacturing', companySize: '2,500 employees' },
    companyName: 'Acme Solutions',
    companyDescription: 'Enterprise workflow automation platform',
    accentColor: '#4F46E5',
    date: 'April 1, 2026',
  };

  const html = style.render(input);
  console.log(`[1/3] Generated one-pager HTML (${html.length} chars)`);

  // Save the HTML for reference
  const htmlPath = path.resolve(__dirname, 'test-onepager.html');
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`  Saved HTML to: ${htmlPath}`);

  // 2. Send to Browserless for PDF generation
  console.log(`[2/3] Sending to Browserless.io for PDF generation...`);

  try {
    // Browserless v2 API uses production endpoint with Bearer token
    const endpoints = [
      { url: 'https://production-sfo.browserless.io/pdf', auth: 'bearer' },
      { url: 'https://chrome.browserless.io/pdf', auth: 'token' },
    ];

    let res: Response | null = null;
    for (const ep of endpoints) {
      console.log(`  Trying ${ep.url} (${ep.auth} auth)...`);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      let url = ep.url;
      if (ep.auth === 'bearer') {
        headers['Authorization'] = `Bearer ${BROWSERLESS_API_KEY}`;
      } else {
        url = `${ep.url}?token=${BROWSERLESS_API_KEY}`;
      }

      res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          html,
          options: {
            displayHeaderFooter: false,
            format: 'Letter',
            printBackground: true,
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
            preferCSSPageSize: true,
          },
        }),
      });

      console.log(`  Response: ${res.status} ${res.statusText}`);
      if (res.ok) break;
      const errSnippet = await res.text().catch(() => '');
      console.log(`  Error: ${errSnippet.slice(0, 200)}`);
    }

    if (!res || !res.ok) {
      console.error('\n  FAIL: All Browserless endpoints failed.');
      console.error('  Your BROWSERLESS_API_KEY may be expired or invalid.');
      console.error('  The API route includes a fallback to HTML print dialog.');
      console.error('  To fix: update BROWSERLESS_API_KEY in .env.local with a valid key from https://browserless.io');
      process.exit(1);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  FAIL: Browserless returned ${res.status}`);
      console.error(`  Error: ${errText.slice(0, 500)}`);
      process.exit(1);
    }

    const pdfBuffer = await res.arrayBuffer();
    const pdfPath = path.resolve(__dirname, 'test-onepager.pdf');
    fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));

    console.log(`  PDF generated: ${pdfBuffer.byteLength} bytes`);
    console.log(`  Saved PDF to: ${pdfPath}`);

    // 3. Basic PDF validation
    console.log(`[3/3] Validating PDF...`);

    const pdfHeader = Buffer.from(pdfBuffer).subarray(0, 5).toString('ascii');
    if (pdfHeader !== '%PDF-') {
      console.error(`  FAIL: Not a valid PDF (header: ${pdfHeader})`);
      process.exit(1);
    }

    const sizeKB = Math.round(pdfBuffer.byteLength / 1024);
    if (sizeKB < 5) {
      console.error(`  FAIL: PDF suspiciously small (${sizeKB}KB) — likely empty render`);
      process.exit(1);
    }

    console.log(`  Valid PDF header (%PDF-)`);
    console.log(`  Size: ${sizeKB}KB`);
    console.log(`\n══════════════════════════════════════`);
    console.log(`PASS — Browserless PDF generation works`);
    console.log(`  HTML: ${htmlPath}`);
    console.log(`  PDF:  ${pdfPath}`);
    console.log(`══════════════════════════════════════`);

  } catch (err: any) {
    console.error(`  FAIL: ${err.message}`);
    process.exit(1);
  }
}

testBrowserlessPdf();
