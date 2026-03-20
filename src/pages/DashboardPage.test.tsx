import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { useAuth } from '../context/AuthContext';
import { productApi } from '../api/productApi';
import '@testing-library/jest-dom';

// 建立 mockNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock productApi
vi.mock('../api/productApi', () => ({
    productApi: {
        getProducts: vi.fn(),
    },
}));

describe('DashboardPage', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // 預設為一般用戶
        (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            user: { role: 'user', username: 'NormalUser' },
            logout: mockLogout,
        });

        // 預設 API 回傳空陣列
        (productApi.getProducts as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    });

    const renderComponent = () => {
        render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>
        );
    };

    describe('前端元素', () => {
        it('初始畫面渲染', async () => {
            renderComponent();

            expect(screen.getByRole('heading', { name: '儀表板' })).toBeInTheDocument();
            expect(screen.getByText('Welcome, NormalUser 👋')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument();
        });

        it('管理員權限顯示', async () => {
            (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
                user: { role: 'admin', username: 'AdminUser' },
                logout: mockLogout,
            });

            renderComponent();

            expect(screen.getByRole('link', { name: '🛠️ 管理後台' })).toBeInTheDocument();
            const badge = screen.getByText('管理員');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveClass('role-badge', 'admin');
        });

        it('一般用戶權限顯示', async () => {
            renderComponent();

            expect(screen.queryByRole('link', { name: '🛠️ 管理後台' })).not.toBeInTheDocument();
            const badge = screen.getByText('一般用戶');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveClass('role-badge', 'user');
        });
    });

    describe('邏輯流程', () => {
        it('點擊登出按鈕時呼叫 logout 並導航至 Login', async () => {
            renderComponent();
            const logoutButton = screen.getByRole('button', { name: '登出' });

            fireEvent.click(logoutButton);

            expect(mockLogout).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });

    describe('狀態處理與 Mock API', () => {
        it('初始載入時顯示 Loading 狀態', () => {
            // 讓 API 承諾暫不 resolving，以便測試 loading 狀態
            (productApi.getProducts as ReturnType<typeof vi.fn>).mockImplementation(
                () => new Promise(() => {}) // never resolves
            );

            renderComponent();
            expect(screen.getByText('載入商品中...')).toBeInTheDocument();
        });

        it('成功取得商品列表', async () => {
            const mockProducts = [
                { id: 1, name: '測試商品1', description: '描述1', price: 100 },
                { id: 2, name: '測試商品2', description: '描述2', price: 200 },
            ];
            (productApi.getProducts as ReturnType<typeof vi.fn>).mockResolvedValue(mockProducts);

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('測試商品1')).toBeInTheDocument();
            });

            expect(screen.getByText('描述1')).toBeInTheDocument();
            expect(screen.getByText('NT$ 100')).toBeInTheDocument();
            expect(screen.getByText('測試商品2')).toBeInTheDocument();
            expect(screen.getByText('描述2')).toBeInTheDocument();
            expect(screen.getByText('NT$ 200')).toBeInTheDocument();
        });

        it('取得商品列表失敗時顯示錯誤訊息', async () => {
            const mockAxiosError = {
                isAxiosError: true,
                response: {
                    status: 500,
                    data: { message: '伺服器嚴重錯誤' },
                },
            };
            (productApi.getProducts as ReturnType<typeof vi.fn>).mockRejectedValue(mockAxiosError);

            renderComponent();

            await waitFor(() => {
                expect(screen.getByText('伺服器嚴重錯誤')).toBeInTheDocument();
            });
        });

        it('取得商品列表發生 401 錯誤時不顯示頁面錯誤', async () => {
            const mockAxiosError = {
                isAxiosError: true,
                response: {
                    status: 401,
                    data: { message: 'Unauthorized' },
                },
            };
            (productApi.getProducts as ReturnType<typeof vi.fn>).mockRejectedValue(mockAxiosError);

            renderComponent();

            await waitFor(() => {
                // 不會有 '載入商品中...' 的訊息
                expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            });
            // 錯誤訊息區塊不應存在或是顯示預設文字
            expect(screen.queryByText('Unauthorized')).not.toBeInTheDocument();
            expect(screen.queryByText('無法載入商品資料')).not.toBeInTheDocument();
            // 確認 products 仍是空
            expect(screen.queryByText('測試商品1')).not.toBeInTheDocument();
        });
    });
});
