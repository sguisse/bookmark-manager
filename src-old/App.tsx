import React from 'react';
import { NotificationProvider } from './contexts/NotificationContext';
import { BookmarkProvider } from './contexts/BookmarkContext';
import { MainManager } from './components/MainManager';
import './index.css';

function App() {
  return (
    <NotificationProvider>
      <BookmarkProvider>
        <MainManager />
      </BookmarkProvider>
    </NotificationProvider>
  );
}

export default App;
