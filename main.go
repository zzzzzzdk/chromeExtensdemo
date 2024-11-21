package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"io"
	"syscall"
	"unsafe"
)

//GOOS=windows GOARCH=amd64 go build -o nativeapp.exe main.go
var (
	user32                   = syscall.NewLazyDLL("user32.dll")
	messageBox               = user32.NewProc("MessageBoxW")
)

func MessageBox(hWnd uintptr, text, caption string, typ uint) int {
	ret, _, err := messageBox.Call(
		hWnd,
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(text))),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(caption))),
		uintptr(typ),
	)
	if ret == 0 {
		log.Printf("MessageBox failed: %v", err)
	}
	return int(ret)
}

func main() {
	// 获取当前可执行文件的路径
	exePath, err := os.Executable()
	if err != nil {
		fmt.Println("Error getting executable path:", err)
		return
	}

	// 替换环境变量
    // 获取 %LOCALAPPDATA% 环境变量的值
	localAppData := os.Getenv("LOCALAPPDATA")
	// 检查是否获取到了环境变量的值
	if localAppData == "" {
		fmt.Println("无法获取 LOCALAPPDATA 环境变量")
		return
	}
	// 构造完整的路径
	targetPath := filepath.Join(localAppData, "Google", "Chrome", "User Data", "Default", "NativeMessagingHosts")

    // 检查目标目录是否存在，如果不存在则创建
	if _, err := os.Stat(targetPath); os.IsNotExist(err) {
		err = os.MkdirAll(targetPath, 0755)
		if err != nil {
			fmt.Println("Error creating target directory:", err)
			return
		}
	}

	// 构建完整的文件路径
	filePath := filepath.Join(targetPath, "com.yisa.nativeapp.json")

	// 创建或打开文件
	file, err := os.Create(filePath)
	if err != nil {
		fmt.Println("创建文件时出错: ", err)
	}
	defer file.Close()

	// 写入内容到文件
	content := `{
  "name": "com.yisa.nativeapp",
  "description": "Yisa Native App",
  "path": "%LOCALAPPDATA%/Google/Chrome/User Data/Default/NativeMessagingHosts/nativeapp.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://oacmjpblobgdfpcndnlembgkbhpahffa/"
  ]
}`
	_, err = file.WriteString(content)
	if err != nil {
		fmt.Println("写入文件时出错: ", err)
        return
	}

	// 或者使用 ioutil.WriteFile 一次性写入内容
	err = ioutil.WriteFile(filePath, []byte(content), 0644)
	if err != nil {
		fmt.Println("写入文件时出错: ", err)
        return
	}

    targetPath = targetPath + "\\nativeapp.exe"
	// 检查当前可执行文件是否在目标目录
	if exePath != targetPath {
		// 复制当前可执行文件到目标目录
		err := copyFile(exePath, targetPath)
		if err != nil {
			fmt.Println("Error copying file:", err)
			return
		}

		// 使目标文件可执行
		err = os.Chmod(targetPath, 0755)
		if err != nil {
			fmt.Println("Error setting file permissions:", err)
			return
		}
        MessageBox(0, "安装成功", "通知", 0x40) // 0x40 表示信息图标
		// 退出当前进程
		os.Exit(0)
	}

	for {
		message := readMessage()
		handleMessage(message)
	}
}


func copyFile(src, dst string) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	dstFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer dstFile.Close()

	_, err = io.Copy(dstFile, srcFile)
	if err != nil {
		return err
	}

	return nil
}

func readMessage() map[string]interface{} {
	var length [4]byte
	_, err := os.Stdin.Read(length[:])
	if err != nil {
		log.Fatalf("Failed to read message length: %v", err)
	}

	size := int(length[0]) | int(length[1])<<8 | int(length[2])<<16 | int(length[3])<<24
	data := make([]byte, size)
	_, err = os.Stdin.Read(data)
	if err != nil {
		log.Fatalf("Failed to read message data: %v", err)
	}

	var message map[string]interface{}
	err = json.Unmarshal(data, &message)
	if err != nil {
		log.Fatalf("Failed to unmarshal message: %v", err)
	}

	return message
}

func sendMessage(response map[string]interface{}) {
	data, err := json.Marshal(response)
	if err != nil {
		log.Fatalf("Failed to marshal response: %v", err)
	}

	length := len(data)
	os.Stdout.Write([]byte{byte(length), byte(length >> 8), byte(length >> 16), byte(length >> 24)})
	os.Stdout.Write(data)
	os.Stdout.Sync()
}

func handleMessage(message map[string]interface{}) {
	url, ok := message["url"].(string)
	if !ok {
		sendMessage(map[string]interface{}{"error": "Invalid URL"})
		return
	}

	filename, ok := message["filename"].(string)
	if !ok {
		sendMessage(map[string]interface{}{"error": "Invalid filename"})
		return
	}

	savePath, ok := message["save_path"].(string)
	if !ok {
		savePath = "/default/path"
	}

	// 通过网络下载文件
	resp, err := http.Get(url)
	if err != nil {
		sendMessage(map[string]interface{}{"error": fmt.Sprintf("Failed to download file: %v", err)})
		return
	}
	defer resp.Body.Close()

	// 读取响应体为字节切片
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		sendMessage(map[string]interface{}{"error": fmt.Sprintf("Failed to read response body: %v", err)})
		return
	}

	// 保存文件
	filePath := filepath.Join(savePath, filename)
	err = ioutil.WriteFile(filePath, body, 0644)
	if err != nil {
		sendMessage(map[string]interface{}{"error": fmt.Sprintf("Failed to save file: %v", err)})
		return
	}

	// 发送成功响应
	sendMessage(map[string]interface{}{"status": "success", "path": filePath})
}
