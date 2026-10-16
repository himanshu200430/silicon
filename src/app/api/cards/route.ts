import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateNextId } from '@/lib/idGenerator';
import { getTierFromValue } from '@/types';

// GET /api/cards - List cards with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uncaught = searchParams.get('uncaught');
    const caughtByTeam = searchParams.get('caughtByTeam');
    const isAR = searchParams.get('ar') === 'true';

    const where: {
      isCaught?: boolean;
      caughtByTeam?: string;
    } = {};

    if (uncaught === 'true') {
      where.isCaught = false;
    }

    if (caughtByTeam !== null && caughtByTeam !== undefined) {
      where.caughtByTeam = caughtByTeam;
    }

    const cards = await prisma.card.findMany({
      where,
      orderBy: { id: 'asc' },
    });

    if (isAR) {
      const arCards = cards.map((card) => ({
        ...card,
        tier: card.tier || getTierFromValue(card.value),
        mindFile: card.mindFile?.startsWith('/')
          ? card.mindFile
          : `/ar-targets/${card.mindFile}`,
      }));
      return NextResponse.json(arCards);
    }

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}

// POST /api/cards - Create a new card with auto-generated sequential ID
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      value = 50,
      question = '',
      options = ['', '', '', ''],
      correctAnswer = 0,
      image = '',
      mindFile = '',
      modelUrl = '',
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Card name is required' },
        { status: 400 }
      );
    }

    const numericValue = Number(value);
    let prefix: 'c1' | 'c2' | 'c3' = 'c1';
    if (numericValue === 20) {
      prefix = 'c2';
    } else if (numericValue === 8) {
      prefix = 'c3';
    } else if (numericValue < 20) {
      prefix = 'c3';
    } else if (numericValue < 50) {
      prefix = 'c2';
    }

    const newCardId = await generateNextId('cards', prefix);
    const calculatedTier = getTierFromValue(numericValue);

    const newCard = await prisma.card.create({
      data: {
        id: newCardId,
        name: name.trim(),
        value: numericValue,
        tier: body.tier || calculatedTier,
        image: image || '',
        question: question.trim(),
        options: options.map((opt: string) => opt.trim()),
        correctAnswer: Number(correctAnswer) || 0,
        targetIndex: body.targetIndex !== undefined && body.targetIndex !== null && body.targetIndex !== '' ? Number(body.targetIndex) : null,
        mindFile: mindFile || '',
        modelUrl: modelUrl || '',
        isCaught: false,
        caughtByTeam: '',
      },
    });

    return NextResponse.json(newCard, { status: 201 });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    );
  }
}
