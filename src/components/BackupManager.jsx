import React, { useState } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle2, Loader2, Database, LogIn, LogOut, User } from 'lucide-react';
import { exportData, downloadBackup, importData } from '../lib/backup';
import { useAuth } from '../contexts/AuthContext';

const BackupManager = ({ onClose }) => {
    const { user, signInWithEmail, signUpWithEmail, signOut, loading } = useAuth();
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

    // Form State
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setMessage(null);

        try {
            if (isLogin) {
                await signInWithEmail(email, password);
            } else {
                const data = await signUpWithEmail(email, password);
                if (data?.user && !data?.session) {
                    setMessage({ type: 'success', text: 'Conta criada! Mas atenção: O Supabase exige que você confirme seu email antes de entrar.' });
                    setIsLogin(true); // Switch to login mode
                    return;
                }
                setMessage({ type: 'success', text: 'Conta criada com sucesso!' });
            }
        } catch (error) {
            console.error(error);
            let msg = error.message || 'Erro na autenticação.';
            if (msg.includes('Invalid login credentials')) msg = 'Email ou senha incorretos.';
            if (msg.includes('Email not confirmed')) msg = 'Verifique seu email para confirmar o cadastro.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            setEmail('');
            setPassword('');
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Erro ao sair.' });
        }
    };

    const handleExport = () => {
        try {
            const data = exportData();
            downloadBackup(data);
            setMessage({ type: 'success', text: 'Backup baixado com sucesso!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao criar backup.' });
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.confirm('ATENÇÃO: Restaurar um backup irá substituir TODOS os seus dados atuais (Notas, Progresso, XP). Deseja continuar?')) {
            event.target.value = ''; // Reset input
            return;
        }

        setImporting(true);
        setMessage(null);

        try {
            await importData(file);
            setMessage({ type: 'success', text: 'Dados restaurados com sucesso! Recarregando...' });
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Erro ao restaurar: Arquivo inválido.' });
            setImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Database size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Sincronização & Backup</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Cloud Sync Section */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                            <User size={18} className="text-indigo-500" />
                            Conta Supabase
                        </h4>

                        {loading ? (
                            <div className="flex items-center gap-2 text-slate-500">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-sm">Verificando conexão...</span>
                            </div>
                        ) : user ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                                        {user.email[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.email}</p>
                                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            Conectado
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <LogOut size={14} />
                                    Sair da conta
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleAuth} className="space-y-3">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                    {isLogin ? 'Entre para sincronizar seus dados.' : 'Crie uma conta para salvar na nuvem.'}
                                </p>

                                <input
                                    type="email"
                                    placeholder="Seu email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Sua senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                    minLength={6}
                                />

                                <button
                                    type="submit"
                                    disabled={authLoading}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {authLoading ? <Loader2 size={18} className="animate-spin" /> : (isLogin ? <LogIn size={18} /> : <User size={18} />)}
                                    {isLogin ? 'Entrar' : 'Criar Conta'}
                                </button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Local Backup Section */}
                    <div className="space-y-3 opacity-75 hover:opacity-100 transition-opacity">
                        <h4 className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm">
                            <Download size={14} />
                            Backup Local (Arquivo)
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleExport}
                                className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={14} />
                                Baixar
                            </button>
                            <label className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2">
                                {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                <span>{importing ? '...' : 'Restaurar'}</span>
                                <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={handleImport}
                                    disabled={importing}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => {
                                if (window.confirm('TEM CERTEZA? Isso apagará TODO o seu progresso, notas e histórico para sempre.')) {
                                    if (window.resetAppData) {
                                        window.resetAppData();
                                    } else {
                                        alert('Função de reset não encontrada. Recarregue a página.');
                                    }
                                }
                            }}
                            className="w-full py-2 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <AlertTriangle size={14} />
                            Resetar Todos os Dados (Começar do Zero)
                        </button>
                    </div>

                    {/* Feedback Message */}
                    {message && (
                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in ${message.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BackupManager;
