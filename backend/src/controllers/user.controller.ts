import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/rbac.middleware';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      include: {
        groups: {
          include: {
            group: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    // Flatten user groups representation for the client
    const formatted = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      groups: user.groups.map(ug => ug.group)
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Failed to get users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, groupIds } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    const newGroups = Array.isArray(groupIds) ? groupIds : [];

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password, // stored plain text to match auth.controller.ts
        groups: {
          create: newGroups.map((gId: number) => ({
            groupId: gId
          }))
        }
      },
      include: {
        groups: {
          include: {
            group: true
          }
        }
      }
    });

    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      createdAt: newUser.createdAt,
      groups: newUser.groups.map(ug => ug.group)
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, password, groupIds } = req.body;

    const userId = Number(id);
    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    if (!name || !email) {
      res.status(400).json({ message: 'Name and email are required' });
      return;
    }

    // Check if email is already taken by another user
    const existing = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId }
      }
    });

    if (existing) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    const newGroups = Array.isArray(groupIds) ? groupIds : [];

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Delete old user-group mappings
      await tx.userGroup.deleteMany({
        where: { userId }
      });

      // 2. Update user info and re-create group mappings
      return await tx.user.update({
        where: { id: userId },
        data: {
          name,
          email,
          ...(password ? { password } : {}), // only update password if provided
          groups: {
            create: newGroups.map((gId: number) => ({
              groupId: gId
            }))
          }
        },
        include: {
          groups: {
            include: {
              group: true
            }
          }
        }
      });
    });

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      createdAt: updatedUser.createdAt,
      groups: updatedUser.groups.map(ug => ug.group)
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = Number(id);

    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    // Prevent deleting own account
    if (req.user && req.user.id === userId) {
      res.status(400).json({ message: 'Cannot delete your own account' });
      return;
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
