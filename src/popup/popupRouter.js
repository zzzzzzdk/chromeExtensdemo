import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Router, Route, Switch, Redirect } from 'dva/router';
import Noobox from './routes/Noobox.jsx';
import Overview from './routes/Overview';
import Options from './routes/Options.jsx';
import UserHistory from './routes/UserHistory';
import About from './routes/About.jsx';
import Login from './routes/Login.jsx';
import {
  OVERVIEW_URL,
  HISTORY_URL,
  OPTIONS_URL,
  ABOUT_URL,
  LOGIN_URL,
} from '../constant/navURL';

class PrivateRoute extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isLoggedIn: false };
  }

  componentDidMount() {}

  fetchUserState = async () => {};

  render() {
    const { component: Component, ...rest } = this.props;
    const isLogin = !!localStorage.getItem('userToken');
    console.log('是否登录:', isLogin);
    return (
      <Route
        {...rest}
        render={props => {
          if (isLogin) {
            return <Component {...props} />;
          } else {
            return <Redirect to={LOGIN_URL} />;
          }
        }}
      />
    );
  }
}

function RouterConfig({ history }) {
  return (
    <Router history={history}>
      <Switch>
        <Route path={LOGIN_URL} component={Login} />
        <Noobox path="/">
          <Switch>
            <PrivateRoute path={OVERVIEW_URL} component={Overview} />
            <PrivateRoute path={HISTORY_URL} component={UserHistory} />
            <PrivateRoute path={OPTIONS_URL} component={Options} />
            {/* <Route path={ABOUT_URL} component={About} /> */}
          </Switch>
        </Noobox>
      </Switch>
    </Router>
  );
}
export default RouterConfig;
