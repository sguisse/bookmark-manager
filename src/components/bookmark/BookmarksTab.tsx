import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Bookmark, BookmarkInput } from '../../types/bookmark';
import BookmarkCard from './BookmarkCard';
import BookmarkForm from './BookmarkForm';

export default function BookmarksTab() {
  const { theme } = useTheme();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);



}
