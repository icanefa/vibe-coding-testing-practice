import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminPage } from './AdminPage';
import { useAuth } from '../context/AuthContext';
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

describe('AdminPage', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            user: { role: 'admin', username: 'admin_user' },
            logout: mockLogout,
        });
    });

    const renderComponent = () => {
        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );
    };

    describe('前端元素', () => {
        it('初始畫面渲染', () => {
            renderComponent();

            expect(screen.getByRole('heading', { name: '🛠️ 管理後台' })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: '← 返回' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument();
            expect(screen.getByText('管理員專屬頁面')).toBeInTheDocument();
        });

        it('依據使用者角色顯示 Badge (管理員)', () => {
            renderComponent();
            const badge = screen.getByText('管理員');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveClass('role-badge', 'admin');
        });

        it('依據使用者角色顯示 Badge (一般用戶)', () => {
            // 模擬一般用戶 (雖然通常被路由擋下，但測試元件本身渲染邏輯)
            (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
                user: { role: 'user', username: 'normal_user' },
                logout: mockLogout,
            });
            renderComponent();

            const badge = screen.getByText('一般用戶');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveClass('role-badge', 'user');
        });
    });

    describe('邏輯流程', () => {
        it('點擊返回按鈕時導航至 Dashboard', () => {
            renderComponent();
            const backLink = screen.getByRole('link', { name: '← 返回' });
            // MemoryRouter 的 Link，可以驗證 href 屬性
            expect(backLink).toHaveAttribute('href', '/dashboard');
        });

        it('點擊登出按鈕時呼叫 logout 並導航至 Login', () => {
            renderComponent();
            const logoutButton = screen.getByRole('button', { name: '登出' });

            fireEvent.click(logoutButton);

            expect(mockLogout).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });
});
