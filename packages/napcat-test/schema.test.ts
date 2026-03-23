import { describe, expect, test } from 'vitest';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { Value } from '@sinclair/typebox/value';
import { Type } from '@sinclair/typebox';

import { OB11MessageDataSchema, OB11MessageSchema, OB11PostSendMsgSchema } from '../napcat-onebot/types/message';
import { OB11MessageSchema as OB11ActionMessageSchema } from '../napcat-onebot/action/schemas';
import { OneBotConfigSchema, loadConfig as loadOneBotConfig, OneBotConfig } from '../napcat-onebot/config';
import { NapcatConfigSchema } from '../napcat-core/helper/config';
import { shouldForwardEvent } from '../napcat-onebot/network/websocket-client';

describe('NapCat Schemas Compilation', () => {
  test('should compile OB11MessageDataSchema without duplicate id error', () => {
    expect(() => TypeCompiler.Compile(OB11MessageDataSchema)).not.toThrow();
  });

  test('should compile OB11MessageSchema without duplicate id error', () => {
    expect(() => TypeCompiler.Compile(OB11MessageSchema)).not.toThrow();
  });

  test('should compile OB11ActionMessageSchema without duplicate id error', () => {
    expect(() => TypeCompiler.Compile(OB11ActionMessageSchema)).not.toThrow();
  });

  test('should compile OB11PostSendMsgSchema without error', () => {
    expect(() => TypeCompiler.Compile(OB11PostSendMsgSchema)).not.toThrow();
  });

  test('should compile QuickAction hybrid schema without error', () => {
    const QASchema = Type.Object({
      message: OB11PostSendMsgSchema,
      quick_action: OB11ActionMessageSchema,
    });
    expect(() => TypeCompiler.Compile(QASchema)).not.toThrow();
  });
});

describe('NapCat Schemas Validation & Coercion', () => {
  test('should coerce numeric user_id to string in OB11PostSendMsgSchema', () => {
    const payload = {
      message_type: 'private',
      user_id: 123456,
      message: [{ type: 'text', data: { text: 'hello' } }],
    };

    let data: unknown = structuredClone(payload);
    data = Value.Parse(OB11PostSendMsgSchema, data);

    const compiler = TypeCompiler.Compile(OB11PostSendMsgSchema);
    expect(compiler.Check(data)).toBe(true);
    expect((data as Record<string, unknown>)['user_id']).toBe('123456');
  });

  test('should validate complex mixed messages correctly', () => {
    const payload = {
      message_type: 'group',
      group_id: '654321',
      message: 'this is a string message',
    };

    let data: unknown = structuredClone(payload);
    data = Value.Parse(OB11PostSendMsgSchema, data);

    const compiler = TypeCompiler.Compile(OB11PostSendMsgSchema);
    expect(compiler.Check(data)).toBe(true);
  });
});

describe('NapCat Configuration Loaders', () => {
  test('OneBotConfig schemas should compile', () => {
    expect(() => TypeCompiler.Compile(OneBotConfigSchema)).not.toThrow();
  });

  test('OneBotConfig should load and apply defaults correctly', () => {
    const partialConfig: Partial<OneBotConfig> = {
      network: {
        httpServers: [{
          port: 3000,
          enable: true,
          name: 'test',
          host: '127.0.0.1',
          enableCors: true,
          enableWebsocket: false,
          messagePostFormat: 'array',
          token: '',
          debug: false,
        }],
        httpSseServers: [],
        httpClients: [],
        websocketServers: [],
        websocketClients: [],
        plugins: [],
      },
    };
    const loaded = loadOneBotConfig(partialConfig);
    expect(loaded.network.httpServers[0]?.host).toBe('127.0.0.1');
    expect(loaded.network.httpServers[0]?.enableCors).toBe(true);
    expect(loaded.musicSignUrl).toBe('');
  });

  test('WebSocket client eventFilter should load and apply defaults correctly', () => {
    const partialConfig: Partial<OneBotConfig> = {
      network: {
        httpServers: [],
        httpSseServers: [],
        httpClients: [],
        websocketServers: [],
        websocketClients: [{
          enable: true,
          name: 'remote',
          url: 'ws://localhost:8082',
          messagePostFormat: 'array',
          reportSelfMessage: false,
          reconnectInterval: 5000,
          token: '',
          debug: false,
          heartInterval: 30000,
          eventFilter: {
            groupWhitelist: ['10001'],
          } as any,
        }],
        plugins: [],
      },
    };

    const loaded = loadOneBotConfig(partialConfig);
    expect(loaded.network.websocketClients[0]?.eventFilter.groupWhitelist).toEqual(['10001']);
    expect(loaded.network.websocketClients[0]?.eventFilter.groupBlacklist).toEqual([]);
  });

  test('NapcatConfig should compile and apply defaults', () => {
    let compiled: ReturnType<typeof TypeCompiler.Compile> | undefined;
    expect(() => {
      compiled = TypeCompiler.Compile(NapcatConfigSchema);
    }).not.toThrow();

    let data: unknown = {};
    data = Value.Parse(NapcatConfigSchema, data);

    expect(compiled?.Check(data)).toBe(true);
    const resolved = data as Record<string, unknown>;
    expect(resolved['consoleLog']).toBe(true);
    expect(resolved['consoleLogLevel']).toBe('info');
  });
});

describe('WebSocket client group filter', () => {
  const config = {
    eventFilter: {
      groupWhitelist: ['10001', '10002'],
      groupBlacklist: ['10002', '10003'],
    },
  };

  test('should allow non-group events', () => {
    expect(shouldForwardEvent(config as any, { post_type: 'meta_event' } as any)).toBe(true);
  });

  test('should allow whitelisted group messages', () => {
    expect(shouldForwardEvent(config as any, {
      post_type: 'message',
      message_type: 'group',
      group_id: 10001,
    } as any)).toBe(true);
  });

  test('should block blacklisted group messages even if they are also whitelisted', () => {
    expect(shouldForwardEvent(config as any, {
      post_type: 'message',
      message_type: 'group',
      group_id: 10002,
    } as any)).toBe(false);
  });

  test('should block group messages outside the whitelist when the whitelist is not empty', () => {
    expect(shouldForwardEvent(config as any, {
      post_type: 'message',
      message_type: 'group',
      group_id: 99999,
    } as any)).toBe(false);
  });
});
