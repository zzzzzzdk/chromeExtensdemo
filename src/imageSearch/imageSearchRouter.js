import React from 'react';
import { Router, Route, Switch } from 'dva/router';
import ImageSearchResult from './routes/ImageSearchResult.jsx';

function RouterConfig({ history }) {
  return (
    <Router history={history}>
      <Switch>
        <Route path="/:id" component={ImageSearchResult} />
      </Switch>
    </Router>
  );
}

export default RouterConfig;
