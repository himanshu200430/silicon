import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTierFromValue } from '@/types';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/cards/[id] - Fetch single card by ID
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const card = await prisma.card.findUnique({
      where: { id },
    });

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    const formattedCard = {
      ...card,
      tier: card.tier || getTierFromValue(card.value),
      mindFile: card.mindFile?.startsWith('/')
        ? card.mindFile
        : `/ar-targets/${card.mindFile}`,
    };

    return NextResponse.json(formattedCard);
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card' },
      { status: 500 }
    );
  }
}

// PUT /api/cards/[id] - Update card
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.card.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.value !== undefined && { value: Number(body.value) }),
        ...(body.tier !== undefined && { tier: body.tier }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.question !== undefined && { question: body.question.trim() }),
        ...(body.options !== undefined && {
          options: body.options.map((opt: string) => opt.trim()),
        }),
        ...(body.correctAnswer !== undefined && {
          correctAnswer: Number(body.correctAnswer),
        }),
        ...(body.mindFile !== undefined && { mindFile: body.mindFile }),
        ...(body.modelUrl !== undefined && { modelUrl: body.modelUrl }),
        ...(body.isCaught !== undefined && { isCaught: Boolean(body.isCaught) }),
        ...(body.targetIndex !== undefined && {
          targetIndex: body.targetIndex === null || body.targetIndex === '' ? null : Number(body.targetIndex),
        }),
        ...(body.caughtByTeam !== undefined && {
          caughtByTeam: body.caughtByTeam,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    );
  }
}

// DELETE /api/cards/[id] - Delete card
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.card.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    );
  }
}
