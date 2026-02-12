import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, Trash2, ExternalLink, Loader2, File, Plus, Link as LinkIcon } from 'lucide-react';
import { saveFile, getFiles, deleteFile } from '../lib/storage';
import { supabase } from '../lib/supabase';

const SubjectResources = ({ subjectId, topicId = null, materials = [], addMaterial, deleteMaterial }) => {
    const [localFiles, setLocalFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkForm, setLinkForm] = useState({ title: '', url: '' });
    const [itemToDelete, setItemToDelete] = useState(null);

    // Load local files from IndexedDB
    useEffect(() => {
        loadLocalFiles();
    }, [subjectId, topicId]);

    const loadLocalFiles = async () => {
        try {
            setLoading(true);
            const files = await getFiles(subjectId, topicId);
            setLocalFiles(files);
        } catch (error) {
            console.error("Failed to load local files:", error);
        } finally {
            setLoading(false);
        }
    };

    // Combine local files and synced materials
    // This part is removed from the rendering logic in the new structure,
    // but kept here if other parts of the component still rely on it.
    // const displayItems = [
    //     ...localFiles.map(f => ({ ...f, source: 'local' })),
    //     ...materials.filter(m => m.subject_id === subjectId && (topicId ? m.topic_id === topicId : !m.topic_id)).map(m => ({ ...m, source: 'cloud', name: m.title, createdAt: m.updated_at }))
    // ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.includes('pdf') && !file.type.includes('image')) {
            alert('Por favor, envie apenas arquivos PDF ou imagens.');
            return;
        }

        setUploading(true);
        try {
            // 1. Get User ID (needed for path)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // 2. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${subjectId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('materials')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('materials')
                .getPublicUrl(filePath);

            // 4. Save Metadata to Database
            if (addMaterial) {
                await addMaterial({
                    title: file.name,
                    subject_id: subjectId,
                    topic_id: topicId,
                    file_url: publicUrl,
                    type: file.type.includes('pdf') ? 'pdf' : 'image'
                });
            }

            // Optional: Save to local for offline fallback (omitted to avoid duplicates for now)
            // await saveFile(file, subjectId, topicId); 
            // await loadLocalFiles(); 
        } catch (error) {
            console.error("Failed to upload file:", error);
            alert('Erro ao salvar arquivo: ' + error.message);
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const handleLinkSubmit = async (e) => {
        e.preventDefault();
        if (!linkForm.title || !linkForm.url) return;

        try {
            if (addMaterial) {
                await addMaterial({
                    title: linkForm.title,
                    subject_id: subjectId,
                    topic_id: topicId,
                    file_url: linkForm.url,
                    type: 'link'
                });
            }
            setShowLinkModal(false);
            setLinkForm({ title: '', url: '' });
        } catch (error) {
            console.error("Failed to add link:", error);
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        const item = itemToDelete;
        setItemToDelete(null); // Close modal

        try {
            if (item.source === 'local') {

                await deleteFile(item.id);
                await loadLocalFiles();
            } else {

                if (deleteMaterial) {
                    await deleteMaterial(item.id);
                } else {
                    console.error("deleteMaterial function is missing!");
                }
            }
        } catch (error) {
            console.error("Failed to delete item:", error);
        }
    };

    const handleDelete = (item) => {
        setItemToDelete(item);
    };

    const handleOpen = (item) => {
        if (item.source === 'local') {
            const url = URL.createObjectURL(item.data);
            window.open(url, '_blank');
        } else {
            window.open(item.file_url, '_blank');
        }
    };

    // const getFileIcon = (item) => { // This function is no longer used in the new rendering logic
    //     if (item.source === 'local' && item.type.includes('image')) {
    //         return URL.createObjectURL(item.data);
    //     }
    //     return null;
    // };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <FileText className="text-blue-600 dark:text-blue-400" size={20} />
                        Materiais de Estudo
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Gerencie seus PDFs, imagens e links
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowLinkModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
                    >
                        <LinkIcon size={16} />
                        Link
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer font-medium text-sm shadow-lg shadow-blue-500/20">
                        <Upload size={16} />
                        Arquivo
                        <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                    <Loader2 className="animate-spin" />
                    <span className="font-medium">Enviando arquivo para a nuvem...</span>
                </div>
            )}

            {/* Materials Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Cloud Materials */}
                    {materials.filter(m => m.subject_id === subjectId && (!topicId || m.topic_id === topicId)).map((item) => (
                        <div key={item.id} className="group relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-700">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpen(item)}
                                    className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm hover:text-blue-600 dark:hover:text-blue-400"
                                    title="Abrir"
                                >
                                    <ExternalLink size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item)}
                                    className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm hover:text-red-600 dark:hover:text-red-400"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex flex-col h-full justify-between">
                                <div className="flex items-center justify-center h-24 bg-white dark:bg-slate-800 rounded-xl mb-4">
                                    {item.type === 'pdf' ? (
                                        <FileText size={40} className="text-red-500" />
                                    ) : item.type === 'link' ? (
                                        <LinkIcon size={40} className="text-blue-500" />
                                    ) : (
                                        <ImageIcon size={40} className="text-blue-500" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm line-clamp-2 mb-1" title={item.title}>
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span>Nuvem</span>
                                        <span>•</span>
                                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Local Files (Legacy) */}
                    {localFiles.map((file) => (
                        <div key={file.id} className="group relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-md transition-all hover:border-orange-300 dark:hover:border-orange-700">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpen({ ...file, source: 'local' })}
                                    className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm hover:text-blue-600 dark:hover:text-blue-400"
                                    title="Abrir"
                                >
                                    <ExternalLink size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete({ ...file, source: 'local' })}
                                    className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm hover:text-red-600 dark:hover:text-red-400"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex flex-col h-full justify-between">
                                <div className="flex items-center justify-center h-24 bg-white dark:bg-slate-800 rounded-xl mb-4">
                                    <FileText size={40} className="text-orange-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm line-clamp-2 mb-1" title={file.name}>
                                        {file.name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="text-orange-500">Local</span>
                                        <span>•</span>
                                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {materials.filter(m => m.subject_id === subjectId && (!topicId || m.topic_id === topicId)).length === 0 && localFiles.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <File className="text-slate-300 dark:text-slate-600" size={32} />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum material encontrado</p>
                            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Faça upload de PDFs ou imagens para estudar</p>
                        </div>
                    )}
                </div>
            )}

            {/* Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Adicionar Link</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                                <input
                                    type="text"
                                    value={linkForm.title}
                                    onChange={e => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Artigo sobre Dolo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL</label>
                                <input
                                    type="url"
                                    value={linkForm.url}
                                    onChange={e => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleLinkSubmit}
                                disabled={!linkForm.title || !linkForm.url}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Salvar Link
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {itemToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Excluir Material?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                Você tem certeza que deseja excluir "{itemToDelete.title || itemToDelete.name}"? Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setItemToDelete(null)}
                                className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectResources;
