import Foundation
import CoreLocation
import Combine

/// Gestor de ubicación observable para SwiftUI.
/// Encapsula CLLocationManager y publica la ubicación actual.
final class LocationManager: NSObject, ObservableObject {

    @Published var userLocation: CLLocationCoordinate2D?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var locationError: String?

    private let manager = CLLocationManager()
    private var wantsTracking = false

    override init() {
        super.init()
        manager.delegate = self
        // Máxima precisión: el usuario ha pedido ubicación exacta.
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 25 // Actualizar cada ~25m (ajustable)
        manager.pausesLocationUpdatesAutomatically = true
        manager.allowsBackgroundLocationUpdates = false
    }

    /// Empieza el tracking mientras la app está activa (foreground).
    func startTracking() {
        wantsTracking = true
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            manager.startUpdatingLocation()
        case .denied, .restricted:
            locationError = "Permiso de ubicación denegado. Actívalo en Ajustes."
        @unknown default:
            break
        }
    }

    /// Detiene el tracking (por ejemplo, al ir a background).
    func stopUpdating() {
        wantsTracking = false
        manager.stopUpdatingLocation()
    }
}

// MARK: - CLLocationManagerDelegate

extension LocationManager: CLLocationManagerDelegate {

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus

        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            locationError = nil
            if wantsTracking {
                manager.startUpdatingLocation()
            }
        case .denied, .restricted:
            locationError = "Permiso de ubicación denegado. Actívalo en Ajustes."
        case .notDetermined:
            break
        @unknown default:
            break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        DispatchQueue.main.async {
            self.userLocation = location.coordinate
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        DispatchQueue.main.async {
            self.locationError = "Error al obtener ubicación: \(error.localizedDescription)"
        }
    }
}
