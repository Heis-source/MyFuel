import SwiftUI
import MapKit

// MARK: - Main Content View

/// Vista principal de la aplicación MyFuel.
/// Muestra un mapa con marcadores de gasolineras o cargadores según el toggle.
struct ContentView: View {

    @StateObject private var viewModel = FuelViewModel()
    @StateObject private var locationManager = LocationManager()

    @Environment(\.scenePhase) private var scenePhase

    @State private var cameraPosition: MapCameraPosition = .automatic
    @State private var hasInitialLoad = false
    @State private var lastFetchLocation: CLLocation?
    @State private var lastFetchAt: Date?

    var body: some View {
        ZStack {
            // MARK: - Mapa
            mapView

            // MARK: - Panel de control
            VStack {
                Spacer()
                controlPanel
            }

            // MARK: - Loading overlay
            if viewModel.isLoading && !viewModel.hasData {
                loadingOverlay
            }

            // MARK: - Error de ubicación
            if let error = locationManager.locationError {
                locationErrorBanner(error)
            }
        }
        .onAppear {
            locationManager.startTracking()
        }
        .onChange(of: scenePhase) { _, phase in
            switch phase {
            case .active:
                locationManager.startTracking()
            case .inactive, .background:
                locationManager.stopUpdating()
            @unknown default:
                break
            }
        }
        .onChange(of: locationManager.userLocation) { _, newLocation in
            guard let location = newLocation else { return }

            // Setear cámara solo una vez (no forzamos seguimiento de cámara para no "pelear" con el usuario).
            if !hasInitialLoad {
                hasInitialLoad = true
                cameraPosition = .region(MKCoordinateRegion(
                    center: location,
                    span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
                ))
            }

            // Ubicación constante, pero evitamos spamear el backend con cada update.
            // Reglas: refrescar si han pasado >= 20s o si te has movido >= 150m.
            let now = Date()
            let newLoc = CLLocation(latitude: location.latitude, longitude: location.longitude)
            let shouldFetchByTime: Bool = {
                guard let lastFetchAt else { return true }
                return now.timeIntervalSince(lastFetchAt) >= 20
            }()
            let shouldFetchByDistance: Bool = {
                guard let lastFetchLocation else { return true }
                return newLoc.distance(from: lastFetchLocation) >= 150
            }()

            guard shouldFetchByTime || shouldFetchByDistance else { return }
            lastFetchAt = now
            lastFetchLocation = newLoc

            // Precisión exacta: no redondeamos coordenadas.
            viewModel.fetchNearbyStations(coordinate: location)
        }
        .alert("Error", isPresented: .constant(isErrorState)) {
            Button("Reintentar") {
                if let location = locationManager.userLocation {
                    viewModel.fetchNearbyStations(coordinate: location)
                }
            }
            Button("OK", role: .cancel) { }
        } message: {
            if case .error(let message) = viewModel.uiState {
                Text(message)
            }
        }
    }

    // MARK: - Map View

    private var mapView: some View {
        Map(position: $cameraPosition) {
            // Ubicación del usuario
            UserAnnotation()

            // Marcadores según el tipo seleccionado
            if viewModel.viewType == .fuel {
                ForEach(viewModel.fuelStations) { station in
                    Annotation(
                        station.displayName,
                        coordinate: CLLocationCoordinate2D(
                            latitude: station.lat,
                            longitude: station.lon
                        )
                    ) {
                        FuelMarkerView(
                            name: station.displayName,
                            detail: "\(station.displayPrice)€"
                        )
                    }
                }
            } else {
                ForEach(viewModel.chargers) { charger in
                    Annotation(
                        charger.displayName,
                        coordinate: CLLocationCoordinate2D(
                            latitude: charger.latitude,
                            longitude: charger.longitude
                        )
                    ) {
                        ChargerMarkerView(
                            name: charger.displayName,
                            detail: charger.displayPower
                        )
                    }
                }
            }
        }
        .mapControls {
            MapUserLocationButton()
            MapCompass()
            MapScaleView()
        }
        .ignoresSafeArea()
    }

    // MARK: - Control Panel

    private var controlPanel: some View {
        VStack(spacing: 12) {
            // Toggle Gasolina / Eléctrico
            Picker("Tipo", selection: $viewModel.viewType) {
                ForEach(ViewType.allCases, id: \.self) { type in
                    Text(type.rawValue).tag(type)
                }
            }
            .pickerStyle(.segmented)

            // Botón Actualizar
            Button(action: refreshAction) {
                HStack(spacing: 8) {
                    if viewModel.isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Image(systemName: "arrow.clockwise")
                    }
                    Text("Actualizar Zona")
                        .fontWeight(.bold)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(
                    LinearGradient(
                        colors: [Color(hex: "1e3a8a"), Color(hex: "2563eb")],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(viewModel.isLoading)
        }
        .padding(16)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 4)
        .padding(.horizontal, 20)
        .padding(.bottom, 40)
    }

    // MARK: - Loading Overlay

    private var loadingOverlay: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(Color(hex: "1e3a8a"))
            Text("Localizando...")
                .font(.headline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.ultraThinMaterial)
    }

    // MARK: - Error Banner

    private func locationErrorBanner(_ message: String) -> some View {
        VStack {
            HStack {
                Image(systemName: "location.slash.fill")
                    .foregroundColor(.white)
                Text(message)
                    .font(.caption)
                    .foregroundColor(.white)
                Spacer()
            }
            .padding(12)
            .background(Color.red.opacity(0.9))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .padding(.horizontal, 20)
            .padding(.top, 60)

            Spacer()
        }
    }

    // MARK: - Helpers

    private var isErrorState: Bool {
        if case .error = viewModel.uiState { return true }
        return false
    }

    private func refreshAction() {
        if let location = locationManager.userLocation {
            lastFetchAt = Date()
            lastFetchLocation = CLLocation(latitude: location.latitude, longitude: location.longitude)
            cameraPosition = .region(MKCoordinateRegion(
                center: location,
                span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
            ))
            viewModel.fetchNearbyStations(coordinate: location)
        } else {
            locationManager.startTracking()
        }
    }
}

// MARK: - Fuel Marker View

struct FuelMarkerView: View {
    let name: String
    let detail: String

    var body: some View {
        VStack(spacing: 2) {
            Image(systemName: "fuelpump.fill")
                .font(.title2)
                .foregroundColor(.white)
                .padding(8)
                .background(
                    Circle()
                        .fill(Color.orange)
                        .shadow(color: .orange.opacity(0.4), radius: 4)
                )
            Text(detail)
                .font(.caption2)
                .fontWeight(.bold)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.white.opacity(0.9))
                .clipShape(Capsule())
                .shadow(radius: 2)
        }
    }
}

// MARK: - Charger Marker View

struct ChargerMarkerView: View {
    let name: String
    let detail: String

    var body: some View {
        VStack(spacing: 2) {
            Image(systemName: "bolt.fill")
                .font(.title2)
                .foregroundColor(.white)
                .padding(8)
                .background(
                    Circle()
                        .fill(Color.green)
                        .shadow(color: .green.opacity(0.4), radius: 4)
                )
            Text(detail)
                .font(.caption2)
                .fontWeight(.bold)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.white.opacity(0.9))
                .clipShape(Capsule())
                .shadow(radius: 2)
        }
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: Double
        switch hex.count {
        case 6:
            r = Double((int >> 16) & 0xFF) / 255.0
            g = Double((int >> 8) & 0xFF) / 255.0
            b = Double(int & 0xFF) / 255.0
        default:
            r = 1; g = 1; b = 1
        }
        self.init(red: r, green: g, blue: b)
    }
}

// MARK: - Preview

#Preview {
    ContentView()
}
