import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pptxgen from 'pptxgenjs';
import { getKnowledgeBase } from '@/lib/knowledgeBase';
import { resolveBrandGuidelines, getPptxFont } from '@/lib/brandDefaults';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sections, contentType, prospect } = await req.json();
  const kb = await getKnowledgeBase();
  const brand = resolveBrandGuidelines(kb);

  // Map Google Fonts to system fonts for PPTX
  const headingFont = getPptxFont(brand.fonts.primary);
  const bodyFont = getPptxFont(brand.fonts.secondary);

  // Strip '#' from hex colors for pptxgenjs
  const primaryColor = brand.colors.primary.replace('#', '');
  const secondaryColor = brand.colors.secondary.replace('#', '');
  const accentColor = brand.colors.accent.replace('#', '');
  const textColor = brand.colors.text.replace('#', '');
  const bgColor = brand.colors.background.replace('#', '');

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.author = kb.companyName || 'ContentForg';

  // Title slide — uses primary color as background
  const titleSlide = pres.addSlide();
  titleSlide.background = { color: primaryColor };
  titleSlide.addText(contentType.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()), {
    x: 0.5,
    y: 1.0,
    w: '90%',
    fontSize: brand.fonts.sizes.h1,
    color: 'FFFFFF',
    bold: true,
    fontFace: headingFont,
  });
  titleSlide.addText(`Prepared for ${prospect.companyName}`, {
    x: 0.5,
    y: 2.2,
    w: '90%',
    fontSize: brand.fonts.sizes.h2,
    color: secondaryColor,
    fontFace: bodyFont,
  });
  if (kb.companyName) {
    titleSlide.addText(`By ${kb.companyName}`, {
      x: 0.5,
      y: 3.0,
      w: '90%',
      fontSize: brand.fonts.sizes.h3,
      color: 'CCCCCC',
      fontFace: bodyFont,
    });
  }
  // Tagline in footer
  if (brand.voice.tagline) {
    titleSlide.addText(brand.voice.tagline, {
      x: 0.5,
      y: 4.8,
      w: '90%',
      fontSize: 10,
      color: 'AAAAAA',
      fontFace: bodyFont,
      italic: true,
    });
  }
  // Accent bar
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 1.85,
    w: 1.5,
    h: 0.06,
    fill: { color: accentColor },
  });

  // Content slides
  for (const section of sections) {
    const slide = pres.addSlide();
    slide.background = { color: bgColor };

    // Section title
    slide.addText(section.title, {
      x: 0.5,
      y: 0.3,
      w: '90%',
      fontSize: brand.fonts.sizes.h2,
      color: primaryColor,
      bold: true,
      fontFace: headingFont,
    });

    // Accent underline
    slide.addShape(pres.ShapeType.rect, {
      x: 0.5,
      y: 0.9,
      w: 2.0,
      h: 0.04,
      fill: { color: secondaryColor },
    });

    // Section content
    slide.addText(section.content, {
      x: 0.5,
      y: 1.2,
      w: '90%',
      h: 4.5,
      fontSize: brand.fonts.sizes.body,
      color: textColor,
      fontFace: bodyFont,
      valign: 'top',
      wrap: true,
    });

    // Footer with company name and tagline
    const footerText = [kb.companyName, brand.voice.tagline].filter(Boolean).join(' — ');
    if (footerText) {
      slide.addText(footerText, {
        x: 0.5,
        y: 5.3,
        w: '90%',
        fontSize: 8,
        color: 'AAAAAA',
        fontFace: bodyFont,
      });
    }
  }

  const buffer = await pres.write({ outputType: 'nodebuffer' }) as Buffer;
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${contentType}-${prospect.companyName}.pptx"`,
    },
  });
}
