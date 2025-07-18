# 删除键值对 · Cloudflare Workers KV 文档

要删除一个键值对，请在绑定到你的 Worker 代码的任何 [KV 命名空间](https://developers.cloudflare.com/kv/concepts/kv-namespaces/) 上调用 [KV 绑定](https://developers.cloudflare.com/kv/concepts/kv-bindings/) 的 `delete()` 方法：

```js
env.NAMESPACE.delete(key);
```

#### 示例

在 Worker 中删除一个键值对的示例：

```js
export default {
  async fetch(request, env, ctx) {
    try {
      await env.NAMESPACE.delete("first-key");

      return new Response("删除成功", {
        status: 200,
      });
    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  },
};
```

## 参考

以下方法用于从 KV 中删除数据：

- [delete()](#delete-method)

### `delete()` 方法

要删除一个键值对，请在绑定到你的 Worker 代码的任何 KV 命名空间上调用 [KV 绑定](https://developers.cloudflare.com/kv/concepts/kv-bindings/) 的 `delete()` 方法：

```js
env.NAMESPACE.delete(key);
```

#### 参数

- `key`：`string`
  - 要删除的键值对的键。

#### 响应

- `response`：`Promise<void>`
  - 一个 Promise，如果删除成功则会 resolve。

此方法返回一个 Promise，你应该使用 `await` 来验证删除是否成功。对不存在的键调用 `delete()` 会被视为删除成功。

调用 `delete()` 方法将从你的 KV 命名空间中移除该键和对应的值。与任何操作一样，该键可能需要一些时间才能从 Cloudflare 全球网络的各个节点中被删除。

## 指南

### 批量删除数据

可以使用 Wrangler 或 [通过 REST API](https://developers.cloudflare.com/api/resources/kv/subresources/namespaces/subresources/keys/methods/bulk_delete/) 一次删除多个键值对。

批量 REST API 一次最多可接受 10,000 个键值对。不支持使用 [KV 绑定](https://developers.cloudflare.com/kv/concepts/kv-bindings/) 进行批量写入。

## 访问 KV 的其他方法

你还可以 [使用 Wrangler 从命令行删除键值对](https://developers.cloudflare.com/kv/reference/kv-commands/#kv-namespace-delete) 或 [使用 REST API](https://developers.cloudflare.com/api/resources/kv/subresources/namespaces/subresources/values/methods/delete/) 进行删除。
