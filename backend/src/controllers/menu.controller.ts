import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/rbac.middleware';

export const getMenuTree = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // 1. Get user's groups
    const userGroups = await prisma.userGroup.findMany({
      where: { userId: req.user.id },
      select: { groupId: true },
    });

    const groupIds = userGroups.map(ug => ug.groupId);

    if (groupIds.length === 0) {
      res.json([]);
      return;
    }

    // 2. Get modules where group has canRead permission
    const permissions = await prisma.groupPermission.findMany({
      where: {
        groupId: { in: groupIds },
        canRead: true,
      },
      include: {
        module: true,
      },
    });

    // Extract unique modules
    const moduleMap = new Map<number, any>();
    for (const perm of permissions) {
      if (!moduleMap.has(perm.module.id)) {
        moduleMap.set(perm.module.id, { ...perm.module, children: [] });
      }
    }

    const modules = Array.from(moduleMap.values());

    // 3. Build tree
    const tree: any[] = [];
    const lookup: any = {};

    modules.forEach(m => {
      lookup[m.id] = m;
    });

    modules.forEach(m => {
      if (m.parentId === null) {
        tree.push(lookup[m.id]);
      } else {
        if (lookup[m.parentId]) {
          lookup[m.parentId].children.push(lookup[m.id]);
        }
        // If parent is not in the allowed modules (maybe missing permission for parent but have for child)
        // You might want to handle this case depending on your business logic.
        // For now, if parent isn't loaded, we'll put it at the root to avoid hiding it completely.
        else {
           tree.push(lookup[m.id]);
        }
      }
    });

    res.json(tree);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
