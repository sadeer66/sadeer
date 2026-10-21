import UIKit
import WebKit

final class StudioController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler, UIDocumentPickerDelegate, WKDownloadDelegate {
    private var webView: WKWebView!
    private var server: LocalServer?
    private var exportID: String?
    private var exportURL: URL?
    private var downloads: [ObjectIdentifier: URL] = [:]

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.953, green: 0.918, blue: 0.859, alpha: 1)
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        configuration.userContentController.add(self, name: "sesFiles")
        configuration.userContentController.addUserScript(WKUserScript(source: "window.print=function(){window.webkit.messageHandlers.sesFiles.postMessage({action:'print'})};", injectionTime: .atDocumentStart, forMainFrameOnly: false))
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = view.backgroundColor
        webView.scrollView.bounces = false
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor), webView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor), webView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor), webView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor)])
        guard let root = Bundle.main.url(forResource: "Web", withExtension: nil) else {
            showError("ملفات SES المحلية غير موجودة في الحزمة."); return
        }
        // Block optional remote helpers. All working assets are bundled locally.
        let rules = "[{\"trigger\":{\"url-filter\":\"^https?://\",\"unless-domain\":[\"127.0.0.1\",\"localhost\"]},\"action\":{\"type\":\"block\"}}]"
        WKContentRuleListStore.default().compileContentRuleList(forIdentifier: "SESLocalAssets", encodedContentRuleList: rules) { [weak self] list, error in
            DispatchQueue.main.async {
                guard let self = self else { return }
                guard let list = list else { self.showError(error?.localizedDescription ?? "تعذّر تجهيز التشغيل المحلي"); return }
                self.webView.configuration.userContentController.add(list)
                let server = LocalServer(root: root)
                self.server = server
                server.start { [weak self] result in
                    switch result {
                    case .success(let url): self?.webView.load(URLRequest(url: url))
                    case .failure(let error): self?.showError(error.localizedDescription)
                    }
                }
            }
        }
    }

    private var presenter: UIViewController { presentedViewController ?? self }
    private func showError(_ message: String) {
        let alert = UIAlertController(title: "SES", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "حسنًا", style: .default))
        presenter.present(alert, animated: true)
    }
    private func completeExport(error: String?) {
        guard let id = exportID else { return }
        let args: [Any] = [id, error as Any? ?? NSNull()]
        if let data = try? JSONSerialization.data(withJSONObject: args), let json = String(data: data, encoding: .utf8) {
            webView.evaluateJavaScript("window.SESNativeComplete.apply(null,\(json))", completionHandler: nil)
        }
        if let url = exportURL { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        exportID = nil; exportURL = nil
    }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let action = body["action"] as? String else { return }
        if action == "print", let source = message.webView {
            let printUI = UIPrintInteractionController.shared
            printUI.printFormatter = source.viewPrintFormatter()
            printUI.present(animated: true, completionHandler: nil)
            return
        }
        guard action == "save", message.frameInfo.isMainFrame, message.webView === webView, let id = body["id"] as? String, let text = body["text"] as? String, let name = body["name"] as? String, exportID == nil else { return }
        exportID = id
        do {
            let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            let filename = URL(fileURLWithPath: name).lastPathComponent
            let url = folder.appendingPathComponent(filename.isEmpty ? "SES-Project.ses" : filename)
            try Data(text.utf8).write(to: url, options: .atomic)
            exportURL = url
            let picker = UIDocumentPickerViewController(forExporting: [url], asCopy: true)
            picker.delegate = self
            presenter.present(picker, animated: true)
        } catch { completeExport(error: error.localizedDescription) }
    }
    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) { completeExport(error: nil) }
    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) { completeExport(error: "أُلغي تصدير الملف؛ بقي المشروع محفوظًا داخل التطبيق") }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if action.shouldPerformDownload { decisionHandler(.download); return }
        if let url = action.request.url, let scheme = url.scheme, ["http", "https"].contains(scheme), url.host != "127.0.0.1" {
            if action.navigationType == .linkActivated { UIApplication.shared.open(url) }
            decisionHandler(.cancel); return
        }
        decisionHandler(.allow)
    }
    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) { download.delegate = self }
    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) { download.delegate = self }
    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        do { try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            let file = folder.appendingPathComponent(URL(fileURLWithPath: suggestedFilename).lastPathComponent)
            downloads[ObjectIdentifier(download)] = file; completionHandler(file)
        } catch { completionHandler(nil); showError(error.localizedDescription) }
    }
    func downloadDidFinish(_ download: WKDownload) {
        guard let file = downloads.removeValue(forKey: ObjectIdentifier(download)) else { return }
        let activity = UIActivityViewController(activityItems: [file], applicationActivities: nil)
        activity.popoverPresentationController?.sourceView = view
        activity.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
        activity.completionWithItemsHandler = { _, _, _, _ in try? FileManager.default.removeItem(at: file.deletingLastPathComponent()) }
        presenter.present(activity, animated: true)
    }
    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) { downloads.removeValue(forKey: ObjectIdentifier(download)); showError(error.localizedDescription) }
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: "SES", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "حسنًا", style: .default) { _ in completionHandler() }); presenter.present(alert, animated: true)
    }
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: "SES", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "إلغاء", style: .cancel) { _ in completionHandler(false) }); alert.addAction(UIAlertAction(title: "متابعة", style: .default) { _ in completionHandler(true) }); presenter.present(alert, animated: true)
    }
    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        let alert = UIAlertController(title: "SES", message: prompt, preferredStyle: .alert)
        alert.addTextField { $0.text = defaultText }; alert.addAction(UIAlertAction(title: "إلغاء", style: .cancel) { _ in completionHandler(nil) }); alert.addAction(UIAlertAction(title: "حسنًا", style: .default) { _ in completionHandler(alert.textFields?.first?.text) }); presenter.present(alert, animated: true)
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        let popup = WKWebView(frame: view.bounds, configuration: configuration)
        popup.navigationDelegate = self; popup.uiDelegate = self
        let controller = UIViewController(); controller.view = popup
        controller.navigationItem.leftBarButtonItem = UIBarButtonItem(title: "إغلاق", style: .done, target: self, action: #selector(closePopup))
        presenter.present(UINavigationController(rootViewController: controller), animated: true)
        return popup
    }
    @objc private func closePopup() { presentedViewController?.dismiss(animated: true) }
    func webViewDidClose(_ webView: WKWebView) { closePopup() }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { showError("توقفت مساحة العمل بسبب ضغط الذاكرة. أعد فتح التطبيق واستعد آخر حفظ تلقائي.") }
}
