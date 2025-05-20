import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';
import {
  OVERVIEW_URL,
  HISTORY_URL,
  OPTIONS_URL,
  ABOUT_URL,
  LOGIN_URL,
} from 'SRC/constant/navURL';

const LoginContainer = styled.div`
  margin: 10px auto;
  max-width: 400px;
  padding: 20px;
  border-radius: 4px;

  header {
    font-size: 24px;
    color: #1890ff;
    margin-bottom: 20px;
    text-align: center;
    font-weight: bold;
  }

  .ant-form-item {
    margin-bottom: 16px;
  }

  .ant-input {
    border-radius: 4px;
    width: 200px;
  }

  .ant-input:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  .ant-btn-primary {
    border-radius: 4px;
    transition: all 0.3s;
  }

  .ant-btn-primary:hover {
    background: #40a9ff;
    border-color: #40a9ff;
  }
`;

class NormalLoginForm extends React.Component {
  constructor() {
    super();
    this.state = {
      formLayout: 'horizontal',
    };
  }

  handleSubmit = e => {
    e.preventDefault();
    const _this = this;
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
        const { username, password } = values;
        if (username === 'admin' && password === '123456') {
          // 存储token到 localStorage
          localStorage.setItem('userToken', 'this is a test token');
          // try {
          //   chrome.runtime.sendMessage(
          //     {
          //       job: 'saveUserState',
          //       userToken: 'this is a test token',
          //     },
          //     function(response) {},
          //   );
          // } catch (error) {
          //   console.log(error);
          // }

          // setTimeout(() => {
            _this.props.history.push(OVERVIEW_URL);
          // }, 2000);
        }
      } else {
        message.error('请输入正确的用户名和密码');
      }
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;

    const { formLayout } = this.state;
    const formItemLayout =
      formLayout === 'horizontal'
        ? {
            labelCol: { span: 4 },
            wrapperCol: { span: 14 },
          }
        : null;
    return (
      <Form name="login" onSubmit={this.handleSubmit} layout="horizontal">
        <Form.Item name="username" label="用户名" {...formItemLayout}>
          {getFieldDecorator('username', {
            rules: [{ required: true, message: '请输入用户名!' }],
          })(<Input placeholder="请输入用户名" />)}
        </Form.Item>

        <Form.Item name="password" label="密码" {...formItemLayout}>
          {getFieldDecorator('password', {
            rules: [{ required: true, message: '请输入密码' }],
          })(<Input.Password placeholder="请输入密码" />)}
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

const WrappedNormalLoginForm = Form.create({ name: 'normal_login' })(
  withRouter(NormalLoginForm),
);

const Login = () => {
  return (
    <LoginContainer>
      <header>一键联查</header>
      <WrappedNormalLoginForm />
    </LoginContainer>
  );
};

export default Login;
