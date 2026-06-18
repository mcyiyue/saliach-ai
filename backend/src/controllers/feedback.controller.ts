import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { query, response, citations, rating, comment } = req.body;

    if (!query || !response || rating === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const feedback = await prisma.chatFeedback.create({
      data: {
        query,
        response,
        citations: citations ? JSON.stringify(citations) : null,
        rating,
        comment,
        isResolved: false
      }
    });

    res.json({ message: 'Feedback submitted successfully', data: feedback });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFeedbacks = async (req: Request, res: Response) => {
  try {
    const feedbacks = await prisma.chatFeedback.findMany({
      orderBy: [
        { isResolved: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(feedbacks);
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resolveFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const feedback = await prisma.chatFeedback.update({
      where: { id: Number(id) },
      data: { isResolved: true }
    });

    res.json({ message: 'Feedback resolved', data: feedback });
  } catch (error) {
    console.error('Resolve feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
