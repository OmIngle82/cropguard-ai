import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logError } from '../services/monitoring';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        logError(error, { componentStack: errorInfo.componentStack });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    private handleHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={40} className="text-red-500" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Something went wrong</h2>
                            <p className="text-gray-500 font-medium">
                                We prefer healthy crops, not broken apps. The application encountered an unexpected error.
                            </p>
                        </div>

                        {this.state.error && (
                            <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-left overflow-hidden">
                                <p className="text-xs text-red-800 font-mono break-words">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <button
                                onClick={this.handleHome}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                <Home size={18} />
                                Home
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30"
                            >
                                <RefreshCw size={18} />
                                Reload
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
