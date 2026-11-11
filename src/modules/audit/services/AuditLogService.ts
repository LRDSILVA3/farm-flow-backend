import { Request } from 'express';
import { getRepository, EntityTarget } from 'typeorm';
import AuditLog, { AuditFieldChange } from '../typeorm/entities/AuditLog';

export type AuditFieldFormat = 'currency' | 'area' | 'boolean' | 'array' | 'text';

export interface AuditFieldDefinition {
  label: string;
  format?: AuditFieldFormat;
}

export type AuditFieldMap = Record<string, string | AuditFieldDefinition>;

const SENSITIVE_KEYS = new Set(['password', 'token', 'secret', 'authorization']);

export const sanitizeAuditData = (input: any, omitKeys: string[] = ['logs']): Record<string, any> | null => {
  if (!input || typeof input !== 'object') return null;
  const omitSet = new Set(omitKeys);
  const out: Record<string, any> = {};

  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase()) || omitSet.has(key)) {
      continue;
    }
    if (value === undefined) continue;
    out[key] = value;
  }

  return out;
};

const normalizeComparable = (val: any, format?: AuditFieldFormat): any => {
  if (val === undefined || val === null || val === '') return null;
  if (format === 'currency' || format === 'area') {
    const num = Number(val);
    return Number.isFinite(num) ? Number(num.toFixed(2)) : String(val);
  }
  if (format === 'boolean') {
    return Boolean(val);
  }
  if (Array.isArray(val)) {
    return JSON.stringify(val);
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val).trim();
};

export const formatAuditValue = (val: any, format?: AuditFieldFormat): string => {
  if (val === undefined || val === null || val === '') return '-';
  if (format === 'currency') {
    const num = Number(val);
    if (!Number.isFinite(num)) return String(val);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  if (format === 'area') {
    const num = Number(val);
    if (!Number.isFinite(num)) return String(val);
    return `${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`;
  }
  if (format === 'boolean') {
    return val ? 'Sim' : 'Não';
  }
  if (Array.isArray(val)) {
    return val.length > 0 ? val.join(', ') : 'Nenhum';
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
};

export const diffObjects = (
  before: Record<string, any> | null | undefined,
  after: Record<string, any> | null | undefined,
  fields: AuditFieldMap,
): AuditFieldChange[] => {
  if (!before || !after) return [];
  const changes: AuditFieldChange[] = [];

  for (const [field, def] of Object.entries(fields)) {
    const config: AuditFieldDefinition =
      typeof def === 'string' ? { label: def, format: 'text' } : def;

    const prevRaw = before[field];
    const nextRaw = after[field];

    const prevNorm = normalizeComparable(prevRaw, config.format);
    const nextNorm = normalizeComparable(nextRaw, config.format);

    if (prevNorm !== nextNorm) {
      changes.push({
        field,
        label: config.label,
        before: formatAuditValue(prevRaw, config.format),
        after: formatAuditValue(nextRaw, config.format),
      });
    }
  }

  return changes;
};

export const formatChangesSummary = (changes: AuditFieldChange[]): string => {
  if (!changes || changes.length === 0) return '';
  return changes.map(c => `${c.label}: ${c.before} → ${c.after}`).join(' | ');
};

export interface AuditActor {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

export const extractActorFromRequest = (req?: Request): AuditActor => {
  if (!req?.user) return {};
  return {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  };
};

export const extractClientIp = (req?: Request): string | undefined => {
  if (!req) return undefined;
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || (req as any).socket?.remoteAddress || undefined;
};

export const safeFindSnapshot = async <T>(
  entity: EntityTarget<T>,
  idOrWhere: any,
): Promise<Record<string, any> | null> => {
  try {
    const repo = getRepository(entity);
    const found = await repo.findOne(idOrWhere);
    return found ? { ...(found as any) } : null;
  } catch {
    return null;
  }
};

export interface RecordAuditParams {
  req?: Request;
  actor?: AuditActor;
  module: string;
  action: string;
  entityId?: string | null;
  entityLabel?: string | null;
  summary: string;
  changes?: AuditFieldChange[] | null;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  omitDataKeys?: string[];
}

export const recordAudit = async (params: RecordAuditParams): Promise<AuditLog | null> => {
  try {
    const repo = getRepository(AuditLog);
    const reqActor = extractActorFromRequest(params.req);
    const actor = {
      id: params.actor?.id ?? reqActor.id,
      name: params.actor?.name ?? reqActor.name ?? 'Sistema',
      email: params.actor?.email ?? reqActor.email,
      role: params.actor?.role ?? reqActor.role,
    };

    const userAgentRaw = params.req?.headers?.['user-agent'];
    const userAgent =
      typeof userAgentRaw === 'string' ? userAgentRaw.slice(0, 250) : undefined;

    const entry = repo.create({
      user_id: actor.id || undefined,
      user_name: actor.name || undefined,
      user_email: actor.email || undefined,
      user_role: actor.role || undefined,
      module: params.module,
      action: params.action,
      entity_id: params.entityId || undefined,
      entity_label: params.entityLabel || undefined,
      summary: params.summary,
      changes: params.changes && params.changes.length > 0 ? params.changes : null,
      before_data: params.beforeData
        ? sanitizeAuditData(params.beforeData, params.omitDataKeys)
        : null,
      after_data: params.afterData
        ? sanitizeAuditData(params.afterData, params.omitDataKeys)
        : null,
      ip_address: extractClientIp(params.req),
      user_agent: userAgent,
    });

    return await repo.save(entry);
  } catch {
    // Non-blocking audit write during unit tests or offline metadata edge cases
    return null;
  }
};

export interface AuditListFilters {
  module?: string;
  action?: string;
  userId?: string;
  entityId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const listAuditLogs = async (filters: AuditListFilters) => {
  const repo = getRepository(AuditLog);
  const qb = repo.createQueryBuilder('a');

  if (filters.module && filters.module !== 'all') {
    qb.andWhere('a.module = :module', { module: filters.module });
  }

  if (filters.action && filters.action !== 'all') {
    qb.andWhere('a.action = :action', { action: filters.action });
  }

  if (filters.userId && filters.userId !== 'all') {
    qb.andWhere('a.user_id = :userId', { userId: filters.userId });
  }

  if (filters.entityId) {
    qb.andWhere('a.entity_id = :entityId', { entityId: filters.entityId });
  }

  if (filters.startDate) {
    const startVal = filters.startDate.includes('T')
      ? filters.startDate
      : `${filters.startDate} 00:00:00`;
    qb.andWhere('a.created_at >= :startDate', {
      startDate: startVal,
    });
  }

  if (filters.endDate) {
    const endVal = filters.endDate.includes('T')
      ? filters.endDate
      : `${filters.endDate} 23:59:59`;
    qb.andWhere('a.created_at <= :endDate', {
      endDate: endVal,
    });
  }

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim().toLowerCase()}%`;
    qb.andWhere(
      '(LOWER(COALESCE(a.user_name, \'\')) LIKE :term OR LOWER(COALESCE(a.user_email, \'\')) LIKE :term OR LOWER(COALESCE(a.entity_label, \'\')) LIKE :term OR LOWER(a.summary) LIKE :term OR LOWER(COALESCE(a.entity_id, \'\')) LIKE :term)',
      { term },
    );
  }

  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 25));

  qb.orderBy('a.created_at', 'DESC').skip((page - 1) * limit).take(limit);

  const [items, total] = await qb.getManyAndCount();

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

