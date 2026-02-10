package com.myfuel.mobile.models

import com.google.gson.annotations.SerializedName

data class ApiResponse(
    val success: Boolean,
    val results: Results
)

data class Results(
    val fuelStations: List<FuelStation>,
    val chargers: List<Charger>
)

data class FuelStation(
    @SerializedName("Rótulo")
    val brand: String?,
    
    @SerializedName("Dirección")
    val address: String?,
    
    @SerializedName("Precio Gasolina 95 E5")
    val priceGasoline95: String?,
    
    @SerializedName("Precio Gasoleo A")
    val priceDiesel: String?,
    
    @SerializedName("Precio Gasolina 98 E5")
    val priceGasoline98: String?,
    
    val lat: Double,
    val lon: Double,
    val distance: Double?
) {
    fun getDisplayPrice(): String {
        return priceGasoline95 ?: priceDiesel ?: priceGasoline98 ?: "N/A"
    }
    
    fun getDisplayName(): String {
        return brand ?: "Gasolinera"
    }
}

data class Charger(
    val name: String?,
    val latitude: Double,
    val longitude: Double,
    val connectors: List<Connector>,
    val distance: Double?
) {
    fun getDisplayName(): String {
        return name ?: "Cargador EV"
    }
    
    fun getDisplayPower(): String {
        return connectors.firstOrNull()?.let { "${it.power}kW - ${it.type}" } ?: "N/A"
    }
}

data class Connector(
    val type: String?,
    val power: Double?
)
