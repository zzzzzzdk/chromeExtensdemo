import React from 'react';
import { Router, Route, Switch } from 'dva/router';
import Noobox from './routes/Noobox.jsx';
import Overview from './routes/Overview';
import Options from './routes/Options.jsx';
import UserHistory from './routes/UserHistory';
import About from './routes/About.jsx';
import {
  OVERVIEW_URL,
  HISTORY_URL,
  OPTIONS_URL,
  ABOUT_URL,
} from '../constant/navURL';

function RouterConfig({ history }) {
  return (
    <Router history={history}>
      <Noobox path="/">
        <Switch>
          <Route path={OVERVIEW_URL} component={Overview} />
          <Route path={HISTORY_URL} component={UserHistory} />
          <Route path={OPTIONS_URL} component={Options} />
          {/* <Route path={ABOUT_URL} component={About} /> */}
        </Switch>
      </Noobox>
    </Router>
  );
}
export default RouterConfig;
