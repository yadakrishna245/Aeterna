import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, Trash2, Edit3, Eye, Search, FolderOpen, Plus, X,
  Download, SortAsc, Building2, CreditCard, Heart, Scale, GraduationCap,
  Monitor, Package, Landmark, Home, Fuel, Cloud
} from 'lucide-react';
import { encryptBinary, decryptBinary, encryptData, decryptData } from '../utils/crypto';
import { getCurrentPlan } from '../utils/subscription';
import { uploadData, downloadData, remove } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

// ─── Types ───────────────────────────────────────────────────────────────────

interface DocumentMeta {
  id: string;
  name: string;
  originalName: string;
  category: string;
  notes: string;
  mimeType: string;
  size: number;
  s3Key: string;
  iv: string;
  salt: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Category {
  id: string;
  label: string;
  emoji: string;
  icon: React.ElementType;
  description: string;
  examples: string;
}

type SortMode = 'date' | 'name';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const CATEGORIES: Category[] = [
  { id: 'financial', label: 'Financial', emoji: '🏦', icon: Landmark, description: 'Banking & investment documents', examples: 'Bank passbooks, FD receipts, PPF, mutual funds, stocks, LIC, bonds, chit funds' },
  { id: 'property', label: 'Property', emoji: '🏠', icon: Home, description: 'Real estate & property records', examples: 'Land registry, sale deeds, house tax, property tax, encumbrance certificates, building plans' },
  { id: 'identity', label: 'Identity', emoji: '🪪', icon: CreditCard, description: 'Government ID documents', examples: 'Aadhaar, PAN, passport, voter ID, driving license, birth/death certificates' },
  { id: 'utilities', label: 'Utilities', emoji: '⛽', icon: Fuel, description: 'Utility connections & bills', examples: 'Gas connection (HP/Bharat/Indane), electricity, water, telephone, broadband, DTH' },
  { id: 'banking', label: 'Banking & Lockers', emoji: '🏧', icon: Building2, description: 'Bank accounts & locker info', examples: 'Bank locker details, credit/debit cards, net banking info' },
  { id: 'medical', label: 'Medical', emoji: '💊', icon: Heart, description: 'Health & medical records', examples: 'Health insurance, prescriptions, blood reports, vaccination, hospital discharge' },
  { id: 'legal', label: 'Legal', emoji: '⚖️', icon: Scale, description: 'Legal documents & agreements', examples: 'Will, power of attorney, rental agreements, court orders, NOCs, affidavits' },
  { id: 'education', label: 'Education', emoji: '🎓', icon: GraduationCap, description: 'Academic records & certificates', examples: 'Degrees, marksheets, certificates, experience letters' },
  { id: 'digital', label: 'Digital', emoji: '💻', icon: Monitor, description: 'Digital accounts & credentials', examples: 'Email recovery, social media, subscriptions, cloud storage' },
  { id: 'personal', label: 'Personal', emoji: '📦', icon: Package, description: 'Personal & family documents', examples: 'Family photos, marriage certificate, divorce papers, adoption papers' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  if (mimeType.startsWith('text/')) return '📃';
  return '📎';
}


async function encryptField(value: string, masterPassword: string): Promise<string> {
  if (!value) return '';
  const enc = await encryptData(value, masterPassword);
  return JSON.stringify({ c: enc.ciphertext, i: enc.iv, s: enc.salt });
}

async function decryptField(stored: string, masterPassword: string): Promise<string> {
  if (!stored) return '';
  try {
    const { c, i, s } = JSON.parse(stored);
    return await decryptData({ ciphertext: c, iv: i, salt: s }, masterPassword);
  } catch {
    return stored; // fallback for unencrypted legacy data
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DocumentVault({ masterPassword }: { masterPassword: string }) {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('financial');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Free Tier Limit ───────────────────────────────────────────────────────
  const FREE_TIER_LIMIT = 2;
  const currentPlan = getCurrentPlan();
  const isFreeTier = currentPlan === 'free';
  const totalDocuments = documents.length;
  const canUploadMore = !isFreeTier || totalDocuments < FREE_TIER_LIMIT;

  // ─── Load Documents from DynamoDB ──────────────────────────────────────────
  useEffect(() => {
    async function loadDocs() {
      try {
        setLoading(true);
        const { data: docs } = await client.models.Document.list();
        const mapped: DocumentMeta[] = await Promise.all((docs || []).map(async (d) => ({
          id: d.id,
          name: await decryptField(d.name, masterPassword),
          originalName: await decryptField(d.originalName, masterPassword),
          category: d.category,
          notes: await decryptField(d.notes || '', masterPassword),
          mimeType: d.mimeType,
          size: d.size,
          s3Key: d.s3Key,
          iv: d.iv,
          salt: d.salt,
          createdAt: d.createdAt || undefined,
          updatedAt: d.updatedAt || undefined,
        })));
        setDocuments(mapped);
      } catch (err) {
        console.error('Failed to load documents:', err);
        setError('Failed to load documents from cloud. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ─── Upload Handler ──────────────────────────────────────────────────────
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (isFreeTier && totalDocuments >= FREE_TIER_LIMIT) {
      setShowUpgradePrompt(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > MAX_FILE_SIZE) {
          setError(`"${file.name}" exceeds 10MB limit. Skipped.`);
          continue;
        }

        // Check free tier limit for each file in batch
        if (isFreeTier && (totalDocuments + i) >= FREE_TIER_LIMIT) {
          setError(`Free tier limit reached. Remaining files skipped.`);
          break;
        }

        // 1. Encrypt the file client-side
        const arrayBuffer = await file.arrayBuffer();
        const encrypted = await encryptBinary(arrayBuffer, masterPassword);

        // 2. Upload encrypted blob to S3
        const docId = crypto.randomUUID();
        const s3Key = `documents/${docId}/${file.name}.enc`;

        await uploadData({
          path: s3Key,
          data: new Blob([encrypted.ciphertext]),
          options: {
            contentType: 'application/octet-stream',
          },
        }).result;

        // 3. Encrypt metadata fields
        const encName = await encryptField(file.name.replace(/\.[^/.]+$/, ''), masterPassword);
        const encOrigName = await encryptField(file.name, masterPassword);

        // 4. Save metadata to DynamoDB
        const { data: created } = await client.models.Document.create({
          name: encName,
          originalName: encOrigName,
          category: activeCategory,
          notes: '',
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          s3Key: s3Key,
          iv: encrypted.iv,
          salt: encrypted.salt,
        });

        if (created) {
          setDocuments(prev => [...prev, {
            id: created.id,
            name: file.name.replace(/\.[^/.]+$/, ''),
            originalName: file.name,
            category: created.category,
            notes: '',
            mimeType: created.mimeType,
            size: created.size,
            s3Key: created.s3Key,
            iv: created.iv,
            salt: created.salt,
            createdAt: created.createdAt || undefined,
            updatedAt: created.updatedAt || undefined,
          }]);
        }
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [activeCategory, masterPassword, isFreeTier, totalDocuments]);

  // ─── Preview Handler ─────────────────────────────────────────────────────
  const handlePreview = useCallback(async (doc: DocumentMeta) => {
    try {
      // Download encrypted blob from S3
      const result = await downloadData({ path: doc.s3Key }).result;
      const encBlob = await result.body.blob();
      const cipherBuffer = await encBlob.arrayBuffer();

      // Decrypt locally
      const decrypted = await decryptBinary(
        { ciphertext: cipherBuffer, iv: doc.iv, salt: doc.salt },
        masterPassword
      );

      const fileBlob = new Blob([decrypted], { type: doc.mimeType });
      const url = URL.createObjectURL(fileBlob);

      if (doc.mimeType === 'application/pdf') {
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else if (doc.mimeType.startsWith('image/')) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(url);
        setPreviewMime(doc.mimeType);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.originalName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch (err) {
      setError('Failed to download/decrypt file. Please try again.');
      console.error('Preview error:', err);
    }
  }, [masterPassword, previewUrl]);

  // ─── Download Handler ────────────────────────────────────────────────────
  const handleDownload = useCallback(async (doc: DocumentMeta) => {
    try {
      const result = await downloadData({ path: doc.s3Key }).result;
      const encBlob = await result.body.blob();
      const cipherBuffer = await encBlob.arrayBuffer();

      const decrypted = await decryptBinary(
        { ciphertext: cipherBuffer, iv: doc.iv, salt: doc.salt },
        masterPassword
      );

      const fileBlob = new Blob([decrypted], { type: doc.mimeType });
      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      setError('Download failed. Please try again.');
      console.error('Download error:', err);
    }
  }, [masterPassword]);

  // ─── Edit Handlers ───────────────────────────────────────────────────────
  const startEdit = (doc: DocumentMeta) => {
    setEditingId(doc.id);
    setEditName(doc.name);
    setEditNotes(doc.notes);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const newName = editName.trim() || documents.find(d => d.id === editingId)?.name || '';
      const encNewName = await encryptField(newName, masterPassword);
      const encNotes = await encryptField(editNotes, masterPassword);
      await client.models.Document.update({
        id: editingId,
        name: encNewName,
        notes: encNotes,
      });
      setDocuments(prev =>
        prev.map(d =>
          d.id === editingId ? { ...d, name: newName, notes: editNotes } : d
        )
      );
    } catch (err) {
      setError('Failed to save changes.');
      console.error('Edit error:', err);
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // ─── Delete Handler ──────────────────────────────────────────────────────
  const confirmDelete = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    try {
      // Delete from S3
      await remove({ path: doc.s3Key });
      // Delete from DynamoDB
      await client.models.Document.delete({ id });
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError('Failed to delete document.');
      console.error('Delete error:', err);
    }
    setDeleteConfirmId(null);
  };

  // ─── Filtering & Sorting ─────────────────────────────────────────────────
  const filteredDocuments = documents
    .filter(d => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.notes.toLowerCase().includes(q) ||
          d.originalName.toLowerCase().includes(q)
        );
      }
      return d.category === activeCategory;
    })
    .sort((a, b) => {
      if (sortMode === 'name') return a.name.localeCompare(b.name);
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  const getCategoryCount = (catId: string) => documents.filter(d => d.category === catId).length;
  const totalDocs = documents.length;
  const currentCategory = CATEGORIES.find(c => c.id === activeCategory)!;


  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading documents from cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-200">
      {/* Header */}
      <div className="border-b border-navy-700 bg-navy-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <FolderOpen className="w-5 h-5 text-navy-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">Document Vault</h1>
                <p className="text-xs text-slate-400">
                  {totalDocs} document{totalDocs !== 1 ? 's' : ''} • AES-256 encrypted •{' '}
                  <Cloud className="w-3 h-3 inline text-emerald-400" /> Cloud synced
                  {' • '}
                  <span className={isFreeTier ? 'text-amber-400' : 'text-emerald-400'}>
                    {isFreeTier ? `${totalDocuments}/${FREE_TIER_LIMIT} (Free)` : `Unlimited (${currentPlan === 'pro' ? 'Pro' : 'Family'})`}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden btn-outline px-3 py-2 text-sm"
              aria-label="Toggle categories"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search documents by name or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              aria-label="Search documents"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside
          className={`${mobileSidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-72 shrink-0 border-r border-navy-800 bg-navy-900/50 lg:min-h-[calc(100vh-8rem)]`}
          aria-label="Document categories"
        >
          <nav className="p-3 space-y-1">
            {CATEGORIES.map(cat => {
              const count = getCategoryCount(cat.id);
              const isActive = cat.id === activeCategory && !searchQuery;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchQuery('');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                    isActive
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                      : 'hover:bg-navy-800 text-slate-300 border border-transparent'
                  }`}
                  aria-label={`${cat.label} category, ${count} documents`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="flex-1 truncate">{cat.emoji} {cat.label}</span>
                  {count > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-amber-500/20 text-amber-300' : 'bg-navy-700 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Error Toast */}
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm" role="alert">
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} aria-label="Dismiss error">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Free Tier Limit Banner */}
          {isFreeTier && !canUploadMore && (
            <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 text-center mb-4">
              <p className="text-sm text-slate-300 mb-2">You have reached the free tier limit (2 documents)</p>
              <p className="text-xs text-slate-400 mb-3">Upgrade to Pro or Family for unlimited document storage</p>
              <button className="btn-gold text-sm px-4 py-2">Upgrade Plan</button>
            </div>
          )}

          {/* Upgrade Prompt Modal */}
          {showUpgradePrompt && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowUpgradePrompt(false)} role="dialog" aria-label="Upgrade prompt">
              <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Free Tier Limit Reached</h3>
                <p className="text-sm text-slate-300 mb-2">You have reached the limit of {FREE_TIER_LIMIT} documents.</p>
                <p className="text-xs text-slate-400 mb-4">Upgrade to Pro or Family for unlimited cloud document storage.</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setShowUpgradePrompt(false)} className="btn-outline px-4 py-2 text-sm">Maybe Later</button>
                  <button className="btn-gold px-4 py-2 text-sm">Upgrade Plan</button>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar */}
          {!searchQuery && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  {currentCategory.emoji} {currentCategory.label}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{currentCategory.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortMode(prev => prev === 'date' ? 'name' : 'date')}
                  className="btn-outline px-3 py-2 text-xs flex items-center gap-1.5"
                  aria-label={`Sort by ${sortMode === 'date' ? 'name' : 'date'}`}
                  title={`Sorted by ${sortMode === 'date' ? 'newest first' : 'name A-Z'}`}
                >
                  <SortAsc className="w-3.5 h-3.5" />
                  {sortMode === 'date' ? 'Date' : 'Name'}
                </button>

                <button
                  onClick={() => {
                    if (!canUploadMore) {
                      setShowUpgradePrompt(true);
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  disabled={uploading}
                  className="btn-gold px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                  aria-label={canUploadMore ? "Upload document" : "Upgrade to upload more"}
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  aria-hidden="true"
                />
              </div>
            </div>
          )}

          {/* Search Results Header */}
          {searchQuery && (
            <div className="mb-4">
              <p className="text-sm text-slate-400">
                {filteredDocuments.length} result{filteredDocuments.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
              </p>
            </div>
          )}

          {/* Document List */}
          {filteredDocuments.length === 0 ? (
            <EmptyState
              category={currentCategory}
              isSearch={!!searchQuery}
              onUpload={() => fileInputRef.current?.click()}
            />
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  isEditing={editingId === doc.id}
                  editName={editName}
                  editNotes={editNotes}
                  deleteConfirmId={deleteConfirmId}
                  onEditNameChange={setEditName}
                  onEditNotesChange={setEditNotes}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  onDeleteRequest={setDeleteConfirmId}
                  onDeleteConfirm={confirmDelete}
                  onDeleteCancel={() => setDeleteConfirmId(null)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Image Preview Modal */}
      {previewUrl && previewMime.startsWith('image/') && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
          role="dialog"
          aria-label="Image preview"
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
              className="absolute -top-3 -right-3 w-8 h-8 bg-navy-800 border border-navy-600 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-navy-700 z-10"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewUrl}
              alt="Document preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Sub-Components ──────────────────────────────────────────────────────────

function EmptyState({
  category,
  isSearch,
  onUpload,
}: {
  category: Category;
  isSearch: boolean;
  onUpload: () => void;
}) {
  if (isSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-300 mb-1">No results found</h3>
        <p className="text-sm text-slate-500">Try a different search term or check another category.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-navy-800 border-2 border-dashed border-navy-600 rounded-2xl flex items-center justify-center mb-5">
        <FolderOpen className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-lg font-medium text-slate-300 mb-2">
        No {category.label} documents yet
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-2">
        Store your important documents here with military-grade encryption.
      </p>
      <p className="text-xs text-slate-600 max-w-sm mb-6 italic">
        Examples: {category.examples}
      </p>
      <button
        onClick={onUpload}
        className="btn-gold px-5 py-2.5 text-sm flex items-center gap-2"
        aria-label={`Upload ${category.label} document`}
      >
        <Upload className="w-4 h-4" />
        Upload Your First Document
      </button>
    </div>
  );
}

function DocumentCard({
  doc,
  isEditing,
  editName,
  editNotes,
  deleteConfirmId,
  onEditNameChange,
  onEditNotesChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onPreview,
  onDownload,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  doc: DocumentMeta;
  isEditing: boolean;
  editName: string;
  editNotes: string;
  deleteConfirmId: string | null;
  onEditNameChange: (v: string) => void;
  onEditNotesChange: (v: string) => void;
  onStartEdit: (doc: DocumentMeta) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onPreview: (doc: DocumentMeta) => void;
  onDownload: (doc: DocumentMeta) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}) {
  const isDeleting = deleteConfirmId === doc.id;
  const canPreview = doc.mimeType.startsWith('image/') || doc.mimeType === 'application/pdf';

  return (
    <div className="card bg-navy-800/50 border border-navy-700 rounded-xl p-4 hover:border-navy-600 transition-all group">
      <div className="flex items-start gap-3">
        {/* File Type Icon */}
        <div className="w-10 h-10 bg-navy-700/50 rounded-lg flex items-center justify-center shrink-0 text-lg" aria-hidden="true">
          {getFileTypeIcon(doc.mimeType)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editName}
                onChange={e => onEditNameChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-navy-900 border border-navy-600 rounded-md text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="Document name"
                aria-label="Document name"
                autoFocus
              />
              <textarea
                value={editNotes}
                onChange={e => onEditNotesChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-navy-900 border border-navy-600 rounded-md text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                placeholder="Add notes (e.g., Locker #42, SBI Main Branch)"
                rows={2}
                aria-label="Document notes"
              />
              <div className="flex gap-2">
                <button onClick={onSaveEdit} className="btn-gold px-3 py-1 text-xs">Save</button>
                <button onClick={onCancelEdit} className="btn-outline px-3 py-1 text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-slate-200 truncate">{doc.name}</h4>
                <Cloud className="w-3 h-3 text-emerald-500 shrink-0" />
                {doc.originalName !== doc.name && (
                  <span className="text-xs text-slate-600 truncate hidden sm:inline">
                    ({doc.originalName})
                  </span>
                )}
              </div>
              {doc.notes && (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{doc.notes}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                <span>{formatFileSize(doc.size)}</span>
                <span>•</span>
                <span>{doc.createdAt ? formatDate(doc.createdAt) : 'Just now'}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline truncate">{doc.mimeType.split('/')[1]?.toUpperCase()}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
            {canPreview && (
              <button
                onClick={() => onPreview(doc)}
                className="p-2 hover:bg-navy-700 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                aria-label={`Preview ${doc.name}`}
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDownload(doc)}
              className="p-2 hover:bg-navy-700 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
              aria-label={`Download ${doc.name}`}
              title="Download (decrypted)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onStartEdit(doc)}
              className="p-2 hover:bg-navy-700 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
              aria-label={`Edit ${doc.name}`}
              title="Edit name & notes"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            {isDeleting ? (
              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={() => onDeleteConfirm(doc.id)}
                  className="px-2 py-1 bg-red-500/20 border border-red-500/40 rounded text-xs text-red-300 hover:bg-red-500/30"
                  aria-label="Confirm delete"
                >
                  Yes, delete
                </button>
                <button
                  onClick={onDeleteCancel}
                  className="px-2 py-1 bg-navy-700 rounded text-xs text-slate-400 hover:text-slate-200"
                  aria-label="Cancel delete"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => onDeleteRequest(doc.id)}
                className="p-2 hover:bg-navy-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                aria-label={`Delete ${doc.name}`}
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
