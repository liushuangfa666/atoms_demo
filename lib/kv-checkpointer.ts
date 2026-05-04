import {
  BaseCheckpointSaver,
  Checkpoint,
  CheckpointTuple,
  CheckpointListOptions,
} from '@langchain/langgraph-checkpoint';
import { CheckpointMetadata, PendingWrite } from '@langchain/langgraph-checkpoint';
import type { RunnableConfig } from '@langchain/core/runnables';
import { getRedisClient } from './kv-storage';

const CP_PREFIX = 'atoms_cp';
const cpKey = (threadId: string, cpId: string) => `${CP_PREFIX}:${threadId}:${cpId}`;
const cpLatest = (threadId: string) => `${CP_PREFIX}:latest:${threadId}`;
const cpList = (threadId: string) => `${CP_PREFIX}:list:${threadId}`;
const cpMeta = (threadId: string, cpId: string) => `${CP_PREFIX}:meta:${threadId}:${cpId}`;
const writesKey = (threadId: string, cpId: string, taskId: string) =>
  `${CP_PREFIX}:writes:${threadId}:${cpId}:${taskId}`;

function getThreadId(config: RunnableConfig): string {
  return config.configurable?.thread_id || 'default';
}

export class KVCheckpointer extends BaseCheckpointSaver {
  constructor() {
    super();
  }

  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const r = getRedisClient();
    if (!r) return undefined;

    const threadId = getThreadId(config);
    const checkpointId = config.configurable?.checkpoint_id as string | undefined;

    let cpId = checkpointId;
    if (!cpId) {
      cpId = (await r.get(cpLatest(threadId))) || undefined;
    }
    if (!cpId) return undefined;

    const data = await r.get(cpKey(threadId, cpId));
    if (!data) return undefined;

    const checkpoint = JSON.parse(data) as Checkpoint;
    const metaData = await r.get(cpMeta(threadId, cpId));
    const metadata = metaData ? JSON.parse(metaData) as CheckpointMetadata : undefined;

    return {
      config: { ...config, configurable: { ...config.configurable, checkpoint_id: cpId } },
      checkpoint,
      metadata,
      parentConfig: undefined,
    };
  }

  async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions,
  ): AsyncGenerator<CheckpointTuple> {
    const r = getRedisClient();
    if (!r) return;

    const threadId = getThreadId(config);
    const idsData = await r.get(cpList(threadId));
    if (!idsData) return;
    const ids = JSON.parse(idsData) as string[];

    const limit = options?.limit || 10;
    let count = 0;
    for (const cpId of ids) {
      if (count >= limit) break;
      const data = await r.get(cpKey(threadId, cpId));
      if (data) {
        const checkpoint = JSON.parse(data) as Checkpoint;
        const metaData = await r.get(cpMeta(threadId, cpId));
        yield {
          config: { ...config, configurable: { ...config.configurable, checkpoint_id: cpId } },
          checkpoint,
          metadata: metaData ? JSON.parse(metaData) as CheckpointMetadata : undefined,
          parentConfig: undefined,
        };
        count++;
      }
    }
  }

  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    _newVersions: Record<string, string | number>,
  ): Promise<RunnableConfig> {
    const r = getRedisClient();
    if (!r) throw new Error('Redis not available');

    const threadId = getThreadId(config);
    const cpId = checkpoint.id || `${Date.now().toString(36)}${Math.random().toString(36).substr(2, 8)}`;

    const pipeline = r.pipeline();
    pipeline.set(cpKey(threadId, cpId), JSON.stringify(checkpoint));
    pipeline.set(cpMeta(threadId, cpId), JSON.stringify(metadata));
    pipeline.set(cpLatest(threadId), cpId);

    // Update list (keep last 10)
    const idsData = await r.get(cpList(threadId));
    const list: string[] = idsData ? JSON.parse(idsData) : [];
    list.unshift(cpId);
    if (list.length > 10) list.length = 10;
    pipeline.set(cpList(threadId), JSON.stringify(list));

    await pipeline.exec();
    return { ...config, configurable: { ...config.configurable, checkpoint_id: cpId } };
  }

  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string,
  ): Promise<void> {
    const r = getRedisClient();
    if (!r) return;

    const threadId = getThreadId(config);
    const cpId = (config.configurable?.checkpoint_id as string) || 'unknown';
    await r.set(writesKey(threadId, cpId, taskId), JSON.stringify(writes));
  }

  async deleteThread(threadId: string): Promise<void> {
    const r = getRedisClient();
    if (!r) return;

    const idsData = await r.get(cpList(threadId));
    if (!idsData) return;
    const ids = JSON.parse(idsData) as string[];

    const pipeline = r.pipeline();
    for (const cpId of ids) {
      pipeline.del(cpKey(threadId, cpId));
      pipeline.del(cpMeta(threadId, cpId));
    }
    pipeline.del(cpLatest(threadId));
    pipeline.del(cpList(threadId));
    await pipeline.exec();
  }
}

let _checkpointer: KVCheckpointer | null = null;

export function createKVCheckpointer(): KVCheckpointer {
  if (!_checkpointer) {
    _checkpointer = new KVCheckpointer();
  }
  return _checkpointer;
}
