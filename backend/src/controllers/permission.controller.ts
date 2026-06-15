import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getModules = async (req: Request, res: Response): Promise<void> => {
  try {
    const modules = await prisma.module.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(modules);
  } catch (error) {
    console.error('Failed to get modules:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getGroupPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const gId = Number(groupId);

    if (isNaN(gId)) {
      res.status(400).json({ message: 'Invalid group ID' });
      return;
    }

    const permissions = await prisma.groupPermission.findMany({
      where: { groupId: gId },
      orderBy: { moduleId: 'asc' }
    });

    res.json(permissions);
  } catch (error) {
    console.error('Failed to get group permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateGroupPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { permissions } = req.body; // expects array of { moduleId: number, canRead: boolean, canWrite: boolean }

    const gId = Number(groupId);
    if (isNaN(gId)) {
      res.status(400).json({ message: 'Invalid group ID' });
      return;
    }

    if (!Array.isArray(permissions)) {
      res.status(400).json({ message: 'Permissions must be an array' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing permissions for this group
      await tx.groupPermission.deleteMany({
        where: { groupId: gId }
      });

      // 2. Bulk insert new permissions
      if (permissions.length > 0) {
        await tx.groupPermission.createMany({
          data: permissions.map(p => ({
            groupId: gId,
            moduleId: Number(p.moduleId),
            canRead: Boolean(p.canRead),
            canWrite: Boolean(p.canWrite)
          }))
        });
      }
    });

    res.json({ message: 'Permissions updated successfully' });
  } catch (error) {
    console.error('Failed to update group permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
