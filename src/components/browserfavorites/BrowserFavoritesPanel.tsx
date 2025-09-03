// Export a lightweight panel factory and keep the manager available for direct import.
import React from 'react';
import BrowserFavoritesForm from './BrowserFavoritesForm';
import BrowserFavoritesRenderer from './BrowserFavoritesRenderer';
import { BrowserFavorites, BrowserFavoritesFormData, BrowserBookmarkNode } from '../../types/browser';
import { FormDisplayMode } from '../../types/app';

export type BrowserFavoritesPanelProps = {
	browserFavorites: BrowserFavorites | null;
	formMode: FormDisplayMode;
	onFormSave: (formData: BrowserFavoritesFormData, file?: File) => void;
	onFormCancel: () => void;
	tree: BrowserBookmarkNode[];
	onTreeChange: (updated: BrowserBookmarkNode[]) => void;
	onSelect?: (id?: string) => void;
	className?: string;
};

/**
 * Presentational panel that renders the BrowserFavorites form + tree.
 * The manager supplies the state and handlers (persistence lives in the manager).
 */
export const BrowserFavoritesPanel: React.FC<BrowserFavoritesPanelProps> = ({
	browserFavorites,
	formMode,
	onFormSave,
	onFormCancel,
	tree,
	onTreeChange,
	onSelect,
	className
}) => {
	return (
		<div className="browser-favorites">

			<BrowserFavoritesForm
				browserFavorites={browserFavorites}
				mode={formMode}
				onSave={onFormSave}
				onCancel={onFormCancel}
			/>

			<div className="bf-file-uploaded" style={{ marginTop: '16px' }}>
				{browserFavorites?.filePath && (
					<div className="bf-file-info">
						<strong>Loaded File:</strong> {browserFavorites.filePath}
					</div>
				)}
			</div>

			<div className="bf-tree" role="tree" style={{ marginTop: '16px' }}>
				{tree.length === 0 ? (
					<div className="bf-empty">No bookmarks loaded. Import a Chrome bookmarks HTML file.</div>
				) : (
					<BrowserFavoritesRenderer bookmarksTree={tree} onChange={onTreeChange} onSelect={onSelect} className={className} />
				)}
			</div>
		</div>
	);
};

export default BrowserFavoritesPanel;
