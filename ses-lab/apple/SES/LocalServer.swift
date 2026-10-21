import Foundation
import Network
import UniformTypeIdentifiers

final class LocalServer {
    static let port: NWEndpoint.Port = 58266
    private let root: URL
    private let queue = DispatchQueue(label: "com.sadeer.ses.bundle", qos: .userInitiated)
    private var listener: NWListener?
    init(root: URL) { self.root = root.standardizedFileURL }

    func start(ready: @escaping (Result<URL, Error>) -> Void) {
        do {
            let parameters = NWParameters.tcp
            parameters.requiredInterfaceType = .loopback
            let listener = try NWListener(using: parameters, on: Self.port)
            self.listener = listener
            var delivered = false
            listener.stateUpdateHandler = { state in
                if case .ready = state, !delivered {
                    delivered = true
                    DispatchQueue.main.async { ready(.success(URL(string: "http://127.0.0.1:58266/index.html")!)) }
                } else if case .failed(let error) = state, !delivered {
                    delivered = true
                    DispatchQueue.main.async { ready(.failure(error)) }
                }
            }
            listener.newConnectionHandler = { [weak self] connection in
                guard let self = self else { connection.cancel(); return }
                connection.start(queue: self.queue)
                self.receive(connection, buffer: Data())
            }
            listener.start(queue: queue)
        } catch { ready(.failure(error)) }
    }

    private func receive(_ connection: NWConnection, buffer: Data) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 16384) { [weak self] data, _, complete, error in
            guard let self = self else { connection.cancel(); return }
            var buffer = buffer
            if let data = data { buffer.append(data) }
            if buffer.count > 32768 { self.reply(connection, status: "413 Payload Too Large"); return }
            if buffer.range(of: Data("\r\n\r\n".utf8)) != nil { self.serve(connection, request: buffer); return }
            if complete || error != nil { connection.cancel(); return }
            self.receive(connection, buffer: buffer)
        }
    }

    private func serve(_ connection: NWConnection, request: Data) {
        guard let text = String(data: request, encoding: .utf8), let line = text.components(separatedBy: "\r\n").first else {
            reply(connection, status: "400 Bad Request"); return
        }
        let parts = line.split(separator: " ")
        guard parts.count == 3, parts[0] == "GET" || parts[0] == "HEAD" else {
            reply(connection, status: "405 Method Not Allowed"); return
        }
        let target = String(parts[1]).components(separatedBy: "?")[0]
        guard let decoded = target.removingPercentEncoding, decoded.hasPrefix("/"), !decoded.contains("\0"), !decoded.contains("\\"), !decoded.split(separator: "/").contains("..") else {
            reply(connection, status: "403 Forbidden"); return
        }
        var file = root.appendingPathComponent(String(decoded.dropFirst())).standardizedFileURL
        guard file.path == root.path || file.path.hasPrefix(root.path + "/") else {
            reply(connection, status: "403 Forbidden"); return
        }
        var isDirectory: ObjCBool = false
        if FileManager.default.fileExists(atPath: file.path, isDirectory: &isDirectory), isDirectory.boolValue { file.appendPathComponent("index.html") }
        guard let data = try? Data(contentsOf: file, options: .mappedIfSafe) else {
            reply(connection, status: "404 Not Found"); return
        }
        let explicit = ["html": "text/html; charset=utf-8", "js": "text/javascript; charset=utf-8", "css": "text/css; charset=utf-8", "json": "application/json", "webmanifest": "application/manifest+json", "svg": "image/svg+xml", "woff2": "font/woff2"]
        let mime = explicit[file.pathExtension.lowercased()] ?? UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        reply(connection, status: "200 OK", data: data, mime: mime, head: parts[0] == "HEAD")
    }

    private func reply(_ connection: NWConnection, status: String, data: Data = Data(), mime: String = "text/plain", head: Bool = false) {
        var packet = Data("HTTP/1.1 \(status)\r\nContent-Type: \(mime)\r\nContent-Length: \(data.count)\r\nConnection: close\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\n\r\n".utf8)
        if !head { packet.append(data) }
        connection.send(content: packet, completion: .contentProcessed { _ in connection.cancel() })
    }
    deinit { listener?.cancel() }
}
