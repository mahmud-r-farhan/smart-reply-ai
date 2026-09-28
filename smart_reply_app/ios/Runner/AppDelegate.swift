import Flutter
import UIKit
import UserNotifications
import WatchConnectivity

@main
@objc class AppDelegate: FlutterAppDelegate, UNUserNotificationCenterDelegate, WCSessionDelegate {
  
  private var methodChannel: FlutterMethodChannel?
  private static let channelName = "com.smartreply.smart_reply_app/watch_bridge"
  private static let categoryIdentifier = "SMART_REPLY_CATEGORY"
  
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    
    // Set notification center delegate for Apple Watch & iOS banner handling
    UNUserNotificationCenter.current().delegate = self
    
    // Setup WatchConnectivity for paired Apple Watch session
    setupWatchConnectivity()
    
    // Setup Flutter MethodChannel
    if let controller = window?.rootViewController as? FlutterViewController {
      setupMethodChannel(controller: controller)
    }
    
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  // MARK: - WatchConnectivity Setup
  private func setupWatchConnectivity() {
    if WCSession.isSupported() {
      let session = WCSession.default
      session.delegate = self
      session.activate()
    }
  }
  
  // MARK: - Method Channel Setup
  private func setupMethodChannel(controller: FlutterViewController) {
    let channel = FlutterMethodChannel(name: AppDelegate.channelName, binaryMessenger: controller.binaryMessenger)
    self.methodChannel = channel
    
    channel.setMethodCallHandler { [weak self] (call: FlutterMethodCall, result: @escaping FlutterResult) in
      guard let self = self else { return }
      
      switch call.method {
      case "postWatchNotification":
        guard let args = call.arguments as? [String: Any] else {
          result(FlutterError(code: "INVALID_ARGS", message: "Arguments must be a dictionary", details: nil))
          return
        }
        let sender = args["sender"] as? String ?? "Smart Reply AI"
        let message = args["message"] as? String ?? ""
        let replies = args["replies"] as? [String] ?? ["Yes, sounds good!", "I'll check into this.", "Talk soon!"]
        
        self.postAppleWatchNotification(sender: sender, message: message, replies: replies) { success in
          result(success)
        }
        
      case "isNotificationListenerEnabled":
        UNUserNotificationCenter.current().getNotificationSettings { settings in
          DispatchQueue.main.async {
            let isEnabled = settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional
            result(isEnabled)
          }
        }
        
      case "openNotificationListenerSettings":
        DispatchQueue.main.async {
          if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
          }
          result(true)
        }
        
      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }
  
  // MARK: - Post Notification with Apple Watch Actions
  private func postAppleWatchNotification(sender: String, message: String, replies: [String], completion: @escaping (Bool) -> Void) {
    let center = UNUserNotificationCenter.current()
    
    center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
      guard granted, error == nil else {
        completion(false)
        return
      }
      
      // Create quick reply action buttons for Apple Watch & iOS banner
      var actions: [UNNotificationAction] = []
      
      for (index, reply) in replies.prefix(4).enumerated() {
        let action = UNNotificationAction(
          identifier: "SMART_REPLY_ACTION_\(index)",
          title: reply,
          options: [] // Non-foreground: user replies directly from Apple Watch screen
        )
        actions.append(action)
      }
      
      // Add text input action for Apple Watch Scribble / Dictation
      let textInputAction = UNTextInputNotificationAction(
        identifier: "SMART_REPLY_ACTION_CUSTOM",
        title: "Dictate / Type...",
        options: [],
        textInputButtonTitle: "Send",
        textInputPlaceholder: "Reply to \(sender)"
      )
      actions.append(textInputAction)
      
      // Dynamic category for this notification
      let category = UNNotificationCategory(
        identifier: AppDelegate.categoryIdentifier,
        actions: actions,
        intentIdentifiers: [],
        options: [.customDismissAction]
      )
      
      center.setNotificationCategories([category])
      
      // Create notification content
      let content = UNMutableNotificationContent()
      content.title = sender
      content.body = message
      content.sound = .default
      content.categoryIdentifier = AppDelegate.categoryIdentifier
      content.userInfo = [
        "sender": sender,
        "replies": replies
      ]
      
      // Immediate delivery
      let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.2, repeats: false)
      let request = UNNotificationRequest(
        identifier: "smart_reply_\(UUID().uuidString)",
        content: content,
        trigger: trigger
      )
      
      center.add(request) { error in
        if let error = error {
          print("[SmartReply] Error scheduling Apple Watch notification: \(error)")
          completion(false)
        } else {
          // If WatchConnectivity session is active and watch is reachable, send direct payload
          if WCSession.isSupported() && WCSession.default.isReachable {
            WCSession.default.sendMessage([
              "type": "new_smart_reply",
              "sender": sender,
              "message": message,
              "replies": replies
            ], replyHandler: nil, errorHandler: nil)
          }
          completion(true)
        }
      }
    }
  }
  
  // MARK: - UNUserNotificationCenterDelegate
  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    if #available(iOS 14.0, *) {
      completionHandler([.banner, .sound, .badge])
    } else {
      completionHandler([.alert, .sound, .badge])
    }
  }
  
  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo
    let sender = userInfo["sender"] as? String ?? response.notification.request.content.title
    var selectedReply: String? = nil
    
    // Check if user replied using Apple Watch Scribble/Dictation
    if let textResponse = response as? UNTextInputNotificationResponse {
      selectedReply = textResponse.userText
    } else {
      // Check if user tapped one of the smart reply suggestion buttons
      let actionId = response.actionIdentifier
      if actionId.starts(with: "SMART_REPLY_ACTION_") {
        if let indexStr = actionId.components(separatedBy: "_").last,
           let index = Int(indexStr),
           let replies = userInfo["replies"] as? [String],
           index >= 0 && index < replies.count {
          selectedReply = replies[index]
        }
      }
    }
    
    if let reply = selectedReply {
      dispatchWatchReplyToFlutter(sender: sender, reply: reply)
    }
    
    completionHandler()
  }
  
  // MARK: - Dispatch Reply to Flutter
  private func dispatchWatchReplyToFlutter(sender: String, reply: String) {
    DispatchQueue.main.async { [weak self] in
      self?.methodChannel?.invokeMethod("onWatchReplyReceived", arguments: [
        "sender": sender,
        "reply": reply,
        "timestamp": Int(Date().timeIntervalSince1970 * 1000)
      ])
    }
  }
  
  // MARK: - WCSessionDelegate
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    // Session activated
  }
  
  func sessionDidBecomeInactive(_ session: WCSession) {}
  func sessionDidDeactivate(_ session: WCSession) {
    WCSession.default.activate()
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
    if let action = message["action"] as? String, action == "smart_reply_selected",
       let sender = message["sender"] as? String,
       let reply = message["reply"] as? String {
      dispatchWatchReplyToFlutter(sender: sender, reply: reply)
      replyHandler(["status": "success", "sent": true])
    } else {
      replyHandler(["status": "unknown_action"])
    }
  }
}
