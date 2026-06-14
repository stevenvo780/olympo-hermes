'use client';
import { AnyAction, combineReducers } from '@reduxjs/toolkit';
import auth from './auth';
import ui from './ui';
import commerces from './commerces';
import config from './config';
import products from './products';
import { RESET_APP_STATE } from './actions';

const appReducer = combineReducers({
  auth,
  ui,
  commerces,
  config,
  products,
});

const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: AnyAction) => {
  if (action.type === RESET_APP_STATE) {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

export default rootReducer;
