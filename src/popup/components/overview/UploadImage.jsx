import React from 'react';
import FAIcon from '@fortawesome/react-fontawesome';
import faSolid from '@fortawesome/fontawesome-free-solid';
import { Upload } from 'antd';
const Dragger = Upload.Dragger;

export default class UploadImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      haveFile: false,
      fileList: [],
      allowHandle: false
    };
  }

  componentWillMount() {
    console.log(location.href)
    // 发送消息请求允许的IP地址列表
    chrome.runtime.sendMessage({ action: 'getAllowedHandle' }, (response) => {
      this.setState({
        allowHandle: response.allowHandle
      })
    });
  }

  imageUpload(file) {
    let { imageSearchBegin } = this.props;
    console.log("上传文件：", file);
    this.getBase64(file, base64 => {
      imageSearchBegin(base64);
    });
  }

  getBase64(file, callBack) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
      callBack(this.result);
    };
  }


  render() {

    return (
      <Dragger
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
      </Dragger>
    );
  }
}
