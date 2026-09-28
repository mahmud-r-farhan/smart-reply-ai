#pragma once
#include <windows.h>
#include <shellapi.h>
#include <string>

namespace SmartReply {

class TrayManager {
public:
    TrayManager(HWND hWnd, UINT uCallbackMsg, UINT uId);
    ~TrayManager();

    bool Create(const std::string& tooltip);
    bool Remove();
    void ShowNotification(const std::string& title, const std::string& message);
    void ShowContextMenu(HWND hWnd);

private:
    NOTIFYICONDATAA m_nid;
    HWND m_hWnd;
    bool m_isCreated{ false };
};

} // namespace SmartReply
