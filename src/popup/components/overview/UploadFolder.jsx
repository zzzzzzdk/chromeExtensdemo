import React from 'react';
import FAIcon from '@fortawesome/react-fontawesome';
import faSolid from '@fortawesome/fontawesome-free-solid';
import styled from 'styled-components';
import { Upload, Button, message, Form, Radio, Input } from 'antd';
import { apiUrls } from 'SRC/constant/searchApiUrl.js';
const Dragger = Upload.Dragger;

const UploadFolderContainer = styled.div`
  .ant-form {
    padding: 20px 10px 0 10px;
    .ant-form-item-with-help {
      margin-bottom: 13px;
    }
    .ant-form-item {
      display: flex;

      .ant-form-item-label {
        width: 28%;
        line-height: 32px;
        text-align: right;
        margin-right: 8px;
      }
      .ant-form-item-control-wrapper {
        .ant-form-item-children > div {
          display: flex;
          .ant-input {
            margin-right: 8px;
          }
        }
        .ant-radio-group {
          margin-top: 4px;
        }
      }
    }
  }
`;

export default class UploadFolder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allowHandle: false,
      formData: {
        files: [],
        // 上传目录
        folder_path: {
          value: '',
          validateStatus: 'success',
          errorMsg: null,
        },
        // 保存路径
        save_path: {
          value: 'E:/研判',
          validateStatus: 'success',
          errorMsg: null,
        },
        concurrent: 2,
        platform: 'bsz',
      },
    };
  }

  componentWillMount() {
    console.log(location.href);
    // 发送消息请求允许的IP地址列表
    chrome.runtime.sendMessage({ action: 'getAllowedHandle' }, response => {
      this.setState({
        allowHandle: response.allowHandle,
        // allowHandle: true,
      });
    });
  }

  imageUpload(file, fileList) {
    let { imageSearchBegin } = this.props;
    console.log('上传文件：', file);
    this.getBase64(file, base64 => {
      imageSearchBegin({
        type: 'single',
        data: base64,
      });
    });
  }

  // 文件夹监听变化
  async handleFolderInputChange(e) {
    const files = e.target.files;
    console.log(files);
    if (files.length > 0) {
      // 过滤出图片类型的文件
      const imageFiles = Array.from(files).filter(file =>
        file.type.startsWith('image/'),
      );

      if (imageFiles.length > 0) {
        this.setState({
          formData: {
            ...this.state.formData,
            files: imageFiles,
            folder_path: {
              value: `获取到${imageFiles.length}个图片文件`,
              validateStatus: 'success',
              errorMsg: null,
            },
          },
        });
      } else {
        // 如果没有选中任何图片文件，可以显示错误提示
        this.setState({
          formData: {
            ...this.state.formData,
            files: [],
            folder_path: {
              value: '',
              validateStatus: 'error',
              errorMsg: '请选择图片文件',
            },
          },
        });
      }
    }
  }

  async handleSaveInputChange(e) {
    this.setState({
      formData: {
        ...this.state.formData,
        save_path: {
          value: e.target.value,
          validateStatus: 'success',
          errorMsg: null,
        },
      },
    });
  }

  handleConcurrentChange = e => {
    this.setState({
      formData: {
        ...this.state.formData,
        concurrent: e.target.value,
      },
    });
  };

  handlePlatformChange = e => {
    const value = e.target.value
    this.setState({
      formData: {
        ...this.state.formData,
        platform: e.target.value,
        concurrent: value === 'ssz' ? 1 : 2
      },
    });
  };

  getBase64(file, callBack, errorCb) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function() {
      callBack(this.result);
    };
    reader.onerror = function(err) {
      errorCb(err);
    };
  }

  // 执行上传
  async handleUpload() {
    const _this = this;
    const newFormData = { ...this.state.formData };

    let verify = true;
    if (!newFormData.folder_path.value) {
      newFormData.folder_path = {
        validateStatus: 'error',
        errorMsg: '请选择人脸图片目录！',
      };
    }
    if (!newFormData.save_path.value) {
      newFormData.save_path = {
        validateStatus: 'error',
        errorMsg: '请输入结果保存路径',
      };
    }

    if (!verify) {
      this.setState({
        formData: newFormData,
      });
    }

    console.log(this.state.formData.files);
    let { imageSearchBegin } = this.props;

    const files = Array.from(this.state.formData.files);
    const base64Promises = files.map(async file => {
      return new Promise((resolve, reject) => {
        _this.getBase64(
          file,
          base64 => {
            resolve({
              filename: file.name,
              base64: base64,
            });
          },
          err => {
            reject(err);
          },
        );
      });
    });
    const base64Array = await Promise.all(base64Promises);
    console.log('base64Array', base64Array);
    // 传递给background.js
    chrome.runtime.sendMessage(
      {
        job: 'handleImageTasks',
        action: 'startTasks',
        base64Array: base64Array,
        savePath: newFormData.save_path.value,
        concurrent: newFormData.concurrent,
        platform: newFormData.platform,
      },
      response => {
        if (chrome.runtime.lastError) {
          message.error('文件上传失败', chrome.runtime.lastError.message);
        }
      },
    );
  }

  render() {
    const currentFormData = this.state.formData;
    return (
      <UploadFolderContainer>
        <Form>
          <Form.Item
            label="人脸图片上传"
            validateStatus={currentFormData.folder_path.validateStatus}
            help={currentFormData.folder_path.errorMsg}
          >
            <div>
              <input
                type="file"
                id="folderInput"
                webkitdirectory="true"
                onChange={e => this.handleFolderInputChange(e)}
                style={{ display: 'none' }}
              />

              <Input
                value={currentFormData.folder_path.value}
                readOnly
                disabled={!this.state.allowHandle}
              />
              <Button
                type="primary"
                onClick={() => document.getElementById('folderInput').click()}
                disabled={!this.state.allowHandle}
              >
                选择文件夹
              </Button>
            </div>
          </Form.Item>
          <Form.Item
            label="结果保存路径"
            validateStatus={currentFormData.save_path.validateStatus}
            help={currentFormData.save_path.errorMsg}
          >
            <div>
              {/* <input
                type="file"
                id="saveInput"
                webkitdirectory="true"
                onChange={e => this.handleSaveInputChange(e)}
                style={{ display: 'none' }}
              /> */}
              <Input
                value={currentFormData.save_path.value}
                onChange={e => this.handleSaveInputChange(e)}
                disabled={!this.state.allowHandle}
              />
              {/* <Button
                type="primary"
                onClick={() => {
                  // document.getElementById('saveInput').click()
                  chrome.runtime.sendMessage(
                    { job: 'getFullPath' },
                    response => {
                      if (response && response.full_path) {
                        this.setState({
                          formData: {
                            ...this.state.formData,
                            folder_path: {
                              value: response.full_path,
                              validateStatus: 'success',
                              errorMsg: null,
                            },
                          },
                        });
                      } else {
                        message.error('获取完整路径失败');
                      }
                    },
                  );
                }}
              >
                选择文件夹
              </Button> */}
            </div>
          </Form.Item>
          <Form.Item label="执行平台">
            <Radio.Group
              onChange={e => this.handlePlatformChange(e)}
              value={currentFormData.platform}
              disabled={!this.state.allowHandle}
            >
              <Radio value={'bsz'}>部视综</Radio>
              <Radio value={'ssz'}>省视综</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="并发数量">
            <Radio.Group
              onChange={e => this.handleConcurrentChange(e)}
              value={currentFormData.concurrent}
              disabled={!this.state.allowHandle}
            >
              <Radio value={1}>1</Radio>
              <Radio value={2}>2</Radio>
              <Radio value={3}>3</Radio>
              <Radio value={4}>4</Radio>
              <Radio value={5}>5</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                width: '100%',
              }}
              onClick={() => this.handleUpload()}
              disabled={!this.state.allowHandle}
            >
              上传
            </Button>
          </Form.Item>
        </Form>
      </UploadFolderContainer>
    );
  }
}
