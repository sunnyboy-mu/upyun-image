# 读取键值对 · Cloudflare Workers KV 文档

要获取指定键的值，请调用绑定到 Worker 代码的任意 [KV 命名空间](https://developers.cloudflare.com/kv/concepts/kv-namespaces/)上的 [KV 绑定](https://developers.cloudflare.com/kv/concepts/kv-bindings/)的 `get()` 方法：

```js
// 读取单个键
env.NAMESPACE.get(key);
// 读取多个键
env.NAMESPACE.get(keys);
```

`get()` 方法返回一个 Promise，您可以通过 `await` 来获取值。

如果以字符串形式请求单个键，Promise 将返回单个响应。如果找不到该键，Promise 将以字面值 `null` 解析。

您也可以请求键的数组。返回值将是一个包含找到的键值对的 `Map`，未找到的键对应的值为 `null`。

```js
export default {
  async fetch(request, env, ctx) {
    try {
      // 读取单个键，返回值或 null
      const value = await env.NAMESPACE.get("first-key");
      // 读取多个键，返回值的 Map
      const values = await env.NAMESPACE.get(["first-key", "second-key"]);
      // 读取带元数据的单个键，返回值或 null
      const valueWithMetadata = await env.NAMESPACE.getWithMetadata(
        "first-key"
      );
      // 读取带元数据的多个键，返回值的 Map
      const valuesWithMetadata = await env.NAMESPACE.getWithMetadata([
        "first-key",
        "second-key",
      ]);
      return new Response({
        value: value,
        values: Object.fromEntries(values),
        valueWithMetadata: valueWithMetadata,
        valuesWithMetadata: Object.fromEntries(valuesWithMetadata),
      });
    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  },
};
```

注意
`get()` 和 `getWithMetadata()` 方法可能返回过时的值。如果某个键最近在某个位置被读取过，其他位置对该键的写入或更新可能需要最多 60 秒（或 `cacheTtl` 设置的持续时间）才能显示。

## 参考

以下方法用于从 KV 读取数据：

- [get()](#通过-getkey-string-请求单个键)
- [getWithMetadata()](#通过-getkeys-string-请求多个键)

### `get()` 方法

使用 `get()` 方法获取单个值，或在提供多个键时获取多个值：

- 通过 [get(key: string)](#通过-getkey-string-请求单个键) 读取单个键
- 通过 [get(keys: string\[\])](#通过-getkeys-string-请求多个键) 读取多个键

#### 通过 `get(key: string)` 请求单个键

要获取单个键的值，调用绑定到 Worker 代码的任意 KV 命名空间上的 `get()` 方法：

```js
env.NAMESPACE.get(key, type?);
// 或
env.NAMESPACE.get(key, options?);
```

##### 参数

- `key`: `string`
  - KV 对的键。
- `type`: `"text" | "json" | "arrayBuffer" | "stream"`
  - 可选。返回值的类型。默认为 `text`。
- `options`: `{ cacheTtl?: number, type?: "text" | "json" | "arrayBuffer" | "stream" }`
  - 可选。包含可选 `cacheTtl` 和 `type` 属性的对象。`cacheTtl` 属性定义 KV 结果在访问它的全局网络位置中缓存的时长（单位：秒，最小值：60）。`type` 属性定义返回值的类型。

##### 响应

- `response`: `Promise<string | Object | ArrayBuffer | ReadableStream | null>`
  - 请求的 KV 对的值。响应类型取决于为 `get()` 命令提供的 `type` 参数：
    - `text`：字符串（默认）。
    - `json`：从 JSON 字符串解码的对象。
    - `arrayBuffer`：[`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) 实例。
    - `stream`：[`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)。

#### 通过 `get(keys: string[])` 请求多个键

要获取多个键的值，调用绑定到 Worker 代码的任意 KV 命名空间上的 `get()` 方法：

```js
env.NAMESPACE.get(keys, type?);
// 或
env.NAMESPACE.get(keys, options?);
```

##### 参数

- `keys`: `string[]`
  - KV 对的键。最多：100 个键。
- `type`: `"text" | "json"`
  - 可选。返回值的类型。默认为 `text`。
- `options`: `{ cacheTtl?: number, type?: "text" | "json" }`
  - 可选。包含可选 `cacheTtl` 和 `type` 属性的对象。`cacheTtl` 属性定义 KV 结果在访问它的全局网络位置中缓存的时长（单位：秒，最小值：60）。`type` 属性定义返回值的类型。

注意
用于读取多个键的 `.get()` 函数不支持 `arrayBuffer` 或 `stream` 返回类型。如果需要读取 `arrayBuffer` 或 `stream` 类型的多个键，可以考虑使用 `.get()` 函数结合 `Promise.all()` 并行读取单个键。

##### 响应

- `response`: `Promise<Map<string, string | Object | null>>`
  - 请求的 KV 对的值。如果未找到键，该键对应的值为 `null`。响应类型取决于为 `get()` 命令提供的 `type` 参数：
    _ `text`：字符串（默认）。
    _ `json`：从 JSON 字符串解码的对象。
    响应大小限制为 25 MB。超过此大小的响应将失败并返回 `413 Error` 错误消息。

### `getWithMetadata()` 方法

使用 `getWithMetadata()` 方法获取单个值及其元数据，或多个值及其元数据：

- 通过 [getWithMetadata(key: string)](#通过-getwithmetadatakey-string-请求单个键) 读取单个键
- 通过 [getWithMetadata(keys: string\[\])](#通过-getwithmetadatakeys-string-请求多个键) 读取多个键

#### 通过 `getWithMetadata(key: string)` 请求单个键

要获取指定键的值及其元数据，调用绑定到 Worker 代码的任意 KV 命名空间上的 `getWithMetadata()` 方法：

```js
env.NAMESPACE.getWithMetadata(key, type?);
// 或
env.NAMESPACE.getWithMetadata(key, options?);
```

元数据是您附加到每个 KV 条目的可序列化值。

##### 参数

- `key`: `string`
  - KV 对的键。
- `type`: `"text" | "json" | "arrayBuffer" | "stream"`
  - 可选。返回值的类型。默认为 `text`。
- `options`: `{ cacheTtl?: number, type?: "text" | "json" | "arrayBuffer" | "stream" }`
  - 可选。包含可选 `cacheTtl` 和 `type` 属性的对象。`cacheTtl` 属性定义 KV 结果在访问它的全局网络位置中缓存的时长（单位：秒，最小值：60）。`type` 属性定义返回值的类型。

##### 响应

- `response`: `Promise<{ value: string | Object | ArrayBuffer | ReadableStream | null, metadata: string | null }>`
  - 包含请求的 KV 对的值和元数据的对象。`value` 属性的类型取决于为 `getWithMetadata()` 命令提供的 `type` 参数：
    _ `text`：字符串（默认）。
    _ `json`：从 JSON 字符串解码的对象。
    _ `arrayBuffer`：[`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) 实例。
    _ `stream`：[`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)。
    如果请求的键值对没有元数据关联，`metadata` 将返回 `null`。

#### 通过 `getWithMetadata(keys: string[])` 请求多个键

要获取一组指定键的值及其元数据，调用绑定到 Worker 代码的任意 KV 命名空间上的 `getWithMetadata()` 方法：

```js
env.NAMESPACE.getWithMetadata(keys, type?);
// 或
env.NAMESPACE.getWithMetadata(keys, options?);
```

##### 参数

- `keys`: `string[]`
  - KV 对的键。最多：100 个键。
- `type`: `"text" | "json"`
  - 可选。返回值的类型。默认为 `text`。
- `options`: `{ cacheTtl?: number, type?: "text" | "json" }`
  - 可选。包含可选 `cacheTtl` 和 `type` 属性的对象。`cacheTtl` 属性定义 KV 结果在访问它的全局网络位置中缓存的时长（单位：秒，最小值：60）。`type` 属性定义返回值的类型。

注意
用于读取多个键的 `.get()` 函数不支持 `arrayBuffer` 或 `stream` 返回类型。如果需要读取 `arrayBuffer` 或 `stream` 类型的多个键，可以考虑使用 `.get()` 函数结合 `Promise.all()` 并行读取单个键。

##### 响应

- `response`: `Promise<Map<string, { value: string | Object | null, metadata: string | Object | null }>`
  - 包含请求的 KV 对的值和元数据的对象。`value` 属性的类型取决于为 `getWithMetadata()` 命令提供的 `type` 参数：
    - `text`：字符串（默认）。
    - `json`：从 JSON 字符串解码的对象。
  - `metadata` 的类型取决于存储的内容，可以是字符串或对象。
    如果请求的键值对没有元数据关联，`metadata` 将返回 `null`。
    响应大小限制为 25 MB。超过此大小的响应将失败并返回 `413 Error` 错误消息。

## 指导

### type 参数

对于简单值，使用默认的 `text` 类型，它将值作为字符串返回。为了方便，`json` 类型也可以指定，它会将 JSON 值转换为对象后返回。对于大值，使用 `stream` 来请求 `ReadableStream`。对于二进制值，使用 `arrayBuffer` 来请求 `ArrayBuffer`。

对于大值，`type` 的选择会对延迟和 CPU 使用率产生显著影响。按速度从快到慢排序，`type` 的顺序为 `stream`、`arrayBuffer`、`text` 和 `json`。

### cacheTtl 参数

`cacheTtl` 是一个参数，定义 KV 结果在访问它的全局网络位置中缓存的时长（单位：秒）。

定义缓存时间（秒）有助于减少读取频率较低的键的冷读取延迟。如果数据是一次写入或很少写入，`cacheTtl` 非常有用。

热读取与冷读取
热读取意味着数据使用 [CDN](https://developers.cloudflare.com/cache/) 缓存在 Cloudflare 的边缘网络中，无论是本地缓存还是区域缓存。冷读取意味着数据未被缓存，因此必须从中央存储中获取。现有的键值对和不存在的键值对（也称为负查找）都会在边缘缓存。

如果数据经常更新且您需要在写入后不久看到更新，则不推荐使用 `cacheTtl`，因为来自其他全局网络位置的写入在缓存值过期前不可见。

`cacheTtl` 参数必须为大于等于 `60` 的整数，这是默认值。

已缓存项的有效 `cacheTtl` 可以通过使用更低的 `cacheTtl` 重新获取来减少。例如，如果您之前使用 `NAMESPACE.get(key, {cacheTtl: 86400})`，但后来发现 24 小时的缓存时间过长，可以改用 `NAMESPACE.get(key, {cacheTtl: 300})` 或甚至 `NAMESPACE.get(key)`，这将检查新数据以符合提供的 `cacheTtl`（默认为 60 秒）。

### 通过批量请求在单次 Worker 调用中请求更多键

每个 Worker 调用对外部服务的操作限制为 1,000 次。如 [Workers KV 限制](https://developers.cloudflare.com/kv/platform/limits/)所述，这适用于 Workers KV。

要在单次操作中读取超过 1,000 个键，可以使用批量读取操作一次性读取多个键。这将计为 1,000 次操作限制中的单一操作。

### 通过合并键减少基数

如果有一组相关的键值对具有混合使用模式（部分热键和部分冷键），可以考虑合并它们。通过将冷键与热键合并，冷键将与热键一起缓存，这比它们作为独立未缓存键读取更快。

#### 合并为 "超级" KV 条目

一种合并技术是将所有键和值合并为一个超级键值对象。示例如下：

```plaintext
key1: value1
key2: value2
key3: value3
```

变为

```plaintext
coalesced: {
  key1: value1,
  key2: value2,
  key3: value3,
}
```

通过合并值，冷键因热键的访问模式而保持在缓存中预热。

这种方法最适合不需要独立更新值的情况，否则可能导致竞态条件。

- **优点**：不常访问的键保持在缓存中。
- **缺点**：结果值的大小可能使 Worker 超出内存限制。安全更新值需要某种[锁定机制](https://developers.cloudflare.com/kv/api/write-key-value-pairs/#concurrent-writes-to-the-same-key)。

## 其他访问 KV 的方法

您可以通过 [Wrangler 命令行读取键值对](https://developers.cloudflare.com/kv/reference/kv-commands/#kv-key-get) 和通过 [REST API](https://developers.cloudflare.com/api/resources/kv/subresources/namespaces/subresources/values/methods/get/) 访问。
