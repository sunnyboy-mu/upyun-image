# 写入键值对 · Cloudflare Workers KV 文档

要创建新的键值对，或更新特定键的值，请在绑定到 Worker 代码的任何 [KV 命名空间](https://developers.cloudflare.com/kv/concepts/kv-namespaces/) 上调用 [KV 绑定](https://developers.cloudflare.com/kv/concepts/kv-bindings/) 的 `put()` 方法：

```js
env.NAMESPACE.put(key, value);
```

#### 示例

在 Worker 中写入键值对的示例：

```js
export default {
  async fetch(request, env, ctx) {
    try {
      await env.NAMESPACE.put("first-key", "这是该键的值");

      return new Response("写入成功", {
        status: 201,
      });
    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  },
};
```

## 参考

以下方法用于写入 KV：

- [put()](#put-method)

### `put()` 方法

要创建新的键值对，或更新特定键的值，请在绑定到 Worker 代码的任何 KV 命名空间上调用 `put()` 方法：

```js
env.NAMESPACE.put(key, value, options?);
```

#### 参数

- `key`：`string`
  - 与值关联的键。键不能为空，也不能完全等于 `.` 或 `..`。其他所有键均有效。键的最大长度为 512 字节。
- `value`：`string` | `ReadableStream` | `ArrayBuffer`
  - 要存储的值。类型会自动推断。值的最大大小为 25 MiB。
- `options`：`{ expiration?: number, expirationTtl?: number, metadata?: object }`
  - 可选。一个包含 `expiration`（可选）、`expirationTtl`（可选）和 `metadata`（可选）属性的对象。
    - `expiration` 是一个数字，表示键值对自纪元以来的过期时间（以秒为单位）。
    - `expirationTtl` 是一个数字，表示键值对从现在起的过期时间（以秒为单位）。最小值为 60。
    - `metadata` 是一个必须可序列化为 JSON 的对象。元数据对象的序列化 JSON 表示的最大大小为 1024 字节。

#### 响应

- `response`：`Promise<void>`
  - 一个 Promise，如果更新成功则会 resolve。

`put()` 方法返回一个 Promise，你应该使用 `await` 来验证更新是否成功。

## 指南

### 对同一键的并发写入

由于 KV 具有最终一致性的特性，对同一键的并发写入可能会相互覆盖。常见的做法是通过 Wrangler、Durable Objects 或 API 从单个进程写入数据。这样可以避免因并发写入而产生竞争，因为数据是按顺序写入的。所有数据在绑定到该命名空间的所有 Worker 中仍然可以随时访问。

如果对同一键进行并发写入，最后一次写入将优先。

写入操作在同一全球网络位置的其他请求中会立即可见，但在世界其他地区可能需要长达 60 秒（或 `get()` 或 `getWithMetadata()` 方法的 `cacheTtl` 参数的值）才能可见。

有关此主题的更多信息，请参阅 [KV 工作原理](https://developers.cloudflare.com/kv/concepts/how-kv-works/)。

### 批量写入数据

可以使用 Wrangler 或 [通过 REST API](https://developers.cloudflare.com/api/resources/kv/subresources/namespaces/subresources/keys/methods/bulk_update/) 一次写入多个键值对。

批量 API 一次最多可接受 10,000 个键值对。

每个键值对都需要一个 `key` 和一个 `value`。整个请求的大小必须小于 100 兆字节。不支持使用 [KV 绑定](https://developers.cloudflare.com/kv/concepts/kv-bindings/) 进行批量写入。

### 过期键

KV 支持创建自动过期的键。你可以配置键在特定时间点过期（使用 `expiration` 选项），或在键最后修改后的一定时间后过期（使用 `expirationTtl` 选项）。

一旦过期键的过期时间到达，它将从系统中删除。删除后，尝试读取该键的操作将表现为该键不存在。已删除的键在计费时不计入 KV 命名空间的存储使用量。

#### 注意

键上的 `expiration` 设置将导致该键被删除，即使 `cacheTtl` 设置为更高（更长的持续时间）的值也是如此。过期设置始终优先。

有两种方法可以指定键的过期时间：

- 使用自 [UNIX 纪元](https://en.wikipedia.org/wiki/Unix_time) 以来的秒数指定的绝对时间设置键的过期时间。例如，如果你希望某个键在 2019 年 4 月 1 日凌晨 12:00 UTC 过期，你将该键的过期时间设置为 `1554076800`。
- 使用相对于当前时间的秒数设置键的生存时间（TTL）。例如，如果你希望某个键在创建后 10 分钟过期，你将其过期 TTL 设置为 `600`。

不支持设置未来不到 60 秒的过期目标。两种过期方法都是如此。

#### 创建过期键

要创建过期键，请在 `put()` 选项中将 `expiration` 设置为表示自纪元以来秒数的数字，或将 `expirationTtl` 设置为表示从现在起秒数的数字：

```js
await env.NAMESPACE.put(key, value, {
  expiration: secondsSinceEpoch,
});

await env.NAMESPACE.put(key, value, {
  expirationTtl: secondsFromNow,
});
```

这里假设 `secondsSinceEpoch` 和 `secondsFromNow` 是在 Worker 代码的其他地方定义的变量。

### 元数据

要将元数据与键值对关联，请在 `put()` 选项中将 `metadata` 设置为一个可序列化为 JSON 的对象：

```js
await env.NAMESPACE.put(key, value, {
  metadata: { someMetadataKey: "someMetadataValue" },
});
```

### 对同一键的 KV 写入限制

Workers KV 对同一键每秒最多进行 1 次写入。在 1 秒内对同一键进行的写入操作将导致速率限制（`429`）错误。

你不应每秒对同一键写入超过一次。考虑将 Worker 调用中对某个键的多次写入合并为一次写入，或者在两次写入之间至少等待 1 秒。

以下示例演示了在单个 Worker 调用中强制并发写入同一键时如何返回错误。这不是生产环境中应使用的模式。

```typescript
export default {
  async fetch(request, env, ctx): Promise<Response> {
    // 省略其余代码
    const key = "common-key";
    const parallelWritesCount = 20;

    // 辅助函数，用于尝试向 KV 写入数据并处理错误
    const attemptWrite = async (i: number) => {
      try {
        await env.YOUR_KV_NAMESPACE.put(key, `写入尝试 #${i}`);
        return { attempt: i, success: true };
      } catch (error) {
        // 如果在 1 秒内对同一键进行写入操作，可能会抛出错误，例如：
        // error: {
        //  "message": "KV PUT failed: 429 Too Many Requests"
        // }

        return {
          attempt: i,
          success: false,
          error: { message: (error as Error).message },
        };
      }
    };

    // 并行发送所有请求并收集结果
    const results = await Promise.all(
      Array.from({ length: parallelWritesCount }, (_, i) => attemptWrite(i + 1))
    );
    // 结果将如下所示：
    // [
    //     {
    //       "attempt": 1,
    //       "success": true
    //     },
    //    {
    //       "attempt": 2,
    //       "success": false,
    //       "error": {
    //         "message": "KV PUT failed: 429 Too Many Requests"
    //       }
    //     },
    //     ...
    // ]

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
```

为了处理这些错误，我们建议实现带有指数退避的重试逻辑。以下是一个简单的方法，用于在上述代码中添加重试功能。

```typescript
export default {
  async fetch(request, env, ctx): Promise<Response> {
    // 省略其余代码
    const key = "common-key";
    const parallelWritesCount = 20;

    // 辅助函数，用于尝试向 KV 写入数据并处理错误，带有重试功能
    const attemptWrite = async (i: number) => {
      return await retryWithBackoff(async () => {
        await env.YOUR_KV_NAMESPACE.put(key, `写入尝试 #${i}`);
        return { attempt: i, success: true };
      });
    };

    // 并行发送所有请求并收集结果
    const results = await Promise.all(
      Array.from({ length: parallelWritesCount }, (_, i) => attemptWrite(i + 1))
    );

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  },
};

async function retryWithBackoff(
  fn: Function,
  maxAttempts = 5,
  initialDelay = 1000
) {
  let attempts = 0;
  let delay = initialDelay;

  while (attempts < maxAttempts) {
    try {
      // 尝试执行函数
      return await fn();
    } catch (error) {
      // 检查是否为速率限制错误
      if (
        (error as Error).message.includes(
          "KV PUT failed: 429 Too Many Requests"
        )
      ) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error("达到最大重试次数");
        }

        // 等待退避时间
        console.warn(`尝试 ${attempts} 失败。将在 ${delay} 毫秒后重试...`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // 指数退避
        delay *= 2;
      } else {
        // 如果是其他错误，重新抛出
        throw error;
      }
    }
  }
}
```
