'use client';
import { combineReducers } from '@reduxjs/toolkit';
import auth from './auth';
import ui from './ui';
import cart from './cart';
import orders from './orders';
import categories from './categories';
import products from './products';
import config from './config';

const rootReducer = combineReducers({
  auth,
  ui,
  cart,
  orders,
  categories,
  products,
  config,
});

export default rootReducer;
