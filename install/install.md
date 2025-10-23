# NooBox 插件原生消息功能安装指南

## 原生消息功能概述

NooBox 插件的原生消息功能用于实现浏览器扩展与本地应用程序之间的通信，主要用于文件下载和保存功能。具体来说，当用户在扩展中需要保存截图或其他文件时，扩展会通过原生消息机制将下载请求发送给本地应用程序，由本地应用程序来处理实际的文件保存操作。

## 所需文件

在安装目录中包含以下关键文件：

1. **com.yisa.nativeapp.json** - 原生消息主机配置文件
2. **create_native_messaging_host.ps1** - PowerShell安装脚本
3. **一键联查.exe** - 本地应用程序可执行文件
4. **一键联查.go** - 本地应用程序源代码（可选，用于参考）

## 安装步骤

### 方法一：使用PowerShell脚本自动安装

1. **以管理员身份运行PowerShell**：
   - 在开始菜单中找到PowerShell
   - 右键点击并选择「以管理员身份运行」

2. **修改安装脚本路径**：
   - 编辑`create_native_messaging_host.ps1`文件，将第8行的应用路径修改为实际的应用程序路径：
     ```powershell
     $nativeAppPath = "C:\path\to\your\一键联查.exe"
     ```
   - 修改为实际路径，例如：
     ```powershell
     $nativeAppPath = "E:\Study\Chrome Extens\NooBox-master\install\一键联查.exe"
     ```

3. **执行安装脚本**：
   - 在PowerShell中导航到脚本所在目录
   - 运行命令：
     ```powershell
     .\create_native_messaging_host.ps1
     ```
   - 如果遇到执行策略限制，可先运行：
     ```powershell
     Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
     ```

### 方法二：手动配置

1. **创建JSON配置文件**：
   - 打开文本编辑器，创建`com.yisa.nativeapp.json`文件
   - 内容如下：
     ```json
     {
       "name": "com.yisa.nativeapp",
       "description": "Yisa Native App",
       "path": "[应用程序完整路径]",
       "type": "stdio",
       "allowed_origins": [
         "chrome-extension://oacmjpblobgdfpcndnlembgkbhpahffa/"
       ]
     }
     ```
   - 注意：将`[应用程序完整路径]`替换为`一键联查.exe`的实际完整路径

2. **保存JSON文件到指定位置**：
   - Windows系统：`%LOCALAPPDATA%\Google\Chrome\User Data\Default\NativeMessagingHosts\com.yisa.nativeapp.json`
   - 如果`NativeMessagingHosts`文件夹不存在，请创建它

3. **创建注册表项**：
   - 按下`Win + R`，输入`regedit`打开注册表编辑器
   - 导航到：`HKEY_LOCAL_MACHINE\Software\Google\Chrome\NativeMessagingHosts\com.yisa.nativeapp`
   - 如果路径不存在，请创建相应的键
   - 创建一个名为`Path`的字符串值，数据为JSON配置文件的完整路径

## 功能说明

原生应用程序（一键联查.exe）主要提供以下功能：

1. **文件下载和保存**：
   - 接收来自扩展的下载请求
   - 支持从URL或Data URL下载文件
   - 将文件保存到指定路径
   - 保存完成后发送Windows通知

2. **路径处理**：
   - 自动创建不存在的目标目录
   - 支持中文路径

## 验证安装

安装完成后，可以通过以下方式验证原生消息功能是否正常工作：

1. 重新启动Chrome浏览器
2. 使用NooBox插件的截图或保存功能
3. 如果成功保存文件并收到Windows通知，则表示安装成功

## 故障排除

如果原生消息功能不工作，请检查以下几点：

1. **路径是否正确**：
   - 确保JSON配置文件中的`path`值指向正确的应用程序位置
   - 确保注册表中的`Path`值指向正确的JSON配置文件位置

2. **权限问题**：
   - 确保应用程序具有写入目标目录的权限
   - 确保以管理员身份运行安装脚本

3. **扩展ID是否匹配**：
   - 确保JSON配置文件中的`allowed_origins`值与扩展的ID匹配
   - NooBox的扩展ID为：`oacmjpblobgdfpcndnlembgkbhpahffa`（浏览器拓展程序中对应的id）

4. **检查日志**：
   - 如果应用程序生成日志文件，请查看是否有错误信息

## 注意事项

1. 此原生应用仅支持Windows操作系统
2. 确保下载的应用程序来自可信来源，避免安全风险
3. 升级Chrome扩展后，可能需要重新配置原生消息功能
4. 如果修改了扩展ID，需要相应更新JSON配置文件中的`allowed_origins`值
