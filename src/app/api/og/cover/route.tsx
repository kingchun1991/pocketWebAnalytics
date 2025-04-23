/* eslint-disable react/no-unknown-property */
import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';

import TemplateSwitcher from '@/lib/components/image-templates/TemplateWrapper';
import { outfitBold, outfitMedium } from '@/lib/utils/font/outfit';

export const runtime = 'edge';

export const GET = async (request: NextRequest) => {
  const outfitMediumFontData = await outfitMedium;
  const outfitBoldFontData = await outfitBold;

  const { searchParams } = request.nextUrl;
  const heading = searchParams.get('heading')?.slice(0, 100);
  const text = searchParams.get('text')?.slice(0, 200);
  const template = searchParams.get('template')?.slice(0, 200);
  const center = Boolean(searchParams.get('center'));
  const width = Number(searchParams.get('width') ?? 1200);
  const height = Number(searchParams.get('height') ?? 630);
  const templateProps = { heading, text, template, center, width, height };

  return new ImageResponse(<TemplateSwitcher {...templateProps} />, {
    width,
    height,
    fonts: [
      {
        name: 'Outfit',
        data: outfitMediumFontData,
        weight: 500,
      },
      {
        name: 'Outfit',
        data: outfitBoldFontData,
        weight: 700,
      },
    ],
  });
};
