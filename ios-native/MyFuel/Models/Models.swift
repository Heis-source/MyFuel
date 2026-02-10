import Foundation

// MARK: - API Response

struct ApiResponse: Codable {
    let success: Bool
    let results: Results
}

struct Results: Codable {
    let fuelStations: [FuelStation]
    let chargers: [Charger]
}

// MARK: - Fuel Station

struct FuelStation: Codable, Identifiable {
    let brand: String?
    let address: String?
    let priceGasoline95: String?
    let priceDiesel: String?
    let priceGasoline98: String?
    let lat: Double
    let lon: Double
    let distance: Double?

    var id: String { "\(lat)-\(lon)-\(brand ?? "unknown")" }

    var displayName: String {
        brand ?? "Gasolinera"
    }

    var displayPrice: String {
        priceGasoline95 ?? priceDiesel ?? priceGasoline98 ?? "N/A"
    }

    enum CodingKeys: String, CodingKey {
        case brand = "Rótulo"
        case address = "Dirección"
        case priceGasoline95 = "Precio Gasolina 95 E5"
        case priceDiesel = "Precio Gasoleo A"
        case priceGasoline98 = "Precio Gasolina 98 E5"
        case lat
        case lon
        case distance
    }
}

// MARK: - Charger

struct Charger: Codable, Identifiable {
    let name: String?
    let latitude: Double
    let longitude: Double
    let connectors: [Connector]
    let distance: Double?

    var id: String { "\(latitude)-\(longitude)-\(name ?? "unknown")" }

    var displayName: String {
        name ?? "Cargador EV"
    }

    var displayPower: String {
        guard let first = connectors.first else { return "N/A" }
        let power = first.power.map { "\(Int($0))kW" } ?? "?"
        let type = first.type ?? "?"
        return "\(power) - \(type)"
    }
}

// MARK: - Connector

struct Connector: Codable {
    let type: String?
    let power: Double?
}
