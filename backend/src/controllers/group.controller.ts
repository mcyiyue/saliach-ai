import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const groups = await prisma.group.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(groups);
  } catch (error) {
    console.error('Failed to get groups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Group name is required' });
      return;
    }

    const existing = await prisma.group.findUnique({
      where: { name }
    });

    if (existing) {
      res.status(400).json({ message: 'Group name already exists' });
      return;
    }

    const newGroup = await prisma.group.create({
      data: { name, description }
    });

    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Failed to create group:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Group name is required' });
      return;
    }

    const groupId = Number(id);
    if (isNaN(groupId)) {
      res.status(400).json({ message: 'Invalid group ID' });
      return;
    }

    // Check if name is taken by other group
    const existing = await prisma.group.findFirst({
      where: {
        name,
        id: { not: groupId }
      }
    });

    if (existing) {
      res.status(400).json({ message: 'Group name already exists' });
      return;
    }

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: { name, description }
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to update group:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const groupId = Number(id);

    if (isNaN(groupId)) {
      res.status(400).json({ message: 'Invalid group ID' });
      return;
    }

    // Prevent deleting Administrator group (ID: 1)
    if (groupId === 1) {
      res.status(400).json({ message: 'Cannot delete the Administrator group' });
      return;
    }

    await prisma.group.delete({
      where: { id: groupId }
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Failed to delete group:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
