import Foundation

/// Servicio de red para comunicarse con el backend MyFuel.
/// Equivalente al RetrofitClient + ApiService de Android.
final class NetworkService {

    // MARK: - Configuration

    /// URL del backend en producción (Render).
    /// Para desarrollo local: cambiar a "http://localhost:3000"
    static let baseURL = "https://my-fuel-three.vercel.app"

    static let shared = NetworkService()

    private let session: URLSession

    private init() {
        // Ephemeral: evita caché/cookies persistentes (menos exposición de datos).
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 30
        session = URLSession(configuration: config)
    }

    // MARK: - API

    /// Obtiene estaciones de combustible y cargadores eléctricos cercanos.
    /// - Parameters:
    ///   - latitude: Latitud del usuario.
    ///   - longitude: Longitud del usuario.
    /// - Returns: `ApiResponse` con los resultados.
    func fetchNearbyStations(latitude: Double, longitude: Double) async throws -> ApiResponse {
        guard var components = URLComponents(string: "\(Self.baseURL)/apiv1/nearby") else {
            throw NetworkError.invalidURL
        }

        components.queryItems = [
            URLQueryItem(name: "lat", value: String(latitude)),
            URLQueryItem(name: "lon", value: String(longitude))
        ]

        guard let url = components.url else {
            throw NetworkError.invalidURL
        }

        let (data, response) = try await session.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.httpError(statusCode: httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        do {
            return try decoder.decode(ApiResponse.self, from: data)
        } catch {
            throw NetworkError.decodingError(error)
        }
    }
}

// MARK: - Errors

enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "URL inválida"
        case .invalidResponse:
            return "Respuesta del servidor inválida"
        case .httpError(let statusCode):
            return "Error HTTP: \(statusCode)"
        case .decodingError(let error):
            return "Error al procesar datos: \(error.localizedDescription)"
        }
    }
}
