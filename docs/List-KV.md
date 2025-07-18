# 列出键 · Cloudflare Workers KV 文档

要列出 KV 命名空间中的所有键，请在绑定到 Worker 代码的任何 [KV 命名空间](https://developers.cloudflare.com/kv/concepts/kv-namespaces/) 上调用 [KV 绑定](https://developers.cloudflare.com/kv/concepts/kv-bindings/) 的 `list()` 方法：

```js
env.NAMESPACE.list();
```

`list()` 方法返回一个 Promise，你可以使用 `await` 来获取结果。

#### 示例

在 Worker 中列出键的示例：

```js
export default {
  async fetch(request, env, ctx) {
    try {
      const value = await env.NAMESPACE.list();

      return new Response(JSON.stringify(value.keys), {
        status: 200,
      });
    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  },
};
```

## 参考

以下方法用于列出 KV 中的键：

- [list()](#list-method)

### `list()` 方法

要列出 KV 命名空间中的所有键，请在绑定到 Worker 代码的任何 KV 命名空间上调用 `list()` 方法：

```ts
env.NAMESPACE.list(options?)
```

#### 参数

- `options`: `{ prefix?: string, limit?: string, cursor?: string }`

  - 一个包含 `prefix`（可选）、`limit`（可选）或 `cursor`（可选）属性的对象。
    - `prefix` 是一个字符串，用于过滤所有键的前缀。
    - `limit` 是返回的最大键数。默认值为 1000，这也是最大值。你可能不需要更改此默认值，但为了完整性而包含它。
    - `cursor` 是一个字符串，用于分页响应。

#### 响应

- `response`: `Promise<{ keys: { name: string, expiration?: number, metadata?: object }[], list_complete: boolean, cursor: string }>`

  - 一个 Promise，解析为一个包含 `keys`、`list_complete` 和 `cursor` 属性的对象。
    - `keys` 是一个数组，包含列出的每个键的对象。每个对象有 `name`、`expiration`（可选）和 `metadata`（可选）属性。如果键值对设置了过期时间，过期时间将以绝对值形式显示（即使是以 TTL 形式设置的）。如果键值对设置了非空元数据，元数据将显示。
    - `list_complete` 是一个布尔值，如果还有更多键需要获取，即使 `keys` 数组为空，它也将为 `false`。
    - `cursor` 是一个字符串，用于分页响应。

`list()` 方法返回一个 Promise，解析后的对象如下所示：

```json
{
  "keys": [
    {
      "name": "foo",
      "expiration": 1234,
      "metadata": { "someMetadataKey": "someMetadataValue" }
    }
  ],
  "list_complete": false,
  "cursor": "6Ck1la0VxJ0djhidm1MdX2FyD"
}
```

`keys` 属性将包含一个描述每个键的对象数组。该对象将有一到三个键：键的 `name`，以及可选的键的 `expiration` 和 `metadata` 值。

`name` 是一个字符串，`expiration` 值是一个数字，`metadata` 是最初设置的任何类型。只有当键有过期时间时，才会返回 `expiration` 值，并且将以绝对值形式显示，即使它是以 TTL 形式设置的。只有当给定的键有非空关联元数据时，才会返回任何 `metadata`。

如果 `list_complete` 为 `false`，则还有更多键需要获取，即使 `keys` 数组为空。你将使用 `cursor` 属性来获取更多键。有关更多详细信息，请参阅 [分页](#pagination)。

如果你的值符合 [元数据大小限制](https://developers.cloudflare.com/kv/platform/limits/)，可以考虑将值存储在元数据中。将值存储在元数据中比先调用 `list()` 再对每个键调用 `get()` 更高效。使用 `put()` 时，将 `value` 参数留空，而是在元数据对象中包含一个属性：

```js
await NAMESPACE.put(key, "", {
  metadata: { value: value },
});
```

更改可能需要长达 60 秒（或 `get()` 或 `getWithMetadata()` 方法的 `cacheTtl` 设置的值）才能在调用 KV 命名空间上的方法的应用程序中反映出来。

## 指南

### 按前缀列出

列出以特定前缀开头的所有键。

例如，你可能已经使用用户、用户 ID 和键名（用冒号分隔，如 `user:1:<key>`）来组织你的键。你可以使用以下代码获取用户一号的键：

```js
export default {
  async fetch(request, env, ctx) {
    const value = await env.NAMESPACE.list({ prefix: "user:1:" });
    return new Response(value.keys);
  },
};
```

这将返回以 `"user:1:"` 前缀开头的所有键。

### 排序

键始终根据其 UTF - 8 字节按字典序排序返回。

### 分页

如果还有更多键需要获取，`list_complete` 键将设置为 `false`，并且还将返回一个 `cursor`。在这种情况下，你可以再次调用 `list()` 并传入 `cursor` 值以获取下一批键：

```js
const value = await NAMESPACE.list();

const cursor = value.cursor;

const next_value = await NAMESPACE.list({ cursor: cursor });
```

仅检查 `keys` 数组是否为空不足以确定是否还有更多键需要获取。相反，使用 `list_complete`。

`keys` 数组可能为空，但仍有更多键需要获取，因为 [最近过期或删除的键](https://en.wikipedia.org/wiki/Tombstone_%28data_store%29) 必须遍历，但不会包含在返回的 `keys` 中。

在对大型结果集进行分页时，如果同时提供了 `prefix` 参数，则在所有后续调用中必须连同初始参数一起提供 `prefix` 参数。

### 使用元数据优化 `list()` 操作的存储

如果你的值符合 [元数据大小限制](https://developers.cloudflare.com/kv/platform/limits/)，可以考虑将值存储在元数据中。将值存储在元数据中比先调用 `list()` 再对每个键调用 `get()` 更高效。使用 `put()` 时，将 `value` 参数留空，而是在元数据对象中包含一个属性：

```js
await NAMESPACE.put(key, "", {
  metadata: { value: value },
});
```
