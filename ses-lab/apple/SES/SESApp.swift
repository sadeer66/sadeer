import SwiftUI

@main
struct SESApp: App {
    var body: some Scene {
        WindowGroup { StudioView().ignoresSafeArea(edges: []) }
    }
}
struct StudioView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> StudioController { StudioController() }
    func updateUIViewController(_ uiViewController: StudioController, context: Context) {}
}
