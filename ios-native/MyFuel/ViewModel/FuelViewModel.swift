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

    init(networkService: NetworkService = .shared) {
        self.networkService = networkService
    }

    /// Obtiene estaciones cercanas a las coordenadas dadas.
    func fetchNearbyStations(latitude: Double, longitude: Double) {
        uiState = .loading

        Task {
            do {
                let response = try await networkService.fetchNearbyStations(
                    latitude: latitude,
                    longitude: longitude
                )

                if response.success {
                    fuelStations = response.results.fuelStations
                    chargers = response.results.chargers
                    uiState = .success(
                        fuelStations: response.results.fuelStations,
                        chargers: response.results.chargers
                    )
                } else {
                    uiState = .error(message: "Error al obtener datos")
                }
            } catch {
                uiState = .error(message: error.localizedDescription)
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
