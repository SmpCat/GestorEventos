import { cache } from 'react';
import { prisma } from './prisma';

// React Cache memoiza la ejecución de esta función por cada petición HTTP (request).
// Si 10 componentes de servidor piden el evento activo durante el mismo render, 
// Prisma/SQLite solo recibirá 1 consulta real.
export const getActiveEventCached = cache(async () => {
  return await prisma.event.findFirst({
    where: { isActive: true }
  });
});
