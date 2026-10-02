import UIKit
import WebKit

final class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    private var webView: WKWebView!

    override func loadView() {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.websiteDataStore = .default()

        let downloadBridge = """
        (() => {
          if (window.__furniplanIOSDownloadBridgeInstalled) return;
          window.__furniplanIOSDownloadBridgeInstalled = true;

          const handler = window.webkit?.messageHandlers?.furniplanDownload;
          if (!handler) return;

          const toBase64 = (buffer) => {
            const bytes = new Uint8Array(buffer);
            let binary = "";
            const chunk = 0x8000;
            for (let i = 0; i < bytes.length; i += chunk) {
              binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)));
            }
            return btoa(binary);
          };

          const shareDownload = async (href, filename) => {
            try {
              const response = await fetch(href);
              const blob = await response.blob();
              const buffer = await blob.arrayBuffer();
              handler.postMessage({
                filename: filename || "FurniPlan-Export",
                mimeType: blob.type || "application/octet-stream",
                base64: toBase64(buffer)
              });
            } catch (error) {
              console.error("FurniPlan iOS save failed", error);
              alert("Unable to save this file on iPhone/iPad.");
            }
          };

          const originalClick = HTMLAnchorElement.prototype.click;
          HTMLAnchorElement.prototype.click = function() {
            const href = this.href || this.getAttribute("href") || "";
            if (this.hasAttribute("download") && href) {
              shareDownload(href, this.download || "FurniPlan-Export");
              return;
            }
            return originalClick.call(this);
          };

          document.addEventListener("click", (event) => {
            const target = event.target instanceof Element ? event.target.closest("a[download]") : null;
            if (!target) return;
            const href = target.href || target.getAttribute("href") || "";
            if (!href) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            shareDownload(href, target.download || "FurniPlan-Export");
          }, true);

          window.FurniPlanIOSSave = shareDownload;
        })();
        """
        config.userContentController.addUserScript(
            WKUserScript(source: downloadBridge, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        )
        config.userContentController.add(self, name: "furniplanDownload")

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = false
        webView.scrollView.bounces = false
        webView.backgroundColor = .black
        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        guard
            let webRoot = Bundle.main.url(forResource: "Web", withExtension: nil),
            let indexURL = URL(string: "index.html", relativeTo: webRoot)
        else {
            showMissingFiles()
            return
        }

        webView.loadFileURL(indexURL, allowingReadAccessTo: webRoot)
    }

    private func showMissingFiles() {
        let html = """
        <html><body style="background:#0f172a;color:white;font-family:-apple-system;padding:40px">
        <h2>FurniPlan</h2><p>Application files were not found.</p>
        </body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }

    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        if navigationAction.targetFrame == nil, let url = navigationAction.request.url {
            if url.scheme == "http" || url.scheme == "https" {
                UIApplication.shared.open(url)
            } else {
                webView.load(navigationAction.request)
            }
        }
        return nil
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptAlertPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping () -> Void
    ) {
        let alert = UIAlertController(title: "FurniPlan", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptConfirmPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (Bool) -> Void
    ) {
        let alert = UIAlertController(title: "FurniPlan", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        present(alert, animated: true)
    }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "furniplanDownload",
              let payload = message.body as? [String: Any],
              let base64 = payload["base64"] as? String,
              let data = Data(base64Encoded: base64)
        else { return }

        let suppliedName = (payload["filename"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let mimeType = payload["mimeType"] as? String ?? "application/octet-stream"
        var filename = (suppliedName?.isEmpty == false ? suppliedName! : "FurniPlan-Export")

        if URL(fileURLWithPath: filename).pathExtension.isEmpty {
            if mimeType.contains("pdf") {
                filename += ".pdf"
            } else if mimeType.contains("png") {
                filename += ".png"
            }
        }

        let invalid = CharacterSet(charactersIn: "/\\:?%*|\"<>")
        filename = filename.components(separatedBy: invalid).joined(separator: "_")

        do {
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
            try? FileManager.default.removeItem(at: url)
            try data.write(to: url, options: .atomic)
            presentShareSheet(for: url)
        } catch {
            showSaveError()
        }
    }

    private func presentShareSheet(for url: URL) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            let controller = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            if let popover = controller.popoverPresentationController {
                popover.sourceView = self.view
                popover.sourceRect = CGRect(
                    x: self.view.bounds.midX,
                    y: self.view.bounds.maxY - 40,
                    width: 1,
                    height: 1
                )
                popover.permittedArrowDirections = []
            }
            self.present(controller, animated: true)
        }
    }

    private func showSaveError() {
        DispatchQueue.main.async { [weak self] in
            let alert = UIAlertController(
                title: "FurniPlan",
                message: "Unable to save the exported file.",
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            self?.present(alert, animated: true)
        }
    }

    deinit {
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "furniplanDownload")
    }
}
