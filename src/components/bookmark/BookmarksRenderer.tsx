import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Bookmark } from '../../types/bookmark';
import { formatDate, calculateVisibleCharacters } from '../../services/Utils';
import { Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import Image from '../common/image/Image';

interface BookmarkTableRowProps {
	bookmark: Bookmark;
	isSelected: boolean;
	onSelect?: (id: string, e: React.MouseEvent) => void;
	onEdit: (bookmark: Bookmark) => void;
	onDelete: (bookmarkId: string) => void;
	onToggleCollapsed: (bookmarkId: string) => void; // New callback for toggling individual bookmark collapsed state
}

export default function BookmarkTableRow(props: Readonly<BookmarkTableRowProps>) {
	const { bookmark, isSelected, onEdit, onDelete, onToggleCollapsed, onSelect } = props;
	const { theme } = useTheme();

	const openUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

	const isCollapsed = bookmark.collapsed ?? true;

	return (
		<div>
			{!isCollapsed ? (
				<CardView
					bookmark={bookmark}
					isSelected={isSelected}
					onSelect={onSelect}
					onEdit={onEdit}
					onDelete={onDelete}
					onOpen={openUrl}
					onCollapse={() => onToggleCollapsed(bookmark.id)}
					theme={theme}
				/>
			) : (
				<RowView
					bookmark={bookmark}
					isSelected={isSelected}
					onSelect={onSelect}
					onEdit={onEdit}
					onDelete={onDelete}
					onToggleExpand={() => onToggleCollapsed(bookmark.id)}
					expanded={!isCollapsed}
					theme={theme}
					onOpen={openUrl}
				/>
			)}
		</div>
	);
}

function RowView(props: Readonly<{ bookmark: Bookmark; isSelected: boolean; onEdit: (b: Bookmark) => void; onDelete: (id: string) => void; onToggleExpand: () => void; expanded: boolean; theme: any; onOpen: (url: string) => void; onSelect?: (id: string, e: React.MouseEvent) => void }>) {
	const { bookmark, isSelected, onEdit, onDelete, onToggleExpand, expanded, theme, onOpen, onSelect } = props;
	const [isHovered, setIsHovered] = useState(false);
	const [isTitleHovered, setIsTitleHovered] = useState(false);
	const titleRef = useRef<HTMLButtonElement | null>(null);
	const truncatedTitle = useTruncatedText(bookmark.title, titleRef);

	const buttonsOpacity = isHovered ? 1 : 0;
	const buttonsPointerEvents = isHovered ? 'auto' : 'none';

	return (
		<div
			className="bookmark-row-view"
			onClick={(e) => { if (onSelect) { onSelect(bookmark.id, e); } }}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{ backgroundColor: 'transparent', borderRadius: 4 }}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1 }}>
				<div style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<Image value={bookmark.icon || '\ud83c\udf10'} size={16} rounded={true} />
				</div>
				<div style={{ flex: 1, position: 'relative' }}>
					<DelayedTooltip
						title={bookmark.title}
						url={bookmark.url}
					>
						<button
							className="bookmark-title"
							onClick={(e) => { e.stopPropagation(); onOpen(bookmark.url); }}
							ref={titleRef}
							onMouseEnter={() => setIsTitleHovered(true)}
							onMouseLeave={() => setIsTitleHovered(false)}
							style={{
								color: isTitleHovered ? (bookmark.color || '#1a73e8') : (bookmark.color || theme.colors.text.primary),
								textDecoration: isTitleHovered ? 'underline' : 'none',
								cursor: isTitleHovered ? 'pointer' : 'inherit',
								background: 'none',
								border: 'none',
								padding: 0
							}}
						>
							{truncatedTitle}
						</button>
					</DelayedTooltip>

					<div style={{
						position: 'absolute',
						right: 0,
						top: '50%',
						transform: 'translateY(-50%)',
						display: 'flex',
						gap: 1,
						alignItems: 'center',
						opacity: buttonsOpacity,
						transition: 'opacity 120ms ease',
						pointerEvents: buttonsPointerEvents,
						backgroundColor: 'transparent',
						borderRadius: '4px',
						padding: '2px'
					}}>
						<button onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} title={expanded ? 'Collapse' : 'Expand'}
										style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: '2px',
								display: 'flex',
								alignItems: 'center',
								color: '#666'
							}}>
							{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
						</button>
						<button onClick={(e) => { e.stopPropagation(); onEdit(bookmark); }} title="Edit"
						style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: '2px',
								display: 'flex',
								alignItems: 'center',
								color: '#666'
							}}>
							<Edit size={16} />
						</button>
						<button onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id); }} title="Delete"
						style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: '2px',
								display: 'flex',
								alignItems: 'center',
								color: '#d32f2f'
							}}>
							<Trash2 size={16} />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function CardView(props: Readonly<{ bookmark: Bookmark; isSelected: boolean; onEdit: (b: Bookmark) => void; onDelete: (id: string) => void; onOpen: (url: string) => void; onCollapse?: () => void; theme: any; onSelect?: (id: string, e: React.MouseEvent) => void }>) {
	const { bookmark, isSelected, onEdit, onDelete, onOpen, onCollapse, theme, onSelect } = props;
	const [isHovered, setIsHovered] = useState(false);
	const [isTitleHovered, setIsTitleHovered] = useState(false);
	const titleRef = useRef<HTMLHeadingElement | null>(null);
	const urlRef = useRef<HTMLDivElement | null>(null);
	const truncatedTitle = useTruncatedText(bookmark.title, titleRef);
	const truncatedUrl = useTruncatedText(bookmark.url, urlRef);

	const buttonsOpacity = isHovered ? 1 : 0;
	const buttonsPointerEvents = isHovered ? 'auto' : 'none';

	const handleEditClick = (e: React.MouseEvent) => { e.stopPropagation(); onEdit(bookmark); };
	const handleDeleteClick = (e: React.MouseEvent) => { e.stopPropagation(); onDelete(bookmark.id); };

	return (
		<div
			onClick={(e) => { if (onSelect) { onSelect(bookmark.id, e); } }}
			onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onOpen(bookmark.url); } }}
			style={{
				backgroundColor: isSelected ? '#e3f2fd' : theme.colors.surface,
				border: `1px solid ${theme.colors.border}`,
				borderRadius: '8px',
				padding: '5px',
				cursor: 'pointer',
				transition: 'all 0.2s ease',
				transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
				boxShadow: isHovered ? '0 8px 25px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
				position: 'relative',
				textAlign: 'left',
				width: '100%',
				borderStyle: 'solid'
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>

			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<Image value={bookmark.icon || '\ud83c\udf10'} size={18} rounded={true} />
					</div>
					<div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
						<DelayedTooltip
							title={bookmark.title}
							url={bookmark.url}
						>
							<h3
								ref={titleRef}
								className="bookmark-title"
								onMouseEnter={() => setIsTitleHovered(true)}
								onMouseLeave={() => setIsTitleHovered(false)}
								style={{
									...titleStyleCardView(theme),
									margin: 0,
									paddingLeft: '5px',
									color: isTitleHovered ? (bookmark.color || '#1a73e8') : (bookmark.color || theme.colors.text.primary),
									overflow: 'hidden',
									cursor: isTitleHovered ? 'pointer' : 'inherit',
									textDecoration: isTitleHovered ? 'underline' : 'none'
								}}
							>
								{truncatedTitle}
							</h3>
						</DelayedTooltip>

						<div style={{
							position: 'absolute',
							right: 0,
							top: '50%',
							transform: 'translateY(-50%)',
							display: 'flex',
							gap: '0.25rem',
							alignItems: 'center',
							opacity: buttonsOpacity,
							transition: 'opacity 0.18s ease',
							pointerEvents: buttonsPointerEvents,
							backgroundColor: 'inherit',
							borderRadius: '4px',
							padding: '2px'
						}}>
							{onCollapse && (
								<button onClick={(e) => { e.stopPropagation(); onCollapse(); }} title="Collapse to row view"
								style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: '2px',
								display: 'flex',
								alignItems: 'center',
								color: '#666'
							}}>
									<ChevronUp size={16} />
								</button>
							)}
							<button onClick={handleEditClick} title="Edit bookmark"
							style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: '2px',
								display: 'flex',
								alignItems: 'center',
								color: '#666'
							}}>
								<Edit size={16} />
							</button>
							<button onClick={handleDeleteClick} title="Delete bookmark"
							style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: '2px',
								display: 'flex',
								alignItems: 'center',
								color: '#d32f2f'
							}}>
								<Trash2 size={16} />
							</button>
						</div>
					</div>
				</div>
			</div>

			<div style={{ paddingRight: '0px' }}>
				<div
					ref={urlRef}
					style={{ ...urlStyle(theme) }}
					title={bookmark.url}
				>
					{truncatedUrl}
				</div>
				{bookmark.description && <p style={descriptionStyle(theme)} title={bookmark.description}>{bookmark.description}</p>}

				{bookmark.tags && bookmark.tags.length > 0 && (
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
						{bookmark.tags.slice(0, 3).map((tag) => (
							<span key={tag} style={tagPillStyle(theme)}>{tag}</span>
						))}
						{bookmark.tags.length > 3 && <span style={{ ...tagPillStyle(theme), backgroundColor: theme.colors.text.secondary }}>+{bookmark.tags.length - 3}</span>}
					</div>
				)}

				<div style={{ marginTop: 'auto', fontSize: theme.fonts.sizes.small, color: theme.colors.text.secondary }}>
					<div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', columnGap: '0.5rem', rowGap: '0.25rem', alignItems: 'center' }}>
						<div style={{ color: theme.colors.text.secondary }}>Creation date :</div>
						<div style={{ color: theme.colors.text.primary }}>{formatDate(bookmark.createdDate)}</div>
						<div style={{ color: theme.colors.text.secondary }}>Last modified :</div>
						<div style={{ color: theme.colors.text.primary }}>{formatDate(bookmark.lastModifiedDate)}</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function useTruncatedText(text: string, containerRef: React.RefObject<HTMLElement | null>, ellipsis = '...') {
	const [truncated, setTruncated] = useState(text);

	useEffect(() => {
		const el = containerRef?.current;
		if (!el) {
			setTruncated(text);
			return;
		}

		const compute = () => {
			const style = window.getComputedStyle(el);
			const fontWeight = style.fontWeight || '400';
			const fontSize = style.fontSize || '14px';
			const fontFamily = style.fontFamily || 'Arial, sans-serif';
			const font = `${fontWeight} ${fontSize} ${fontFamily}`;

			const nearest = el.closest('.flexlayout__tab');
			const measuringEl = nearest instanceof HTMLElement ? nearest : null;

			const width = Math.max(0, (measuringEl ? measuringEl.clientWidth - 8 : el.clientWidth - 4));
			if (width <= 0) {
				setTruncated(text);
				return;
			}

			let iconWidth = 38;
			let visible = calculateVisibleCharacters(text, width - iconWidth, font, ellipsis);
			if (visible >= text.length) setTruncated(text);
			else if (visible <= 0) setTruncated(ellipsis);
			else setTruncated(text.slice(0, visible) + ellipsis);
		};

		compute();

		const cleanupFunctions: (() => void)[] = [];

		if ((window as any).ResizeObserver) {
			const _ro = new (window as any).ResizeObserver(() => compute());
			_ro.observe(el);
			cleanupFunctions.push(() => _ro.disconnect());
		}

		const flexTab = el.closest('.flexlayout__tab');
		if (flexTab && flexTab instanceof HTMLElement && (window as any).ResizeObserver) {
			const tabRo = new (window as any).ResizeObserver(() => compute());
			tabRo.observe(flexTab);
			cleanupFunctions.push(() => tabRo.disconnect());
		}

		const handleFlexLayoutResize = () => {
			setTimeout(compute, 10);
		};

		window.addEventListener('flexlayout-resize', handleFlexLayoutResize);
		cleanupFunctions.push(() => window.removeEventListener('flexlayout-resize', handleFlexLayoutResize));

		window.addEventListener('resize', compute);
		cleanupFunctions.push(() => window.removeEventListener('resize', compute));

		return () => {
			cleanupFunctions.forEach(cleanup => cleanup());
		};
	}, [text, containerRef, ellipsis]);

	return truncated;
}

function DelayedTooltip({
	children,
	title,
	url,
	delay = 1000
}: Readonly<{
	children: React.ReactNode;
	title: string;
	url: string;
	delay?: number;
}>) {
	const [showTooltip, setShowTooltip] = useState(false);
	const timeoutRef = useRef<number | null>(null);
	const [position, setPosition] = useState({ x: 0, y: 0 });

	const handleMouseEnter = (e: React.MouseEvent) => {
		const rect = e.currentTarget.getBoundingClientRect();
		setPosition({
			x: rect.left + rect.width / 2,
			y: rect.top - 10
		});

		timeoutRef.current = window.setTimeout(() => {
			setShowTooltip(true);
		}, delay);
	};

	const handleMouseLeave = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		setShowTooltip(false);
	};

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return (
		<div style={{ position: 'relative', display: 'inline-block' }}>
			<div
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onFocus={() => setShowTooltip(true)}
				onBlur={() => setShowTooltip(false)}
				tabIndex={0}
				style={{ cursor: 'inherit' }}
			>
				{children}
			</div>
			{showTooltip && (
				<div
					style={{
						position: 'fixed',
						left: position.x,
						top: position.y,
						transform: 'translateX(-50%) translateY(-100%)',
						backgroundColor: 'rgba(0, 0, 0, 0.9)',
						color: 'white',
						padding: '8px 12px',
						borderRadius: '6px',
						fontSize: '12px',
						lineHeight: '1.4',
						maxWidth: '300px',
						wordWrap: 'break-word',
						zIndex: 1000,
						pointerEvents: 'none',
						boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
					}}
				>
					<div style={{ fontWeight: '600', marginBottom: '4px' }}>{title}</div>
					<div style={{ opacity: 0.8, fontSize: '11px' }}>{url}</div>
				</div>
			)}
		</div>
	);
}

const titleStyleCardView = (theme: any) => ({
	fontSize: theme.fonts.sizes.medium,
	fontWeight: 500,
	color: theme.colors.text.primary,
	lineHeight: '1.4',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap'
} as React.CSSProperties);

const descriptionStyle = (theme: any) => ({
	margin: '0 0 0.75rem 0',
	fontSize: theme.fonts.sizes.small,
	color: theme.colors.text.secondary,
	lineHeight: '1.4',
	display: '-webkit-box',
	WebkitLineClamp: 2,
	WebkitBoxOrient: 'vertical',
	overflow: 'hidden'
} as React.CSSProperties);

const urlStyle = (theme: any) => ({
	fontSize: theme.fonts.sizes.small,
	color: theme.colors.primary,
	textDecoration: 'none',
	overflow: 'none',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
	marginBottom: '0.75rem'
} as React.CSSProperties);

const tagPillStyle = (theme: any) => ({
	display: 'inline-block',
	padding: '0.125rem 0.5rem',
	fontSize: '0.75rem',
	backgroundColor: theme.colors.primary,
	color: '#ffffff',
	borderRadius: '12px',
	fontWeight: 500
} as React.CSSProperties);
