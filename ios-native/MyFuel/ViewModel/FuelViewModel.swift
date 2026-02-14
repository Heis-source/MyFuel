import Foundation
import CoreLocation

// MARK: - UI State

/// Estado de la interfaz, análogo al UiState de Android.
enum UiState: Equatable {
    case idle
    case loading
    case success(fuelStations: [FuelStation], chargers: [Charger])
    case error(message: String)

    static func == (lhs: UiState, rhs: UiState) -> Bool {
        switch (lhs, rhs) {
        case (.idle, .idle), (.loading, .loading):
            return true
        case (.error(let a), .error(let b)):
            return a == b
        case (.success, .success):
            return true
        default:
            return false
        }
    }
}

/// Tipo de vista seleccionada.
enum ViewType: String, CaseIterable {
    case fuel = "⛽️ Gasolina"
    case electric = "⚡️ Eléctrico"
}

// MARK: - ViewModel

/// ViewModel principal. Equivalente al MainViewModel de Android.
@MainActor
final class FuelViewModel: ObservableObject {

    @Published var uiState: UiState = .idle
    @Published var viewType: ViewType = .fuel
    @Published var fuelStations: [FuelStation] = []
    @Published var chargers: [Charger] = []

    private let networkService: NetworkService
    private var currentFetchTask: Task<Void, Never>?

    init(networkService: NetworkService = .shared) {
        self.networkService = networkService
    }

    /// Obtiene estaciones cercanas a las coordenadas dadas.
    func fetchNearbyStations(latitude: Double, longitude: Double) {
        uiState = .loading
        currentFetchTask?.cancel()
        currentFetchTask = Task { [weak self] in
            guard let self else { return }
            do {
                let response = try await self.networkService.fetchNearbyStations(
                    latitude: latitude,
                    longitude: longitude
                )

                if response.success {
                    self.fuelStations = response.results.fuelStations
                    self.chargers = response.results.chargers
                    self.uiState = .success(
                        fuelStations: response.results.fuelStations,
                        chargers: response.results.chargers
                    )
                } else {
                    self.uiState = .error(message: "Error al obtener datos")
                }
            } catch is CancellationError {
                // Ignorar: se canceló por una request más nueva.
            } catch {
                // Mensaje estable (no filtra detalles internos).
                self.uiState = .error(message: "No se pudo cargar la información. Revisa tu conexión e inténtalo de nuevo.")
            }
        }
    }

    /// Obtiene estaciones usando una coordenada CLLocationCoordinate2D.
    func fetchNearbyStations(coordinate: CLLocationCoordinate2D) {
        fetchNearbyStations(latitude: coordinate.latitude, longitude: coordinate.longitude)
    }

    /// Indica si hay datos cargados.
    var hasData: Bool {
        !fuelStations.isEmpty || !chargers.isEmpty
    }

    /// Indica si está cargando.
    var isLoading: Bool {
        uiState == .loading
    }
}
