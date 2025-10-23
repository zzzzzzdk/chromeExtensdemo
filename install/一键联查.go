package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"

	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
	"gopkg.in/toast.v1"
)

// GOOS=windows GOARCH=amd64 go build -o nativeapp.exe main.go
var (
	user32     = syscall.NewLazyDLL("user32.dll")
	messageBox = user32.NewProc("MessageBoxW")
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

// func showNotification(title, message string) error {
// 	_ = toast.Push("test message",
// 		toast.WithTitle("app title"),
// 		toast.WithAppID("app id"),
// 		toast.WithAudio(toast.Default),
// 		toast.WithLongDuration(),
// 		toast.WithIcon("/path/icon.png"),
// 	)
// }

func toUTF8(input string) (string, error) {
	encoder := simplifiedchinese.GB18030.NewEncoder()
	result, _, err := transform.String(encoder, input)
	if err != nil {
		return "", err
	}
	return result, nil
}

func main() {
	// 获取当前可执行文件的路径
	// 	exePath, err := os.Executable()
	// 	if err != nil {
	// 		fmt.Println("Error getting executable path:", err)
	// 		return
	// 	}

	// 	// 替换环境变量
	//     // 获取 %LOCALAPPDATA% 环境变量的值
	// 	localAppData := os.Getenv("LOCALAPPDATA")
	// 	// 检查是否获取到了环境变量的值
	// 	if localAppData == "" {
	// 		fmt.Println("无法获取 LOCALAPPDATA 环境变量")
	// 		return
	// 	}
	// 	// 构造完整的路径
	// 	targetPath := filepath.Join(localAppData, "Google", "Chrome", "User Data", "Default", "NativeMessagingHosts")

	//     // 检查目标目录是否存在，如果不存在则创建
	// 	if _, err := os.Stat(targetPath); os.IsNotExist(err) {
	// 		err = os.MkdirAll(targetPath, 0755)
	// 		if err != nil {
	// 			fmt.Println("Error creating target directory:", err)
	// 			return
	// 		}
	// 	}

	// 	// 构建完整的文件路径
	// 	filePath := filepath.Join(targetPath, "com.yisa.nativeapp.json")

	// 	// 创建或打开文件
	// 	file, err := os.Create(filePath)
	// 	if err != nil {
	// 		fmt.Println("创建文件时出错: ", err)
	// 	}
	// 	defer file.Close()

	// 写入内容到文件
	// 	content := `{
	//   "name": "com.yisa.nativeapp",
	//   "description": "Yisa Native App",
	//   "path": "./nativeapp.exe",
	//   "type": "stdio",
	//   "allowed_origins": [
	//     "chrome-extension://oacmjpblobgdfpcndnlembgkbhpahffa/"
	//   ]
	// }`
	// 	_, err = file.WriteString(content)
	// 	if err != nil {
	// 		fmt.Println("写入文件时出错: ", err)
	//         return
	// 	}

	// 	// 或者使用 ioutil.WriteFile 一次性写入内容
	// 	err = ioutil.WriteFile(filePath, []byte(content), 0644)
	// 	if err != nil {
	// 		fmt.Println("写入文件时出错: ", err)
	//         return
	// 	}

	//     targetPath = targetPath + "\\nativeapp.exe"
	// 	// 检查当前可执行文件是否在目标目录
	// 	if exePath != targetPath {
	// 		// 复制当前可执行文件到目标目录
	// 		err := copyFile(exePath, targetPath)
	// 		if err != nil {
	// 			fmt.Println("Error copying file:", err)
	// 			return
	// 		}

	// 		// 使目标文件可执行
	// 		err = os.Chmod(targetPath, 0755)
	// 		if err != nil {
	// 			fmt.Println("Error setting file permissions:", err)
	// 			return
	// 		}
	//         MessageBox(0, "安装成功", "通知", 0x40) // 0x40 表示信息图标
	// 		// 退出当前进程
	// 		os.Exit(0)
	// 	}

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

// getFullPath 获取完整路径
func getFullPath(relativePath string) (string, error) {
	// 假设 relativePath 是相对于某个已知目录的路径
	knownDirectory := os.Getenv("LOCALAPPDATA") // 你可以根据实际情况修改
	fullPath := filepath.Join(knownDirectory, relativePath)

	// 检查路径是否存在
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return "", fmt.Errorf("path does not exist: %s", fullPath)
	}

	return fullPath, nil
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
	action, ok := message["action"].(string)
	if !ok {
		sendMessage(map[string]interface{}{"error": "Invalid action", "action": action})
		return
	}

	switch action {
	case "download":
		url, ok := message["url"].(string)
		if !ok {
			sendMessage(map[string]interface{}{"error": "Invalid URL", "action": action})
			return
		}

		filename, ok := message["filename"].(string)
		if !ok {
			sendMessage(map[string]interface{}{"error": "Invalid filename", "action": action})
			return
		}

		savePath, ok := message["save_path"].(string)
		if !ok {
			savePath = "/default/path"
		}

		var body []byte
		var err error

		// 判断是否为 base64 或 data URL
		if strings.HasPrefix(url, "data:") {
			// 处理 data URL
			dataURLParts := strings.SplitN(url, ",", 2)
			if len(dataURLParts) != 2 {
				sendMessage(map[string]interface{}{"error": "Invalid data URL format", "action": action})
				return
			}
			body, err = base64.StdEncoding.DecodeString(dataURLParts[1])
			if err != nil {
				sendMessage(map[string]interface{}{"error": fmt.Sprintf("Failed to decode data URL: %v", err), "action": action})
				return
			}
		} else {
			// 通过网络下载文件
			resp, err := http.Get(url)
			if err != nil {
				sendMessage(map[string]interface{}{"error": fmt.Sprintf("Failed to download file: %v", err), "action": action})
				return
			}
			defer resp.Body.Close()

			// 读取响应体为字节切片
			body, err = ioutil.ReadAll(resp.Body)
			if err != nil {
				sendMessage(map[string]interface{}{"error": fmt.Sprintf("Failed to read response body: %v", err), "action": action})
				return
			}
		}

		// 检查目标目录是否存在，如果不存在则创建
		if _, err := os.Stat(savePath); os.IsNotExist(err) {
			err = os.MkdirAll(savePath, 0755)
			if err != nil {
				sendMessage(map[string]interface{}{"error": fmt.Sprintf("Failed to create target directory: %v", err), "action": action})
				return
			}
		}

		// 保存文件
		filePath := filepath.Join(savePath, filename)
		err = ioutil.WriteFile(filePath, body, 0644)
		if err != nil {
			sendMessage(map[string]interface{}{"error": fmt.Sprintf("Failed to save file: %v", err), "action": action})
			return
		}
		// showNotification("通知", "保存文件成功")

		utf8FilePath, err := toUTF8(filePath)
		if err != nil {
			// 处理错误
		}

		utf8Title, err := toUTF8("保存截图成功")
		if err != nil {
			// 处理错误
		}

		utf8AppID, err := toUTF8("一键联查")
		if err != nil {
			// 处理错误
		}

		notification := toast.Notification{
			AppID:   utf8AppID,
			Title:   utf8Title,
			Message: utf8FilePath,
		}
		if err = notification.Push(); err != nil {
			log.Fatalln(err)
		}
		// 发送成功响应
		sendMessage(map[string]interface{}{"status": "success", "path": filePath, "action": action})

	case "get_full_path":
		relativePath, ok := message["relative_path"].(string)
		if !ok {
			sendMessage(map[string]interface{}{"error": "Invalid relative path", "action": action})
			return
		}

		// 获取完整路径
		fullPath, err := getFullPath(relativePath)
		if err != nil {
			sendMessage(map[string]interface{}{"error": fmt.Sprintf("Failed to get full path: %v", err), "action": action})
			return
		}

		// 发送成功响应
		sendMessage(map[string]interface{}{"status": "success", "full_path": fullPath, "action": action})

	default:
		sendMessage(map[string]interface{}{"error": "Unknown action", "action": action})
	}
}
