# NapCatQQ WS Filter Fork

这是一个基于 `NapNeko/NapCatQQ` 的定制 fork。

这个 fork 的目标很单一：

> 为 **OneBot WebSocket Client** 增加按群过滤消息上报的能力。

适用场景：

- 你使用 NapCat 作为 **反向 WebSocket Client** 连接远程 OneBot Server
- 远端提供的是公共 bot 服务，多个用户各自接入自己的 bot 账号
- 当同一个群里有多个 bot 同时接入该公共服务时，容易出现重复响应
- 你希望在 **不本地部署完整 bot 框架** 的前提下，只把指定群的消息上报到远端

---

## Fork 增加了什么

这个 fork 为：

```text
network.websocketClients[*]
```

新增配置字段：

```json
{
  "eventFilter": {
    "groupWhitelist": ["123456789", "987654321"],
    "groupBlacklist": ["111111111"]
  }
}
```

### 过滤规则

当前行为如下：

1. 非群消息默认放行
2. `groupBlacklist` 优先级最高
3. 如果 `groupWhitelist` 非空，则只允许白名单群上报
4. 如果 `groupWhitelist` 为空，则除黑名单外全部放行

换句话说，这个 fork 影响的是：

> **NapCat 向远端 WebSocket Client 上报事件时的过滤行为**

它不会修改：

- HTTP Client / HTTP Server / WebSocket Server 行为
- Plugin 系统行为
- NapCat 本地消息产生逻辑

---

## WebUI 支持

这个 fork 同时修改了 WebUI 前后端。

在 WebUI 中可以直接编辑：

```text
Network -> Websocket Client -> Edit
```

你会看到两个新字段：

- `Group whitelist`
- `Group blacklist`

支持格式：

- 一行一个群号
- 逗号分隔也可

保存后会写入：

```text
onebot11_<uin>.json
```

---

## 配置示例

示例：

```json
{
  "network": {
    "websocketClients": [
      {
        "name": "remote-ob",
        "enable": true,
        "url": "wss://example.com/",
        "reportSelfMessage": false,
        "messagePostFormat": "array",
        "token": "your-token",
        "debug": false,
        "heartInterval": 30000,
        "reconnectInterval": 30000,
        "eventFilter": {
          "groupWhitelist": ["123456789", "987654321"],
          "groupBlacklist": ["111111111"]
        }
      }
    ]
  }
}
```

---

## Docker 镜像

当前已发布的架构专用镜像：

### amd64

```text
trytodupe/napcat-docker:v4.17.53-ws-filter-amd64
```

### arm64

```text
trytodupe/napcat-docker:v4.17.53-ws-filter-arm64
```

---

## Docker Compose 示例

### amd64

```yaml
services:
  napcat:
    image: trytodupe/napcat-docker:v4.17.53-ws-filter-amd64
    container_name: napcat
    restart: always
    network_mode: bridge
    ports:
      - 3000:3000
      - 3001:3001
      - 6099:6099
    volumes:
      - ./config:/app/napcat/config
      - ./QQ:/app/.config/QQ
```

### arm64

```yaml
services:
  napcat:
    image: trytodupe/napcat-docker:v4.17.53-ws-filter-arm64
    container_name: napcat
    restart: always
    network_mode: bridge
    ports:
      - 3000:3000
      - 3001:3001
      - 6099:6099
    volumes:
      - ./config:/app/napcat/config
      - ./QQ:/app/.config/QQ
```

---

## 这个 fork 适合谁

适合：

- 远端 OneBot Server 很重，不想本地部署
- 只想让某些群消息被远端 bot 收到
- 希望控制点放在 NapCat 侧，而不是上游 bot 框架里

不适合：

- 需要复杂路由、中间件编排、多下游分发
- 需要按用户 / notice / request / meta_event 做更细粒度策略
- 需要长期维护大量自定义协议改动

---

## 与上游的关系

这个仓库不是官方发行版，而是基于上游做的定制补丁。

上游项目：

```text
NapNeko/NapCatQQ
```

Docker 侧相关工作基于：

```text
mlikiowa/NapCat-Docker
```

如果你需要官方完整文档、社区支持、标准能力，请优先参考上游仓库。

---

## 当前定制范围

目前这个 fork 只额外包含：

- WebSocket Client group whitelist / blacklist
- WebUI 对应配置入口
- WebUI backend 对应配置持久化

没有主动引入其他行为变化。

---

## License

本 fork 继续遵循上游仓库的许可证与相关约束。

使用前请自行确认：

- 上游许可证要求
- Docker 镜像分发方式
- 你所在地区与实际用途的合规性
