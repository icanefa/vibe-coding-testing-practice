import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
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

describe('LoginPage', () => {
    const mockLogin = vi.fn();
    const mockClearAuthExpiredMessage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            authExpiredMessage: '',
            clearAuthExpiredMessage: mockClearAuthExpiredMessage,
        });
    });

    const renderComponent = () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );
    };

    describe('前端元素', () => {
        it('初始畫面渲染', () => {
            renderComponent();
            expect(screen.getByLabelText('電子郵件')).toBeInTheDocument();
            expect(screen.getByLabelText('密碼')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
        });
    });

    describe('輸入驗證', () => {
        it('Email格式不正確時顯示錯誤訊息', () => {
            renderComponent();
            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitButton = screen.getByRole('button', { name: '登入' });

            fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
            fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } });
            fireEvent.click(submitButton);

            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('密碼長度不足8碼時顯示錯誤訊息', () => {
            renderComponent();
            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitButton = screen.getByRole('button', { name: '登入' });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'abc1234' } });
            fireEvent.click(submitButton);

            expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('密碼缺乏英文字母或數字時顯示錯誤訊息', () => {
            renderComponent();
            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitButton = screen.getByRole('button', { name: '登入' });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: '12345678' } });
            fireEvent.click(submitButton);

            expect(screen.getByText('密碼必須包含ddddd英文字母和數字')).toBeInTheDocument();

            fireEvent.change(passwordInput, { target: { value: 'abcdefgh' } });
            fireEvent.click(submitButton);
            expect(screen.getByText('密碼必須包含英文字母和數字')).toBeInTheDocument();

            expect(mockLogin).not.toHaveBeenCalled();
        });
    });

    describe('邏輯流程', () => {
        it('表單驗證失敗時，不應呼叫 login API', () => {
            renderComponent();
            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitButton = screen.getByRole('button', { name: '登入' });

            fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
            fireEvent.change(passwordInput, { target: { value: '123' } });
            fireEvent.click(submitButton);

            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
            expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();

            expect(submitButton).not.toBeDisabled();
        });

        it('登入中狀態顯示', () => {
            renderComponent();

            mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitButton = screen.getByRole('button', { name: '登入' });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } });
            fireEvent.click(submitButton);

            expect(submitButton).toHaveTextContent(/登入中/);
            expect(submitButton).toBeDisabled();
            expect(emailInput).toBeDisabled();
            expect(passwordInput).toBeDisabled();
        });
    });

    describe('Mock API', () => {
        it('登入成功後導航至 Dashboard', async () => {
            renderComponent();
            mockLogin.mockResolvedValue(undefined);

            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitButton = screen.getByRole('button', { name: '登入' });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
            });
        });

        it('登入失敗時顯示 API 錯誤訊息', async () => {
            renderComponent();

            const errorMessage = '登入失敗，請稍後再試';
            const mockAxiosError = {
                isAxiosError: true,
                response: {
                    data: { message: errorMessage },
                },
            };
            mockLogin.mockRejectedValue(mockAxiosError);

            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitButton = screen.getByRole('button', { name: '登入' });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
            });
        });
    });

    describe('狀態處理', () => {
        it('已登入用戶直接導航', () => {
            (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
                login: mockLogin,
                isAuthenticated: true,
                authExpiredMessage: '',
                clearAuthExpiredMessage: mockClearAuthExpiredMessage,
            });

            renderComponent();
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });

        it('處理憑證過期訊息', () => {
            (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
                login: mockLogin,
                isAuthenticated: false,
                authExpiredMessage: '登入已過期',
                clearAuthExpiredMessage: mockClearAuthExpiredMessage,
            });

            renderComponent();
            expect(screen.getByRole('alert')).toHaveTextContent('登入已過期');
            expect(mockClearAuthExpiredMessage).toHaveBeenCalled();
        });
    });
});
