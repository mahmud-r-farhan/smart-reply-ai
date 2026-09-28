#pragma once
#include <windows.h>
#include <vector>
#include <string>
#include <functional>
#include "app_config.h"

namespace SmartReply {

class FloatingWindow {
public:
    using OnSelectCallback = std::function<void(const Suggestion&)>;

    FloatingWindow(HINSTANCE hInstance, OnSelectCallback callback);
    ~FloatingWindow();

    bool Initialize();
    void Show(const std::vector<Suggestion>& suggestions, const POINT& cursorPt);
    void Hide();
    bool IsVisible() const;

    HWND GetHwnd() const { return m_hWnd; }

private:
    static LRESULT CALLBACK WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);
    void OnPaint(HDC hdc);
    void OnClick(int x, int y);

    HINSTANCE m_hInstance;
    HWND m_hWnd{ nullptr };
    std::vector<Suggestion> m_suggestions;
    OnSelectCallback m_callback;
    int m_hoveredIndex{ -1 };
    HFONT m_hFontTitle{ nullptr };
    HFONT m_hFontBody{ nullptr };
    HFONT m_hFontBadge{ nullptr };
};

} // namespace SmartReply
