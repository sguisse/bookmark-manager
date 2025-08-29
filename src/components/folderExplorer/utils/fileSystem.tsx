import { readdir, rename, unlink, rmdir, stat } from 'fs/promises';
import path from 'path';

export const listDirectory = async (directoryPath: string) => {
  try {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    return entries.map(dirent => ({
      name: dirent.name,
      isDir: dirent.isDirectory(),
      fullPath: path.join(directoryPath, dirent.name)
    }));
  } catch (error) {
    console.error(`Failed to read directory: ${directoryPath}`, error);
    return [];
  }
};

export const deleteItem = async (itemPath: string, isDir: boolean) => {
  try {
    if (isDir) {
      await rmdir(itemPath, { recursive: true });
    } else {
      await unlink(itemPath);
    }
    return true;
  } catch (error) {
    console.error(`Failed to delete item: ${itemPath}`, error);
    return false;
  }
};

export const renameItem = async (oldPath: string, newPath: string) => {
  try {
    await rename(oldPath, newPath);
    return true;
  } catch (error) {
    console.error(`Failed to rename item: ${oldPath} to ${newPath}`, error);
    return false;
  }
};

export const moveFile = async (sourcePath: string, destinationPath: string) => {
  try {
    await rename(sourcePath, destinationPath);
    return true;
  } catch (error) {
    console.error(`Failed to move file: ${sourcePath} to ${destinationPath}`, error);
    return false;
  }
};

export const getFileContent = async (filePath: string) => {
  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isDirectory()) {
      // Lire les 1000 premiers caractères pour un aperçu
      const content = await readdir(filePath, { encoding: 'utf-8', start: 0, end: 1000 });
      return content.toString();
    }
    return null;
  } catch (error) {
    console.error(`Failed to read file content: ${filePath}`, error);
    return null;
  }
};
