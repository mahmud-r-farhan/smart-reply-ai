#include "floating_window.h"
#include <windowsx.h>

namespace SmartReply {

const char* WINDOW_CLASS_NAME = "SmartReplyFloatingOverlay";
const int CARD_HEIGHT = 58;
const int PADDING = 12;
const int WINDOW_WIDTH = 420;

FloatingWindow::FloatingWindow(HINSTANCE hInstance, OnSelectCallback callback)
    : m_hInstance(hInstance), m_callback(callback) {
    m_hFontTitle = CreateFontA(15, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Segoe UI");
    m_hFontBody = CreateFontA(14, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Segoe UI");
    m_hFontBadge = CreateFontA(11, 0, 0, 0, FW_SEMIBOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Segoe UI");
}

FloatingWindow::~FloatingWindow() {
    if (m_hWnd) DestroyWindow(m_hWnd);
    if (m_hFontTitle) DeleteObject(m_hFontTitle);
    if (m_hFontBody) DeleteObject(m_hFontBody);
    if (m_hFontBadge) DeleteObject(m_hFontBadge);
}

bool FloatingWindow::Initialize() {
    WNDCLASSEXA wc = {};
    wc.cbSize = sizeof(WNDCLASSEXA);
    wc.lpfnWndProc = FloatingWindow::WndProc;
    wc.hInstance = m_hInstance;
    wc.lpszClassName = WINDOW_CLASS_NAME;
    wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);

    RegisterClassExA(&wc);

    m_hWnd = CreateWindowExA(
        WS_EX_TOPMOST | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE,
        WINDOW_CLASS_NAME,
        "Smart Reply Suggestions",
        WS_POPUP | WS_BORDER,
        0, 0, WINDOW_WIDTH, 200,
        nullptr, nullptr, m_hInstance, this
    );

    return (m_hWnd != nullptr);
}

LRESULT CALLBACK FloatingWindow::WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    FloatingWindow* pThis = nullptr;
    if (msg == WM_NCCREATE) {
        CREATESTRUCTA* pCreate = reinterpret_cast<CREATESTRUCTA*>(lParam);
        pThis = reinterpret_cast<FloatingWindow*>(pCreate->lpCreateParams);
        SetWindowLongPtr(hWnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(pThis));
    } else {
        pThis = reinterpret_cast<FloatingWindow*>(GetWindowLongPtr(hWnd, GWLP_USERDATA));
    }

    if (!pThis) return DefWindowProcA(hWnd, msg, wParam, lParam);

    switch (msg) {
        case WM_PAINT: {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hWnd, &ps);
            pThis->OnPaint(hdc);
            EndPaint(hWnd, &ps);
            return 0;
        }
        case WM_MOUSEMOVE: {
            int y = GET_Y_LPARAM(lParam);
            int newHover = -1;
            int startY = 38;
            for (size_t i = 0; i < pThis->m_suggestions.size(); ++i) {
                if (y >= startY && y < startY + CARD_HEIGHT) {
                    newHover = static_cast<int>(i);
                    break;
                }
                startY += CARD_HEIGHT + 6;
            }
            if (newHover != pThis->m_hoveredIndex) {
                pThis->m_hoveredIndex = newHover;
                InvalidateRect(hWnd, nullptr, FALSE);
            }
            return 0;
        }
        case WM_LBUTTONDOWN: {
            int x = GET_X_LPARAM(lParam);
            int y = GET_Y_LPARAM(lParam);
            pThis->OnClick(x, y);
            return 0;
        }
        case WM_KILLFOCUS: {
            pThis->Hide();
            return 0;
        }
    }

    return DefWindowProcA(hWnd, msg, wParam, lParam);
}

void FloatingWindow::Show(const std::vector<Suggestion>& suggestions, const POINT& cursorPt) {
    m_suggestions = suggestions;
    m_hoveredIndex = -1;

    int totalHeight = 44 + static_cast<int>(suggestions.size()) * (CARD_HEIGHT + 6) + 12;

    // Position window near cursor, ensuring it stays on-screen
    int posX = cursorPt.x + 12;
    int posY = cursorPt.y + 12;

    RECT workArea;
    SystemParametersInfoA(SPI_GETWORKAREA, 0, &workArea, 0);

    if (posX + WINDOW_WIDTH > workArea.right) {
        posX = workArea.right - WINDOW_WIDTH - 12;
    }
    if (posY + totalHeight > workArea.bottom) {
        posY = cursorPt.y - totalHeight - 12;
    }

    SetWindowPos(m_hWnd, HWND_TOPMOST, posX, posY, WINDOW_WIDTH, totalHeight, SWP_SHOWWINDOW | SWP_NOACTIVATE);
    InvalidateRect(m_hWnd, nullptr, TRUE);
}

void FloatingWindow::Hide() {
    ShowWindow(m_hWnd, SW_HIDE);
}

bool FloatingWindow::IsVisible() const {
    return IsWindowVisible(m_hWnd) == TRUE;
}

void FloatingWindow::OnClick(int x, int y) {
    int startY = 38;
    for (size_t i = 0; i < m_suggestions.size(); ++i) {
        if (y >= startY && y < startY + CARD_HEIGHT) {
            Suggestion chosen = m_suggestions[i];
            Hide();
            if (m_callback) {
                m_callback(chosen);
            }
            return;
        }
        startY += CARD_HEIGHT + 6;
    }
}

void FloatingWindow::OnPaint(HDC hdc) {
    RECT clientRect;
    GetClientRect(m_hWnd, &clientRect);

    // Double buffer
    HDC memDC = CreateCompatibleDC(hdc);
    HBITMAP memBitmap = CreateCompatibleBitmap(hdc, clientRect.right, clientRect.bottom);
    HBITMAP oldBitmap = (HBITMAP)SelectObject(memDC, memBitmap);

    // Dark sleek background (0x0F172A)
    HBRUSH bgBrush = CreateSolidBrush(RGB(15, 23, 42));
    FillRect(memDC, &clientRect, bgBrush);
    DeleteObject(bgBrush);

    // Top Header text
    SelectObject(memDC, m_hFontTitle);
    SetTextColor(memDC, RGB(248, 250, 252));
    SetBkMode(memDC, TRANSPARENT);
    TextOutA(memDC, PADDING, 10, "Smart Reply AI Suggestions", 26);

    // Header badge (Zero Latency / Cloud)
    if (!m_suggestions.empty()) {
        SelectObject(memDC, m_hFontBadge);
        std::string badgeText = (m_suggestions[0].source == "heuristic") ? "⚡ On-Device" : "☁️ Cloud LLM";
        SetTextColor(memDC, (m_suggestions[0].source == "heuristic") ? RGB(16, 185, 129) : RGB(99, 102, 241));
        TextOutA(memDC, WINDOW_WIDTH - 110, 12, badgeText.c_str(), static_cast<int>(badgeText.length()));
    }

    // Render suggestion cards
    int startY = 38;
    for (size_t i = 0; i < m_suggestions.size(); ++i) {
        bool isHovered = (static_cast<int>(i) == m_hoveredIndex);
        RECT cardRect = { PADDING, startY, WINDOW_WIDTH - PADDING, startY + CARD_HEIGHT };

        // Card background (RGB 30, 41, 59 or hover RGB 51, 65, 85)
        COLORREF cardColor = isHovered ? RGB(51, 65, 85) : RGB(30, 41, 59);
        HBRUSH cardBrush = CreateSolidBrush(cardColor);
        HBRUSH oldBrush = (HBRUSH)SelectObject(memDC, cardBrush);
        HPEN cardPen = CreatePen(PS_SOLID, 1, isHovered ? RGB(99, 102, 241) : RGB(71, 85, 105));
        HPEN oldPen = (HPEN)SelectObject(memDC, cardPen);

        RoundRect(memDC, cardRect.left, cardRect.top, cardRect.right, cardRect.bottom, 10, 10);

        SelectObject(memDC, oldBrush);
        SelectObject(memDC, oldPen);
        DeleteObject(cardBrush);
        DeleteObject(cardPen);

        // Index pill "#1"
        SelectObject(memDC, m_hFontBadge);
        SetTextColor(memDC, RGB(148, 163, 184));
        std::string num = std::to_string(i + 1) + ".";
        TextOutA(memDC, cardRect.left + 10, cardRect.top + 8, num.c_str(), static_cast<int>(num.length()));

        // Suggestion text
        SelectObject(memDC, m_hFontBody);
        SetTextColor(memDC, RGB(241, 245, 249));

        RECT textRect = { cardRect.left + 30, cardRect.top + 6, cardRect.right - 10, cardRect.bottom - 6 };
        DrawTextA(memDC, m_suggestions[i].text.c_str(), -1, &textRect, DT_WORDBREAK | DT_LEFT | DT_NOPREFIX);

        startY += CARD_HEIGHT + 6;
    }

    // Blit to screen
    BitBlt(hdc, 0, 0, clientRect.right, clientRect.bottom, memDC, 0, 0, SRCCOPY);

    SelectObject(memDC, oldBitmap);
    DeleteObject(memBitmap);
    DeleteDC(memDC);
}

} // namespace SmartReply
