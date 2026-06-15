import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

/**
 * Get all external links
 */
export const getLinks = async (req: Request, res: Response): Promise<void> => {
  try {
    const links = await prisma.externalLink.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(links);
  } catch (error) {
    console.error('Error in getLinks:', error);
    res.status(500).json({ message: 'Failed to retrieve external links.' });
  }
};

/**
 * Create a new external link
 */
export const createLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, url, description } = req.body;

    if (!title || !url) {
      res.status(400).json({ message: 'Title and URL are required.' });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      res.status(400).json({ message: 'Invalid URL format.' });
      return;
    }

    const existing = await prisma.externalLink.findUnique({
      where: { url },
    });

    if (existing) {
      res.status(400).json({ message: 'An external link with this URL already exists.' });
      return;
    }

    const newLink = await prisma.externalLink.create({
      data: { title, url, description },
    });

    res.status(201).json(newLink);
  } catch (error) {
    console.error('Error in createLink:', error);
    res.status(500).json({ message: 'Failed to create external link.' });
  }
};

/**
 * Update an existing external link
 */
export const updateLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, url, description } = req.body;

    if (!title || !url) {
      res.status(400).json({ message: 'Title and URL are required.' });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      res.status(400).json({ message: 'Invalid URL format.' });
      return;
    }

    const linkId = Number(id);
    if (isNaN(linkId)) {
      res.status(400).json({ message: 'Invalid ID.' });
      return;
    }

    const existing = await prisma.externalLink.findUnique({
      where: { url },
    });

    if (existing && existing.id !== linkId) {
      res.status(400).json({ message: 'Another external link with this URL already exists.' });
      return;
    }

    const updated = await prisma.externalLink.update({
      where: { id: linkId },
      data: { title, url, description },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error in updateLink:', error);
    res.status(500).json({ message: 'Failed to update external link.' });
  }
};

/**
 * Delete an external link
 */
export const deleteLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const linkId = Number(id);
    if (isNaN(linkId)) {
      res.status(400).json({ message: 'Invalid ID.' });
      return;
    }

    await prisma.externalLink.delete({
      where: { id: linkId },
    });

    res.json({ message: 'External link successfully deleted.' });
  } catch (error) {
    console.error('Error in deleteLink:', error);
    res.status(500).json({ message: 'Failed to delete external link.' });
  }
};
