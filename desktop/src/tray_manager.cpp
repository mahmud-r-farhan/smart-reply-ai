#include "../include/tray_manager.h"
#include <iostream>

namespace SmartReply {

TrayManager::TrayManager(HWND hWnd, UINT uCallbackMsg, UINT uId)
    : m_hWnd(hWnd) {
    memset(&m_nid, 0, sizeof(m_nid));
    m_nid.cbSize = sizeof(NOTIFYICONDATAA);
    m_nid.hWnd = hWnd;
    m_nid.uID = uId;
    m_nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
    m_nid.uCallbackMessage = uCallbackMsg;
    m_nid.hIcon = LoadIcon(nullptr, IDI_APPLICATION);
}

TrayManager::~TrayManager() {
    Remove();
}

bool TrayManager::Create(const std::string& tooltip) {
    if (m_isCreated) return true;

    strncpy_s(m_nid.szTip, tooltip.c_str(), sizeof(m_nid.szTip) - 1);
    m_isCreated = (Shell_NotifyIconA(NIM_ADD, &m_nid) == TRUE);
    return m_isCreated;
}

bool TrayManager::Remove() {
    if (!m_isCreated) return false;
    BOOL res = Shell_NotifyIconA(NIM_DELETE, &m_nid);
    m_isCreated = false;
    return (res == TRUE);
}

void TrayManager::ShowNotification(const std::string& title, const std::string& message) {
    if (!m_isCreated) return;

    m_nid.uFlags |= NIF_INFO;
    strncpy_s(m_nid.szInfoTitle, title.c_str(), sizeof(m_nid.szInfoTitle) - 1);
    strncpy_s(m_nid.szInfo, message.c_str(), sizeof(m_nid.szInfo) - 1);
    m_nid.dwInfoFlags = NIIF_INFO;

    Shell_NotifyIconA(NIM_MODIFY, &m_nid);
}

void TrayManager::ShowContextMenu(HWND hWnd) {
    POINT pt;
    GetCursorPos(&pt);
    HMENU hMenu = CreatePopupMenu();

    AppendMenuA(hMenu, MF_STRING, 1001, "Smart Reply AI (Ctrl + Shift + R)");
    AppendMenuA(hMenu, MF_SEPARATOR, 0, nullptr);
    AppendMenuA(hMenu, MF_STRING, 1002, "Mode: Hybrid Race (⚡)");
    AppendMenuA(hMenu, MF_STRING, 1003, "Mode: On-Device Heuristics (🔒)");
    AppendMenuA(hMenu, MF_STRING, 1004, "Mode: Cloud LLM (☁️)");
    AppendMenuA(hMenu, MF_SEPARATOR, 0, nullptr);
    AppendMenuA(hMenu, MF_STRING, 1099, "Exit Smart Reply");

    SetForegroundWindow(hWnd);
    TrackPopupMenu(hMenu, TPM_RIGHTBUTTON, pt.x, pt.y, 0, hWnd, nullptr);
    DestroyMenu(hMenu);
}

} // namespace SmartReply
