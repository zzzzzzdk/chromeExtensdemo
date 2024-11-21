import React from 'react';
import FAIcon from '@fortawesome/react-fontawesome';
import faSolid from '@fortawesome/fontawesome-free-solid';
import styled from 'styled-components';
import { Upload, Button, message } from 'antd';
const Dragger = Upload.Dragger;

const UploadImageContainer = styled.div`
  .ant-upload-list-item-info {
    > span {
      display: flex;
    }
    .ant-upload-list-item-name {
      width: 95%;
    }
  }
`;

export default class UploadImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      haveFile: false,
      fileList: [],
      allowHandle: false,
    };
  }

  componentWillMount() {
    console.log(location.href);
    // 发送消息请求允许的IP地址列表
    chrome.runtime.sendMessage({ action: 'getAllowedHandle' }, response => {
      this.setState({
        allowHandle: response.allowHandle,
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

  imageUploadMultiBefore(file, fileList) {
    // const isImage = file.type.startsWith('image/')
    // if (!isImage) {
    //     message.error(`${file.name}格式不正确！`);
    //     return false;
    // }

    let { imageSearchBegin } = this.props;
    console.log('Before upload single file:', file);

    // 单个文件直接进行下一步
    if (fileList.length === 1) {
      this.setState({
        fileList: [],
      });
      this.getBase64(file, base64 => {
        imageSearchBegin({
          type: 'single',
          data: {
            filename: file.name,
            base64: base64,
          },
        });
      });
    } else {
      this.setState({
        fileList: fileList,
      });
    }
    // 预处理单个文件，这里简单返回true
    return true;
  }

  imageUploadMultiChange(info) {}

  // 存在多个文件时执行上传动作
  async handleUpload() {
    const _this = this;
    console.log(this.state.fileList);
    let { imageSearchBegin } = this.props;

    const base64Promises = this.state.fileList.map(async file => {
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
    imageSearchBegin({
      type: 'multi',
      data: base64Array,
    });
  }

  render() {
    return (
      <UploadImageContainer>
        {/* <Dragger
        // onChange ={(e)=>this.imageUpload(e)}
        // onChange = {(e)=>this.imageUpload(e)}
        showUploadList={false}
        beforeUpload={file => this.imageUpload(file)}
        disabled={!this.state.allowHandle}
      >
        <FAIcon className="toolStart" icon={faSolid.faUpload} />
        <p className="ant-upload-text">{i18n('reverse_image_search')}</p>
        <p className="ant-upload-hint">
          {i18n('support_for_a_single_upload')}.
        </p>
      </Dragger> */}
        <Dragger
          showUploadList={this.state.fileList.length > 1 ? true : false}
          onChange={e => this.imageUploadMultiChange(e)}
          beforeUpload={(file, fileList) =>
            this.imageUploadMultiBefore(file, fileList)
          }
          disabled={!this.state.allowHandle}
          multiple
          accept="image/*"
        >
          <FAIcon className="toolStart" icon={faSolid.faUpload} />
          <p className="ant-upload-text">{i18n('reverse_image_search')}</p>
          <p className="ant-upload-hint">
            {i18n('support_for_multiple_upload')}. 注：多选文件类型请保持统一
          </p>
        </Dragger>
        {this.state.fileList.length > 1 ? (
          <Button
            type="primary"
            style={{
              width: '100%',
              marginTop: '20px',
            }}
            onClick={() => this.handleUpload()}
          >
            上传
          </Button>
        ) : (
          ''
        )}
      </UploadImageContainer>
    );
  }
}
